from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
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
        """Retorna ubicaciones con stock bajo del mínimo establecido"""
        locations = MaterialLocation.objects.filter(quantity__lt=models.F('minimum_quantity'))
        serializer = self.get_serializer(locations, many=True)
        return Response(serializer.data)


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
        
        movement = serializer.validated_data
        operation = movement.get('operation')
        material = movement.get('material')
        quantity = movement.get('quantity')
        source_location = movement.get('source_location')
        target_location = movement.get('target_location')
        
        # Validaciones según el tipo de operación
        if operation == 'TRANSFER' and (not source_location or not target_location):
            return Response(
                {"error": "Para traslados, debe especificar ubicación de origen y destino"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if operation == 'ADD' and not target_location:
            return Response(
                {"error": "Para entradas, debe especificar ubicación de destino"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if operation == 'REMOVE' and not source_location:
            return Response(
                {"error": "Para salidas, debe especificar ubicación de origen"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Verificar stock suficiente para salidas y traslados
        if operation in ['REMOVE', 'TRANSFER'] and source_location.quantity < quantity:
            return Response(
                {"error": f"Stock insuficiente. Disponible: {source_location.quantity}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Actualizar stock de ubicaciones
        if operation in ['REMOVE', 'TRANSFER']:
            source_location.quantity -= quantity
            source_location.save()
            
        if operation in ['ADD', 'TRANSFER']:
            # Si la ubicación de destino ya existe, incrementar cantidad
            if target_location:
                target_location.quantity += quantity
                target_location.save()
            else:
                # Si no existe una ubicación para este material en esta balda, crearla
                target_location = MaterialLocation.objects.create(
                    material=material,
                    tray=movement.get('target_tray'),
                    quantity=quantity
                )
                movement['target_location'] = target_location
        
        # Registrar en MaterialControl si no existe una referencia
        if not movement.get('material_control'):
            material_control = MaterialControl.objects.create(
                user=request.user,
                material=material,
                quantity=quantity,
                operation='ADD' if operation in ['ADD', 'TRANSFER'] else 'REMOVE',
                reason='RETIRADA' if operation == 'REMOVE' else 'COMPRA'
            )
            movement['material_control'] = material_control
        
        # Guardar el movimiento
        instance = serializer.save(user=request.user)
        
        return Response(
            self.get_serializer(instance).data,
            status=status.HTTP_201_CREATED
        )
