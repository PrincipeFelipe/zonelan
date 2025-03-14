from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
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
import traceback
import sys

logger = logging.getLogger(__name__)

# Crear un permiso personalizado para restringir la eliminación a superusuarios
class IsSuperUserOrReadOnly(permissions.BasePermission):
    """
    Permite eliminar objetos solo a superusuarios.
    """
    def has_permission(self, request, view):
        # Siempre permitir GET, HEAD u OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Permitir operaciones de escritura solo a superusuarios para DELETE
        if request.method == 'DELETE':
            return request.user and request.user.is_superuser
            
        # Para otros métodos como POST, PUT, etc.
        return request.user and request.user.is_authenticated

class TicketViewSet(viewsets.ModelViewSet):
    """API para gestionar tickets de venta"""
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated, IsSuperUserOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'customer']
    search_fields = ['ticket_number', 'customer__name', 'notes']
    ordering_fields = ['created_at', 'total_amount', 'status']
    
    def get_queryset(self):
        """
        Filtrar los tickets según los permisos del usuario y excluir los eliminados.
        """
        # Filtrar por eliminados
        queryset = Ticket.objects.filter(is_deleted=False).order_by('-created_at')
        
        # Aplicar filtros adicionales si es necesario
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
    @transaction.atomic
    def cancel(self, request, pk=None):
        """Cancela un ticket"""
        ticket = self.get_object()
        
        # Verificar si el ticket está en estado pendiente
        if ticket.status != 'PENDING':
            return Response(
                {"detail": "Solo se pueden cancelar tickets pendientes."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Devolver los materiales al inventario
        for item in ticket.items.all():
            # Registrar la devolución del material
            MaterialControl.objects.create(
                user=request.user,
                material=item.material,
                quantity=item.quantity,
                operation='ADD',
                reason='DEVOLUCION',
                ticket=ticket,
                date=timezone.now()
            )
            
            # Devolver el material al inventario
            item.material.quantity += item.quantity
            item.material.save(update_fields=['quantity'])
        
        # Actualizar el ticket
        ticket.status = 'CANCELED'
        ticket.canceled_at = timezone.now()
        ticket.save()
        
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
        """Eliminar un ticket (solo superusuarios)"""
        ticket = self.get_object()
        
        # Verificar permisos
        if not request.user.is_superuser and not getattr(request.user, 'type', '') != 'SuperAdmin':
            return Response(
                {"detail": "Solo los superusuarios pueden eliminar tickets."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Verificar si se deben devolver los materiales al inventario
            return_materials = request.query_params.get('return_materials', '0') == '1'
            
            if return_materials:
                # Devolver los materiales al inventario
                for item in ticket.items.all():
                    # Si el ticket no fue cancelado (ya que entonces ya se devolvieron los materiales)
                    if ticket.status != 'CANCELED':
                        # Registrar la devolución del material
                        MaterialControl.objects.create(
                            user=request.user,
                            material=item.material,
                            quantity=item.quantity,
                            operation='ADD',
                            reason='DEVOLUCION',
                            ticket=ticket,
                            date=timezone.now(),
                            notes=f"Devolución por eliminación de ticket #{ticket.ticket_number or ticket.id}"
                        )
                        
                        # Devolver el material al inventario
                        item.material.quantity += item.quantity
                        item.material.save(update_fields=['quantity'])
            
            # Marcar como eliminado en lugar de eliminar físicamente
            ticket.is_deleted = True
            ticket.deleted_at = timezone.now()
            ticket.save(update_fields=['is_deleted', 'deleted_at'])
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            # Capturar y registrar detalles del error
            exc_info = sys.exc_info()
            error_details = traceback.format_exc()
            logger.error(f"Error al eliminar ticket {ticket.id}: {str(e)}")
            logger.error(error_details)
            
            return Response(
                {"detail": f"Error al eliminar el ticket: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='items')
    @transaction.atomic
    def create_item(self, request, pk=None):
        """Añadir un ítem al ticket"""
        ticket = self.get_object()
        
        # Verificar si el ticket está en estado pendiente
        if ticket.status != 'PENDING':
            return Response(
                {"detail": "Solo se pueden añadir productos a tickets pendientes."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Añadir ticket_id al request data
        data = request.data.copy()
        data['ticket'] = ticket.id
        
        serializer = TicketItemCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            try:
                # Validar stock suficiente
                material_id = data.get('material')
                quantity = float(data.get('quantity', 0))
                location_id = data.get('location_id')
                
                if material_id and quantity > 0:
                    material = get_object_or_404(Material, id=material_id)
                    
                    # Verificar stock - ahora se maneja en el serializer para casos con ubicación
                    if not location_id and material.quantity < quantity:
                        return Response({
                            'detail': f"No hay suficiente stock del material {material.name}. Disponible: {material.quantity}"
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Crear el ítem
                    ticket_item = serializer.save()
                    
                    # Devolver la respuesta
                    return Response(
                        TicketItemSerializer(ticket_item).data, 
                        status=status.HTTP_201_CREATED
                    )
                else:
                    return Response(
                        {"detail": "Datos incompletos o inválidos."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except Exception as e:
                logger.error(f"Error al crear ticket item: {str(e)}")
                return Response(
                    {"detail": f"Error al crear el item: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='deleted')
    def list_deleted(self, request):
        """
        Listar tickets eliminados (solo superusuarios)
        """
        # Verificar permisos
        if not request.user.is_superuser and not getattr(request.user, 'type', '') != 'SuperAdmin':
            return Response(
                {"detail": "Solo los superusuarios pueden ver tickets eliminados."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Obtener tickets eliminados
        queryset = Ticket.objects.filter(is_deleted=True).order_by('-deleted_at')
        
        # Aplicar paginación
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_object(self):
        """
        Permite obtener tickets eliminados si se especifica en la consulta
        """
        include_deleted = self.request.query_params.get('include_deleted', 'false').lower() == 'true'
        
        if include_deleted and self.request.user.is_superuser:
            queryset = Ticket.objects.all()  # Incluir eliminados
        else:
            queryset = Ticket.objects.filter(is_deleted=False)
        
        # Continuar con el comportamiento estándar
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)
        
        # Verificar permisos
        self.check_object_permissions(self.request, obj)
        
        return obj


class TicketItemViewSet(viewsets.ModelViewSet):
    serializer_class = TicketItemSerializer
    
    def get_queryset(self):
        return TicketItem.objects.all()
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        item = self.get_object()
        
        # Verificar si el ticket está en estado pendiente
        if item.ticket.status != 'PENDING':
            return Response(
                {"detail": "Solo se pueden eliminar productos de tickets pendientes."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Registrar la devolución del material al inventario
        MaterialControl.objects.create(
            user=request.user,
            material=item.material,
            quantity=item.quantity,
            operation='ADD',
            reason='DEVOLUCION',
            ticket=item.ticket
        )
        
        # Eliminar el item (el método delete ya se encarga de devolver el material al stock)
        return super().destroy(request, *args, **kwargs)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        item = self.get_object()
        
        # Verificar si el ticket está en estado pendiente
        if item.ticket.status != 'PENDING':
            return Response(
                {"detail": "Solo se pueden modificar productos de tickets pendientes."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Guardar la cantidad anterior
        old_quantity = item.quantity
        
        # Actualizar el item
        serializer = self.get_serializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Si ha cambiado la cantidad, registrar el ajuste en el historial
        new_quantity = serializer.validated_data.get('quantity', old_quantity)
        if new_quantity != old_quantity:
            quantity_diff = new_quantity - old_quantity
            
            if quantity_diff > 0:
                # Se está aumentando la cantidad, registrar salida adicional
                MaterialControl.objects.create(
                    user=request.user,
                    material=item.material,
                    quantity=abs(quantity_diff),
                    operation='REMOVE',
                    reason='VENTA',
                    ticket=item.ticket
                )
            else:
                # Se está reduciendo la cantidad, registrar devolución
                MaterialControl.objects.create(
                    user=request.user,
                    material=item.material,
                    quantity=abs(quantity_diff),
                    operation='ADD',
                    reason='DEVOLUCION',
                    ticket=item.ticket
                )
        
        return Response(serializer.data)


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


@api_view(['GET'])
def ticket_counts(request):
    """Devuelve estadísticas de tickets para el dashboard"""
    try:
        total = Ticket.objects.count()
        pending = Ticket.objects.filter(status__in=['PENDING', 'IN_PROGRESS']).count()
        
        return Response({
            'total': total,
            'pending': pending
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)
