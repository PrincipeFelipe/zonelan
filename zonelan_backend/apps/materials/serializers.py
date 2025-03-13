from rest_framework import serializers
from .models import Material, MaterialControl

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'quantity', 'price']

class MaterialControlSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source='material.name')
    username = serializers.ReadOnlyField(source='user.username')
    operation_display = serializers.ReadOnlyField(source='get_operation_display')
    reason_display = serializers.ReadOnlyField(source='get_reason_display')
    report_id = serializers.PrimaryKeyRelatedField(source='report', read_only=True)
    ticket_id = serializers.PrimaryKeyRelatedField(source='ticket', read_only=True)
    # Asegurarse de que movement_id está explícitamente incluido
    movement_id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = MaterialControl
        fields = [
            'id', 'user', 'username', 'material', 'material_name', 'quantity', 
            'operation', 'operation_display', 'reason', 'reason_display', 
            'date', 'report', 'report_id', 'ticket', 'ticket_id', 
            'movement_id', 'location_reference', 'invoice_image'
        ]