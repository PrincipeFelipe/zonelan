from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.utils import timezone
from .models import Contract, MaintenanceRecord, ContractDocument, ContractReport
from .serializers import (
    ContractSerializer, 
    ContractDetailSerializer,
    MaintenanceRecordSerializer, 
    ContractDocumentSerializer, 
    ContractReportSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class ContractViewSet(viewsets.ModelViewSet):
    """API para gestionar contratos."""
    queryset = Contract.objects.filter(is_deleted=False)
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'requires_maintenance']
    search_fields = ['title', 'description', 'customer__name']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'next_maintenance_date']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ContractDetailSerializer
        return ContractSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro adicional para contratos con mantenimiento pendiente
        pending_maintenance = self.request.query_params.get('pending_maintenance')
        if pending_maintenance == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(
                requires_maintenance=True,
                next_maintenance_date__lte=today
            )
        
        # Filtro adicional para contratos a punto de vencer
        expiring_soon = self.request.query_params.get('expiring_soon')
        if expiring_soon == 'true':
            today = timezone.now().date()
            thirty_days_later = today + timezone.timedelta(days=30)
            queryset = queryset.filter(
                end_date__isnull=False,
                end_date__gte=today,
                end_date__lte=thirty_days_later,
                status='ACTIVE'
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """Marca un contrato como eliminado en lugar de borrarlo realmente."""
        instance = self.get_object()
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def complete_maintenance(self, request, pk=None):
        """Registra un mantenimiento completado para el contrato."""
        contract = self.get_object()
        
        serializer = MaintenanceRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                contract=contract,
                performed_by=request.user
            )
            
            # La lógica para actualizar next_maintenance_date está en MaintenanceRecord.save()
            
            # Devolver el contrato actualizado
            return Response(
                ContractDetailSerializer(contract, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Devuelve estadísticas para el dashboard de contratos."""
        # Contar contratos por estado
        total_contracts = Contract.objects.filter(is_deleted=False).count()
        active_contracts = Contract.objects.filter(status='ACTIVE', is_deleted=False).count()
        
        # Contar contratos con mantenimiento pendiente
        today = timezone.now().date()
        pending_maintenance = Contract.objects.filter(
            requires_maintenance=True,
            next_maintenance_date__lte=today,
            is_deleted=False
        ).count()
        
        # Contar contratos a punto de vencer
        thirty_days_later = today + timezone.timedelta(days=30)
        expiring_soon = Contract.objects.filter(
            end_date__isnull=False,
            end_date__gte=today,
            end_date__lte=thirty_days_later,
            status='ACTIVE',
            is_deleted=False
        ).count()
        
        # Obtener distribución de contratos por cliente
        from django.db.models import Count
        contracts_by_customer = Contract.objects.filter(
            is_deleted=False
        ).values(
            'customer__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'total_contracts': total_contracts,
            'active_contracts': active_contracts,
            'pending_maintenance': pending_maintenance,
            'expiring_soon': expiring_soon,
            'contracts_by_customer': contracts_by_customer
        })


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    """API para gestionar registros de mantenimiento."""
    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['contract', 'status', 'performed_by']
    ordering_fields = ['date', 'created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por contrato si se proporciona el parámetro
        contract_id = self.request.query_params.get('contract')
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)


class ContractDocumentViewSet(viewsets.ModelViewSet):
    """API para gestionar documentos de contratos."""
    queryset = ContractDocument.objects.all()
    serializer_class = ContractDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['contract']
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por contrato si se proporciona el parámetro
        contract_id = self.request.query_params.get('contract')
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ContractReportViewSet(viewsets.ModelViewSet):
    """API para gestionar reportes de trabajo de contratos."""
    queryset = ContractReport.objects.filter(is_deleted=False)
    serializer_class = ContractReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['contract', 'status', 'performed_by']
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por contrato si se proporciona el parámetro
        contract_id = self.request.query_params.get('contract')
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """Marca un reporte como eliminado en lugar de borrarlo realmente."""
        instance = self.get_object()
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.status = 'DELETED'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Endpoint para obtener contratos con mantenimiento pendiente
@action(detail=False, methods=['get'])
def pending_maintenances(request):
    """Devuelve los contratos con mantenimiento pendiente."""
    today = timezone.now().date()
    contracts = Contract.objects.filter(
        requires_maintenance=True,
        next_maintenance_date__lte=today,
        is_deleted=False
    )
    
    serializer = ContractSerializer(contracts, many=True)
    return Response(serializer.data)

# Endpoint para obtener contratos a punto de vencer
@action(detail=False, methods=['get'])
def expiring_soon(request):
    """Devuelve los contratos que vencerán en los próximos días."""
    days = int(request.query_params.get('days', 30))
    today = timezone.now().date()
    future_date = today + timezone.timedelta(days=days)
    
    contracts = Contract.objects.filter(
        end_date__isnull=False,
        end_date__gte=today,
        end_date__lte=future_date,
        status='ACTIVE',
        is_deleted=False
    )
    
    serializer = ContractSerializer(contracts, many=True)
    return Response(serializer.data)
