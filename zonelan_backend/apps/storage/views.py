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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Obtener datos validados
        movement_data = serializer.validated_data
        operation = movement_data.get('operation')
        material = movement_data.get('material')
        quantity = movement_data.get('quantity')
        
        # Crear instancia y guardar para obtener el ID
        instance = serializer.save(user=request.user)
        
        # Registrar en MaterialControl según el tipo de operación
        from apps.materials.models import MaterialControl
        
        if operation == 'TRANSFER':
            # Para traslados, registrar como TRANSFER
            material_control = MaterialControl.objects.create(
                user=request.user,
                material=material,
                quantity=quantity,
                operation='TRANSFER',
                reason='TRASLADO',
                movement_id=instance.id,  # Establecer explícitamente el ID del movimiento
                location_reference=f"Traslado desde {instance.source_location} hacia {instance.target_location or 'nueva ubicación'}"
            )
        else:
            # Para entradas/salidas mantener comportamiento existente
            material_control = MaterialControl.objects.create(
                user=request.user,
                material=material,
                quantity=quantity,
                operation=operation,
                reason='RETIRADA' if operation == 'REMOVE' else 'COMPRA',
                movement_id=instance.id,  # Establecer explícitamente el ID del movimiento
                location_reference=f"{'Entrada a' if operation == 'ADD' else 'Salida de'} {instance.target_location if operation == 'ADD' else instance.source_location}"
            )
        
        # Asignar la relación también desde el otro lado
        instance.material_control = material_control
        instance.save()
        
        return Response(
            self.get_serializer(instance).data,
            status=status.HTTP_201_CREATED
        )


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
