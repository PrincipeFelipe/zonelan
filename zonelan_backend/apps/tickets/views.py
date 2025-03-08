from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from .models import Ticket, TicketItem
from .serializers import (
    TicketSerializer, TicketItemSerializer, 
    TicketCreateSerializer, TicketItemCreateSerializer
)
from apps.materials.models import Material, MaterialControl
import logging

logger = logging.getLogger(__name__)

class TicketViewSet(viewsets.ModelViewSet):
    """API para gestionar tickets de venta"""
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'customer']
    search_fields = ['ticket_number', 'customer__name', 'notes']
    ordering_fields = ['created_at', 'total_amount', 'status']
    
    def get_queryset(self):
        """Filtrar tickets por cliente, estado, fechas, etc."""
        queryset = super().get_queryset()
        
        # Filtros adicionales
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        amount_min = self.request.query_params.get('amount_min')
        amount_max = self.request.query_params.get('amount_max')
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        if amount_min:
            queryset = queryset.filter(total_amount__gte=amount_min)
        if amount_max:
            queryset = queryset.filter(total_amount__lte=amount_max)
        
        # Filtrar por cliente
        customer_id = self.request.query_params.get('customer', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # Filtrar por estado
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtrar por fechas
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TicketCreateSerializer
        return TicketSerializer
    
    def perform_create(self, serializer):
        # Asignar el usuario que crea el ticket
        serializer.save(created_by=self.request.user)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extraer datos de ítems si existen
        items_data = request.data.pop('items', [])
        
        # Serializar y validar el ticket
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save(created_by=request.user)
        
        # Procesar ítems si existen
        for item_data in items_data:
            # Convertir a diccionario si es un QueryDict
            if hasattr(item_data, 'dict'):
                item_data = item_data.dict()
            
            # Validar el ítem
            item_serializer = TicketItemCreateSerializer(data=item_data)
            if item_serializer.is_valid():
                # Obtener material y cantidad
                material_id = item_data.get('material')
                quantity = int(item_data.get('quantity', 0))
                
                if material_id and quantity > 0:
                    material = get_object_or_404(Material, id=material_id)
                    
                    # Verificar si hay stock suficiente
                    if material.quantity < quantity:
                        return Response({
                            'detail': f"No hay suficiente stock del material {material.name}. Disponible: {material.quantity}"
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Actualizar el stock
                    material.quantity -= quantity
                    material.save()
                    
                    # Registrar en el control de materiales
                    MaterialControl.objects.create(
                        user=request.user,
                        material=material,
                        quantity=quantity,
                        operation='REMOVE',
                        reason='VENTA',
                        ticket=ticket
                    )
                
                # Crear el ítem
                TicketItem.objects.create(
                    ticket=ticket,
                    **item_serializer.validated_data
                )
            else:
                return Response(item_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Devolver respuesta
        response_serializer = TicketSerializer(ticket, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        """Marcar ticket como pagado"""
        ticket = self.get_object()
        
        if ticket.status == 'CANCELED':
            return Response(
                {"detail": "No se puede marcar como pagado un ticket cancelado"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_method = request.data.get('payment_method')
        if payment_method:
            ticket.payment_method = payment_method
        
        ticket.status = 'PAID'
        ticket.save()
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar ticket"""
        ticket = self.get_object()
        
        if ticket.status == 'PAID':
            return Response(
                {"detail": "No se puede cancelar un ticket ya pagado"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.status = 'CANCELED'
        ticket.save()
        
        # Restaurar stock de materiales
        for item in ticket.items.all():
            item.material.quantity += item.quantity
            item.material.save()
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    # Eliminar o comentar la acción print
    # @action(detail=True, methods=['get'])
    # def print(self, request, pk=None):
    #     """Generar HTML del ticket en lugar de PDF"""
    #     ticket = self.get_object()
    #     
    #     try:
    #         # Usar la plantilla HTML directamente
    #         template = get_template('tickets/ticket_pdf.html')
    #         context = {
    #             'ticket': ticket,
    #             'company_info': {
    #                 'name': 'Tu Empresa, S.L.',
    #                 'address': 'Calle Principal 123',
    #                 'city': 'Madrid',
    #                 'postal_code': '28001',
    #                 'tax_id': 'A12345678',
    #                 'phone': '91 123 45 67',
    #                 'email': 'info@tuempresa.com',
    #             },
    #             'is_duplicate': False,
    #         }
    #         html_content = template.render(context)
    #         
    #         # Devolver HTML en lugar de PDF
    #         return HttpResponse(html_content, content_type='text/html')
    #     except Exception as e:
    #         logger.error(f"Error generando HTML del ticket {ticket.id}: {str(e)}")
    #         return Response(
    #             {"detail": "Error al generar el documento"},
    #             status=status.HTTP_500_INTERNAL_SERVER_ERROR
    #         )
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """Marcar como eliminado en lugar de eliminar realmente"""
        ticket = self.get_object()
        
        # No permitir eliminar tickets pagados
        if ticket.status == 'PAID':
            return Response({
                'detail': 'No se puede eliminar un ticket pagado. Cancélelo primero.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Devolver el stock si el ticket está pendiente
        if ticket.status == 'PENDING':
            for item in ticket.items.all():
                if item.material:
                    # Aumentar el stock
                    item.material.quantity += item.quantity
                    item.material.save()
                    
                    # Registrar en control de materiales
                    MaterialControl.objects.create(
                        user=request.user,
                        material=item.material,
                        quantity=item.quantity,
                        operation='ADD',
                        reason='ELIMINACION_TICKET',
                        ticket=ticket
                    )
        
        # Marcar como eliminado
        ticket.is_deleted = True
        ticket.save()
        
        return Response({'detail': 'Ticket eliminado correctamente.'}, 
                      status=status.HTTP_204_NO_CONTENT)


class TicketItemViewSet(viewsets.ModelViewSet):
    """API para gestionar items de un ticket"""
    serializer_class = TicketItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TicketItem.objects.filter(ticket_id=self.kwargs['ticket_pk'])
    
    def perform_create(self, serializer):
        ticket = get_object_or_404(Ticket, id=self.kwargs['ticket_pk'])
        
        # No permitir añadir items a tickets cancelados o pagados
        if ticket.status != 'PENDING':
            raise serializers.ValidationError(
                "Solo se pueden añadir items a tickets pendientes"
            )
            
        serializer.save(ticket=ticket)
    
    def perform_update(self, serializer):
        ticket = get_object_or_404(Ticket, id=self.kwargs['ticket_pk'])
        
        # No permitir modificar items de tickets cancelados o pagados
        if ticket.status != 'PENDING':
            raise serializers.ValidationError(
                "Solo se pueden modificar items de tickets pendientes"
            )
            
        serializer.save()
    
    def perform_destroy(self, instance):
        # No permitir eliminar items de tickets cancelados o pagados
        if instance.ticket.status != 'PENDING':
            raise serializers.ValidationError(
                "Solo se pueden eliminar items de tickets pendientes"
            )
            
        super().perform_destroy(instance)


@action(detail=False, methods=['get'])
def ticket_stats(request):
    """Estadísticas de tickets"""
    total_tickets = Ticket.objects.count()
    pending_tickets = Ticket.objects.filter(status='PENDING').count()
    paid_tickets = Ticket.objects.filter(status='PAID').count()
    canceled_tickets = Ticket.objects.filter(status='CANCELED').count()
    
    # Ventas de los últimos 30 días
    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    monthly_sales = Ticket.objects.filter(
        status='PAID', 
        paid_at__gte=thirty_days_ago
    ).count()
    
    # Importe total de ventas
    total_sales_amount = Ticket.objects.filter(
        status='PAID'
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    return Response({
        'total_tickets': total_tickets,
        'pending_tickets': pending_tickets,
        'paid_tickets': paid_tickets,
        'canceled_tickets': canceled_tickets,
        'monthly_sales': monthly_sales,
        'total_sales_amount': total_sales_amount
    })
