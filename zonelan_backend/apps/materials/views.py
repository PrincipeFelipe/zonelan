from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import transaction
from .models import Material, MaterialControl
from .serializers import MaterialSerializer, MaterialControlSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view
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
        instance = self.get_object()
        operation = request.data.get('operation', None)
        quantity_change = request.data.get('quantity_change', None)
        reason = request.data.get('reason', 'COMPRA')
        location_id = request.data.get('location_id', None)  # Añadir este campo
        
        # Si hay una operación y un cambio de cantidad
        if operation and quantity_change:
            quantity_change = int(quantity_change)
            
            # Operación para añadir al stock (no necesita ubicación)
            if operation == 'ADD':
                instance.quantity += quantity_change
                
                # Registrar control de material
                MaterialControl.objects.create(
                    user=request.user,
                    material=instance,
                    quantity=quantity_change,
                    operation='ADD',
                    reason=reason,
                    invoice_image=request.FILES.get('invoice_image')
                )
                
            # Operación para restar del stock (requiere ubicación para REMOVE)
            elif operation == 'REMOVE':
                # Validar que haya suficiente stock
                if instance.quantity < quantity_change:
                    return Response(
                        {"detail": "No hay suficiente stock disponible."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Si se especificó una ubicación, actualizar el stock en esa ubicación
                if location_id and (reason == 'VENTA' or reason == 'RETIRADA'):
                    try:
                        from apps.storage.models import MaterialLocation
                        location = MaterialLocation.objects.get(id=location_id)
                        
                        # Verificar que la ubicación corresponde al material
                        if location.material.id != instance.id:
                            return Response(
                                {"detail": "La ubicación no corresponde al material seleccionado."}, 
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        
                        # Verificar que haya suficiente stock en la ubicación
                        if location.quantity < quantity_change:
                            return Response(
                                {"detail": f"No hay suficiente stock en la ubicación. Disponible: {location.quantity}"}, 
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        
                        # Actualizar stock en ubicación
                        location.quantity -= quantity_change
                        location.save()
                        
                    except MaterialLocation.DoesNotExist:
                        return Response(
                            {"detail": "La ubicación especificada no existe."}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Actualizar stock total
                instance.quantity -= quantity_change
                
                # Registrar control de material
                MaterialControl.objects.create(
                    user=request.user,
                    material=instance,
                    quantity=quantity_change,
                    operation='REMOVE',
                    reason=reason
                )
        
        # Actualizar campos básicos
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

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
