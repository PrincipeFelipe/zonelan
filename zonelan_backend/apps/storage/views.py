from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import models, transaction
from django.db.models import F
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Warehouse, Department, Shelf, Tray, 
    MaterialLocation, MaterialMovement
)
from .serializers import (
    WarehouseSerializer, DepartmentSerializer, ShelfSerializer, TraySerializer,
    MaterialLocationSerializer, MaterialMovementSerializer,
    DetailedWarehouseSerializer, DetailedDepartmentSerializer, DetailedShelfSerializer,
    MaterialLocationWithMovementsSerializer
)
from apps.materials.models import Material, MaterialControl


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'location']
    ordering_fields = ['name', 'code', 'created_at']
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        warehouse = self.get_object()
        serializer = DetailedWarehouseSerializer(warehouse)
        return Response(serializer.data)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['warehouse', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        department = self.get_object()
        serializer = DetailedDepartmentSerializer(department)
        return Response(serializer.data)


class ShelfViewSet(viewsets.ModelViewSet):
    queryset = Shelf.objects.all()
    serializer_class = ShelfSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'department__warehouse', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        shelf = self.get_object()
        serializer = DetailedShelfSerializer(shelf)
        return Response(serializer.data)


class TrayViewSet(viewsets.ModelViewSet):
    queryset = Tray.objects.all()
    serializer_class = TraySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['shelf', 'shelf__department', 'shelf__department__warehouse', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    
    @action(detail=True, methods=['get'])
    def materials(self, request, pk=None):
        tray = self.get_object()
        locations = MaterialLocation.objects.filter(tray=tray)
        serializer = MaterialLocationSerializer(locations, many=True)
        return Response(serializer.data)
    
    # Añade este método para depuración
    def create(self, request, *args, **kwargs):
        print("TrayViewSet create - Datos recibidos:", request.data)
        return super().create(request, *args, **kwargs)


class MaterialLocationViewSet(viewsets.ModelViewSet):
    queryset = MaterialLocation.objects.all()
    serializer_class = MaterialLocationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'material', 'tray', 'tray__shelf', 
        'tray__shelf__department', 'tray__shelf__department__warehouse'
    ]
    search_fields = ['material__name', 'tray__name', 'tray__code']
    ordering_fields = ['material__name', 'tray__name', 'quantity', 'updated_at']
    
    @action(detail=True, methods=['get'])
    def movements(self, request, pk=None):
        location = self.get_object()
        serializer = MaterialLocationWithMovementsSerializer(location)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Devuelve las ubicaciones con stock por debajo del mínimo configurado
        """
        try:
            locations = MaterialLocation.objects.filter(quantity__lt=F('minimum_quantity')).select_related(
                'material', 'tray', 'tray__shelf', 'tray__shelf__department', 'tray__shelf__department__warehouse'
            )
            serializer = MaterialLocationSerializer(locations, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class MaterialMovementViewSet(viewsets.ModelViewSet):
    queryset = MaterialMovement.objects.all()
    serializer_class = MaterialMovementSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'material', 'operation', 'user',
        'source_location', 'target_location', 'material_control'
    ]
    search_fields = ['material__name', 'notes']
    ordering_fields = ['timestamp', 'material__name', 'quantity']
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo movimiento de material y actualiza las ubicaciones correspondientes
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        material = data['material']
        operation = data['operation']
        quantity = data['quantity']
        source_location = data.get('source_location')
        target_location = data.get('target_location')
        target_tray = data.get('target_tray')
        notes = data.get('notes', '')
        
        try:
            # 1. Validaciones previas según el tipo de operación
            if operation in ['REMOVE', 'TRANSFER'] and not source_location:
                return Response(
                    {"detail": "Se requiere una ubicación de origen para esta operación"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if operation in ['ADD', 'TRANSFER'] and not (target_location or target_tray):
                return Response(
                    {"detail": "Se requiere una ubicación de destino para esta operación"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # 2. Verificar stock suficiente para REMOVE y TRANSFER
            if operation in ['REMOVE', 'TRANSFER']:
                if source_location.quantity < quantity:
                    return Response(
                        {"detail": f"Stock insuficiente en la ubicación de origen. Disponible: {source_location.quantity}"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # 3. Guardar el movimiento
            movement = serializer.save(user=request.user)
            
            # 4. Registrar en el control de materiales con motivo "TRASLADO" en lugar de "MOVIMIENTO"
            material_control = MaterialControl.objects.create(
                user=request.user,
                material=material,
                quantity=quantity,
                operation=operation,
                reason='TRASLADO',  # Cambiado de 'MOVIMIENTO' a 'TRASLADO'
                notes=notes or f"Traslado de material: {operation}",  # También actualizado el texto aquí
                location_reference=source_location.id if source_location else (target_location.id if target_location else None),
                movement_id=movement.id
            )
            
            # 5. Asociar el control al movimiento
            movement.material_control = material_control
            movement.save()
            
            # 6. Actualizar las ubicaciones según el tipo de operación
            if operation == 'ADD':
                if target_location:
                    # Si ya existe la ubicación, aumentar su stock
                    target_location.quantity += quantity
                    target_location.save()
                elif target_tray:
                    # Si es una nueva ubicación, crearla
                    MaterialLocation.objects.create(
                        material=material,
                        tray=target_tray,
                        quantity=quantity,
                        minimum_quantity=0  # Valor predeterminado
                    )
                
            elif operation == 'REMOVE':
                # Restar stock de la ubicación de origen
                source_location.quantity -= quantity
                source_location.save()
                
            elif operation == 'TRANSFER':
                # Restar del origen
                source_location.quantity -= quantity
                source_location.save()
                
                # Añadir al destino
                if target_location:
                    # Si ya existe la ubicación, aumentar su stock
                    target_location.quantity += quantity
                    target_location.save()
                elif target_tray:
                    # Si es una nueva ubicación, crearla
                    MaterialLocation.objects.create(
                        material=material,
                        tray=target_tray,
                        quantity=quantity,
                        minimum_quantity=0  # Valor predeterminado
                    )
            
            # 7. Actualizar el stock total en el objeto Material si es necesario
            # Esto depende de cómo estés gestionando el stock general del material
            # Si el material.quantity refleja el total en todas las ubicaciones, debes actualizarlo
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Rollback automático gracias al decorador @transaction.atomic
            import traceback
            print(f"Error al procesar el movimiento: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"detail": f"Error al procesar el movimiento: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def list(self, request, *args, **kwargs):
        try:
            # Código original para listar los movimientos
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Registrar el error para investigación
            import traceback
            print(f"Error en MaterialMovementViewSet.list: {str(e)}")
            print(traceback.format_exc())
            
            # Devolver una respuesta vacía en lugar de un error 500
            return Response([], status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def material_available_locations(request, material_id):
    """Endpoint para obtener ubicaciones disponibles de un material"""
    try:
        # Obtener ubicaciones con stock disponible
        locations = MaterialLocation.objects.filter(
            material_id=material_id,
            quantity__gt=0
        ).select_related('tray__shelf__department__warehouse')
        
        serializer = MaterialLocationSerializer(locations, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"detail": str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def material_locations(request, material_id):
    """Endpoint para obtener ubicaciones de un material"""
    try:
        # Obtener ubicaciones con stock disponible
        locations = MaterialLocation.objects.filter(
            material_id=material_id,
            quantity__gt=0
        ).select_related('tray__shelf__department__warehouse')
        
        serializer = MaterialLocationSerializer(locations, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"detail": str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def material_inventory_check(request, material_id):
    """Endpoint para verificar el estado del inventario de un material"""
    try:
        # Obtener el material
        material = Material.objects.get(id=material_id)
        
        # Obtener todas las ubicaciones de este material
        locations = MaterialLocation.objects.filter(material=material)
        
        # Calcular el total ubicado
        total_located = sum(location.quantity for location in locations)
        
        # Información detallada de cada ubicación
        location_details = []
        for location in locations:
            tray = location.tray
            shelf = tray.shelf
            department = shelf.department
            warehouse = department.warehouse
            
            location_details.append({
                'id': location.id,
                'quantity': location.quantity,
                'minimum_quantity': location.minimum_quantity,
                'tray_name': tray.name,
                'shelf_name': shelf.name,
                'department_name': department.name,
                'warehouse_name': warehouse.name,
                'full_path': f"{warehouse.name} > {department.name} > {shelf.name} > {tray.name}"
            })
        
        # Control de materiales reciente para este material
        recent_controls = MaterialControl.objects.filter(
            material=material
        ).order_by('-date')[:10]  # Últimos 10 movimientos
        
        control_details = []
        for control in recent_controls:
            control_details.append({
                'id': control.id,
                'date': control.date,
                'operation': control.operation,
                'reason': control.reason,
                'quantity': control.quantity,
                'user': control.user.username,
                'notes': control.notes
            })
        
        # Construir la respuesta
        response_data = {
            'material': {
                'id': material.id,
                'name': material.name,
                'quantity': material.quantity,
            },
            'inventory_summary': {
                'total_located': total_located,
                'unallocated': material.quantity - total_located,
            },
            'locations': location_details,
            'recent_activity': control_details
        }
        
        return Response(response_data)
    except Material.DoesNotExist:
        return Response({"detail": "Material no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
