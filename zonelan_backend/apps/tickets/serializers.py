from django.db import transaction
from rest_framework import serializers
from .models import Ticket, TicketItem
from apps.customers.serializers import CustomerSerializer
from apps.materials.serializers import MaterialSerializer
from apps.customers.models import Customer
from apps.materials.models import Material
from apps.materials.models import MaterialControl
from django.utils import timezone

class TicketItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_code = serializers.CharField(source='material.code', read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = TicketItem
        fields = [
            'id', 'ticket', 'material', 'material_name', 'material_code',
            'quantity', 'unit_price', 'discount_percentage', 'notes', 'total_price'
        ]
        read_only_fields = ['ticket']
    
    def validate(self, data):
        # Validar que hay suficiente stock
        material = data.get('material')
        quantity = data.get('quantity', 0)
        
        if quantity <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor que cero")
        
        # Si es una actualización, verificar la diferencia de cantidad
        if self.instance:
            # Si está reduciendo la cantidad, no verificar stock
            if quantity < self.instance.quantity:
                return data
            # Si está aumentando, verificar solo la diferencia
            available_stock = material.quantity + self.instance.quantity
            needed_stock = quantity
        else:
            # Es un nuevo item, verificar todo el stock
            available_stock = material.quantity
            needed_stock = quantity
            
        if needed_stock > available_stock:
            raise serializers.ValidationError(
                f"Stock insuficiente. Disponible: {available_stock}, Solicitado: {needed_stock}"
            )
        
        return data


class TicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_tax_id = serializers.CharField(source='customer.tax_id', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    items = TicketItemSerializer(many=True, read_only=True)
    created_at_formatted = serializers.SerializerMethodField()
    paid_at_formatted = serializers.SerializerMethodField()
    canceled_at_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'customer', 'customer_name', 'customer_tax_id',
            'created_at', 'created_at_formatted', 'created_by', 'created_by_username',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'total_amount', 'notes', 'paid_at', 'paid_at_formatted',
            'canceled_at', 'canceled_at_formatted', 'pdf_file', 'items'
        ]
        read_only_fields = ['id', 'ticket_number', 'created_at', 'created_by', 
                           'paid_at', 'canceled_at', 'total_amount', 'pdf_file']
    
    def get_created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M')
        return None
        
    def get_paid_at_formatted(self, obj):
        if obj.paid_at:
            return obj.paid_at.strftime('%d/%m/%Y %H:%M')
        return None
    
    def get_canceled_at_formatted(self, obj):
        if obj.canceled_at:
            return obj.canceled_at.strftime('%d/%m/%Y %H:%M')
        return None
    
    def create(self, validated_data):
        # Asignar el usuario actual como creador
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['id', 'customer', 'notes']
        read_only_fields = ['id']


class TicketItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketItem
        fields = ['id', 'ticket', 'material', 'quantity', 'unit_price', 'discount_percentage', 'notes']
        read_only_fields = ['id']
    
    def validate(self, data):
        # Validar que hay suficiente stock
        material = data.get('material')
        quantity = data.get('quantity', 0)
        
        if quantity <= 0:
            raise serializers.ValidationError({"quantity": "La cantidad debe ser mayor que cero"})
        
        # Verificar stock disponible
        available_stock = material.quantity
        
        if quantity > available_stock:
            raise serializers.ValidationError({
                "quantity": f"Stock insuficiente. Disponible: {available_stock}, Solicitado: {quantity}"
            })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        try:
            request = self.context.get('request')
            
            # Guardar el ticket item
            ticket_item = TicketItem.objects.create(**validated_data)
            
            # Actualizar el stock del material
            material = validated_data['material']
            quantity = validated_data['quantity']
            material.quantity -= quantity
            material.save(update_fields=['quantity'])
            
            # Registrar en MaterialControl
            if request and request.user:
                MaterialControl.objects.create(
                    user=request.user,
                    material=material,
                    quantity=quantity,
                    operation='REMOVE',
                    reason='VENTA',
                    ticket=validated_data['ticket'],
                    date=timezone.now()
                )
            
            return ticket_item
        except Exception as e:
            logger.error(f"Error en TicketItemCreateSerializer.create: {str(e)}")
            raise serializers.ValidationError(f"Error al crear el item: {str(e)}")