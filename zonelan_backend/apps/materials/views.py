import logging
import traceback

logger = logging.getLogger(__name__)

# Configuración básica de logging si no está configurado
import logging.config
logging.config.dictConfig({
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'DEBUG',
        },
    },
    'loggers': {
        '': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
})

from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import transaction
from .models import Material, MaterialControl
from .serializers import MaterialSerializer, MaterialControlSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, action
from django.db.models import Count, Sum, F, Q
from django.utils import timezone  # Añadir esta importación
from apps.storage.models import MaterialLocation  # Añadir esta importación

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by('name')
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        material = serializer.save()
        
        # Registrar en el control de materiales
        # Obtener la imagen para el albarán
        invoice_image = request.FILES.get('invoice_image')
        
        MaterialControl.objects.create(
            user=request.user,
            material=material,
            quantity=material.quantity,
            operation='ADD',
            reason='COMPRA',
            invoice_image=invoice_image  # Añadir la imagen
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            operation = request.data.get('operation', None)
            quantity_change = request.data.get('quantity_change', None)
            
            reason = request.data.get('reason', 'COMPRA')
            location_id = request.data.get('location_id', None)
            notes = request.data.get('notes', '')
            
            # Si hay una operación y un cambio de cantidad
            if operation and quantity_change and quantity_change != '0':
                quantity_change = int(quantity_change)
                
                # Para operaciones ADD (entrada)
                if operation == 'ADD':
                    # Aumentar la cantidad del material
                    instance.quantity += quantity_change
                    
                    # Crear el registro de control
                    MaterialControl.objects.create(
                        user=request.user,
                        material=instance,
                        quantity=quantity_change,
                        operation='ADD',
                        reason=reason,
                        notes=notes,
                        invoice_image=request.FILES.get('invoice_image')
                    )
                
                # Para operaciones REMOVE (salida)
                elif operation == 'REMOVE':
                    if instance.quantity < quantity_change:
                        return Response({"detail": "Stock insuficiente"}, status=400)
                    
                    # Disminuir la cantidad del material
                    instance.quantity -= quantity_change
                    
                    # Crear el registro de control
                    MaterialControl.objects.create(
                        user=request.user,
                        material=instance,
                        quantity=quantity_change,
                        operation='REMOVE',
                        reason=reason,
                        notes=notes
                    )
            
            # Actualizar el material (nombre, precio, etc.)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            return Response(serializer.data)
            
        except Exception as e:
            import traceback
            print(f"Error en update: {str(e)}")
            print(traceback.format_exc())
            return Response({"detail": f"Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Obtener el parámetro que indica si devolver los materiales
        return_materials = request.query_params.get('return_materials', 'false').lower() == 'true'
        
        # Marcar como eliminado en lugar de borrarlo realmente
        instance.is_deleted = True
        instance.status = 'DELETED'
        instance.save()
        
        # Si se solicita devolver los materiales
        if return_materials:
            # Obtener los materiales utilizados en el reporte
            materials_used = instance.materials_used.all()
            
            for material_used in materials_used:
                # Devolver el material al inventario
                material = material_used.material
                material.quantity += material_used.quantity
                material.save()
                
                # Registrar en el control como devolución
                MaterialControl.objects.create(
                    user=request.user,
                    material=material,
                    quantity=material_used.quantity,
                    operation='ADD',
                    reason='DEVOLUCION',
                    report=instance
                )
        
        return Response({"detail": "Reporte marcado como eliminado."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser, JSONParser])
    @transaction.atomic
    def adjust_stock(self, request, pk=None):
        """
        Endpoint específico para realizar cuadre de inventario.
        """
        try:
            material = self.get_object()
            
            # Mejor manejo de datos JSON o form-data
            if request.content_type and 'application/json' in request.content_type:
                data = request.data
            else:
                data = request.POST
            
            try:
                target_stock = int(data.get('target_stock', 0))
            except (TypeError, ValueError):
                return Response(
                    {"detail": "La cantidad objetivo debe ser un número entero válido"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            source = data.get('source', 'unallocated')
            location_id = data.get('location_id')
            notes = data.get('notes', '')
            
            # Si el origen es una ubicación específica
            if source == 'location' and location_id:
                try:
                    # Importar el modelo aquí para evitar dependencias circulares
                    from apps.storage.models import MaterialLocation
                    
                    # Obtener la ubicación
                    location_id = int(location_id)
                    location = MaterialLocation.objects.get(id=location_id)
                    
                    # Verificar que corresponde al material
                    if location.material.id != material.id:
                        return Response(
                            {"detail": f"La ubicación seleccionada no corresponde al material {material.id}"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    current_location_stock = location.quantity
                    difference = target_stock - current_location_stock
                    
                    # Si no hay cambio, no hacer nada
                    if difference == 0:
                        return Response({"detail": "No hay cambios en el stock"}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Actualizar el stock del material y de la ubicación
                    operation = 'ADD' if difference > 0 else 'REMOVE'
                    quantity = abs(difference)
                    
                    # Actualizar el stock en la ubicación
                    location.quantity = target_stock
                    location.save()
                    
                    # Actualizar el stock total del material
                    if operation == 'ADD':
                        material.quantity += quantity
                    else:
                        material.quantity -= quantity
                        
                    material.save()
                    
                    # Registrar el control
                    MaterialControl.objects.create(
                        user=request.user,
                        material=material,
                        quantity=quantity,
                        operation=operation,
                        reason='CUADRE',
                        location_reference=location_id,
                        notes=notes
                    )
                    
                    return Response({
                        "detail": f"Stock ajustado correctamente en ubicación. Nuevo stock: {target_stock}",
                        "new_stock": material.quantity
                    })
                    
                except (ValueError, TypeError):
                    return Response(
                        {"detail": "ID de ubicación inválido"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except MaterialLocation.DoesNotExist:
                    return Response(
                        {"detail": "La ubicación especificada no existe"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            # Si el origen es material sin ubicar
            elif source == 'unallocated':
                # Calcular el stock sin ubicar
                from apps.storage.models import MaterialLocation
                allocated_stock = MaterialLocation.objects.filter(
                    material=material
                ).aggregate(Sum('quantity')).get('quantity__sum', 0) or 0
                
                unallocated_stock = material.quantity - allocated_stock
                
                # Validar que hay stock sin ubicar
                if unallocated_stock <= 0:
                    return Response(
                        {"detail": "No hay stock sin ubicar disponible"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
                difference = target_stock - unallocated_stock
                
                # Si no hay cambio, no hacer nada
                if difference == 0:
                    return Response({"detail": "No hay cambios en el stock"}, status=status.HTTP_400_BAD_REQUEST)
                    
                # Actualizar el stock total del material
                operation = 'ADD' if difference > 0 else 'REMOVE'
                quantity = abs(difference)
                
                if operation == 'ADD':
                    material.quantity += quantity
                else:
                    material.quantity -= quantity
                    
                material.save()
                
                # Registrar el control
                MaterialControl.objects.create(
                    user=request.user,
                    material=material,
                    quantity=quantity,
                    operation=operation,
                    reason='CUADRE',
                    notes=notes
                )
                
                return Response({
                    "detail": f"Stock sin ubicar ajustado correctamente. Nuevo stock sin ubicar: {target_stock}",
                    "new_stock": material.quantity
                })
                
            else:
                return Response(
                    {"detail": "Origen del cuadre no válido"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            import traceback
            print(f"Error en adjust_stock: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"detail": f"Error al ajustar el stock: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MaterialControlViewSet(viewsets.ModelViewSet):
    queryset = MaterialControl.objects.all().order_by('-date')
    serializer_class = MaterialControlSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
def material_history(request, material_id):
    try:
        history = MaterialControl.objects.filter(material_id=material_id).order_by('-date')
        serializer = MaterialControlSerializer(history, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def material_stats(request):
    """Endpoint para devolver estadísticas de materiales para el dashboard"""
    try:
        # Total de materiales
        total_materials = Material.objects.count()
        
        # Materiales con stock bajo (usando MaterialLocation donde está minimum_quantity)
        low_stock_locations = MaterialLocation.objects.filter(
            quantity__lt=F('minimum_quantity')
        ).values('material').distinct().count()
        
        # Operaciones recientes (últimos 30 días)
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        recent_operations = MaterialControl.objects.filter(
            date__gte=thirty_days_ago
        ).count()
        
        return Response({
            'total': total_materials,
            'lowStock': low_stock_locations,
            'recentOperations': recent_operations
        })
    except Exception as e:
        import traceback
        print(f"Error en material_stats: {str(e)}")
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
