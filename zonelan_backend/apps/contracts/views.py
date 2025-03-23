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
import os
import mimetypes
from django.http import FileResponse, HttpResponse
from django.views.decorators.clickjacking import xframe_options_exempt
from django.conf import settings
import requests
from urllib.parse import urlparse
from django.shortcuts import redirect
from wsgiref.util import FileWrapper
import io
import traceback
import json

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
    queryset = ContractReport.objects.filter(is_deleted=False)
    serializer_class = ContractReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['contract', 'status', 'performed_by']
    search_fields = ['description']
    ordering_fields = ['date', 'created_at']
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Importante para manejar archivos
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Determinar si se deben incluir reportes eliminados
        include_deleted = self.request.query_params.get('include_deleted', 'false').lower() in ['true', '1']
        if include_deleted:
            queryset = ContractReport.objects.all()
        
        # Filtrar por contrato si se proporciona el parámetro
        contract_id = self.request.query_params.get('contract')
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        try:
            # Log para depuración
            print("========== INICIO DE DEPURACIÓN CREATE ==========")
            print(f"Datos recibidos: {request.data}")
            
            # Intentar convertir los datos JSON a diccionarios para mejor visualización
            try:
                if 'technicians' in request.data:
                    technicians = json.loads(request.data.get('technicians', '[]'))
                    print(f"Technicians: {technicians}")
                
                if 'materials_used' in request.data:
                    materials = json.loads(request.data.get('materials_used', '[]'))
                    print(f"Materials: {materials}")
                
                if 'existing_images' in request.data:
                    images = json.loads(request.data.get('existing_images', '[]'))
                    print(f"Images: {images}")
            except Exception as e:
                print(f"Error al parsear JSON: {str(e)}")
            
            # Continuar con la creación normal
            return super().create(request, *args, **kwargs)
        
        except Exception as e:
            # Mostrar stacktrace completo
            error_trace = traceback.format_exc()
            print(f"Error en create: {str(e)}")
            print(error_trace)
            
            # Devolver una respuesta más informativa
            return Response(
                {
                    "error": str(e),
                    "detail": error_trace,
                    "message": "Error al crear el reporte de contrato"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            print("========== FIN DE DEPURACIÓN CREATE ==========")
    
    def update(self, request, *args, **kwargs):
        try:
            # Log para depuración
            print("========== INICIO DE DEPURACIÓN UPDATE ==========")
            print(f"Datos recibidos: {request.data}")
            
            # Intentar convertir los datos JSON a diccionarios para mejor visualización
            try:
                if 'technicians' in request.data:
                    technicians = json.loads(request.data.get('technicians', '[]'))
                    print(f"Technicians: {technicians}")
                
                if 'materials_used' in request.data:
                    materials = json.loads(request.data.get('materials_used', '[]'))
                    print(f"Materials: {materials}")
                
                if 'existing_images' in request.data:
                    images = json.loads(request.data.get('existing_images', '[]'))
                    print(f"Images: {images}")
            except Exception as e:
                print(f"Error al parsear JSON: {str(e)}")
            
            # Continuar con la actualización normal
            return super().update(request, *args, **kwargs)
        
        except Exception as e:
            # Mostrar stacktrace completo
            error_trace = traceback.format_exc()
            print(f"Error en update: {str(e)}")
            print(error_trace)
            
            # Devolver una respuesta más informativa
            return Response(
                {
                    "error": str(e),
                    "detail": error_trace,
                    "message": "Error al actualizar el reporte de contrato"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            print("========== FIN DE DEPURACIÓN UPDATE ==========")
            
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """Marca un reporte como eliminado y opcionalmente devuelve los materiales al stock."""
        instance = self.get_object()
        return_materials = request.query_params.get('return_materials', 'false').lower() in ['true', '1']
        
        # Marcar como eliminado
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.status = 'DELETED'
        instance.save()
        
        # Devolver materiales al stock si se solicita
        if return_materials:
            for material_usage in instance.materials_used.all():
                material = material_usage.material
                # Incrementar el stock del material
                material.quantity += material_usage.quantity
                material.save()
                
                # Registrar la devolución en el control de materiales
                from apps.materials.models import MaterialControl
                MaterialControl.objects.create(
                    material=material,
                    quantity=material_usage.quantity,
                    operation='ADD',
                    reason='DEVOLUCION',
                    user=request.user,
                    contract_report=instance,  # Referenciar al reporte de contrato
                    notes=f"Devolución por eliminación de reporte de contrato #{instance.id}"
                )
        
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

@xframe_options_exempt
def document_proxy(request):
    """
    Vista que sirve como proxy para mostrar documentos en iframes,
    sin la restricción de X-Frame-Options.
    """
    url = request.GET.get('url')
    if not url:
        return HttpResponse('URL no proporcionada', status=400)
    
    try:
        # Si es una URL completa
        if url.startswith(('http://', 'https://')):
            # Para URLs externas, hacer proxy de la petición
            response = requests.get(url, stream=True)
            
            # Crear una respuesta con el contenido
            content_type = response.headers.get('Content-Type')
            if not content_type:
                # Intentar adivinar el tipo MIME
                content_type = mimetypes.guess_type(url)[0] or 'application/octet-stream'
            
            # Crear respuesta de Django
            django_response = HttpResponse(
                content=response.content,
                status=response.status_code,
                content_type=content_type
            )
            
            # Añadir cabeceras que permiten el iframe
            django_response['X-Frame-Options'] = 'SAMEORIGIN'
            
            # Eliminar cabeceras que fuerzan descarga
            if 'Content-Disposition' in django_response:
                del django_response['Content-Disposition']
                
            return django_response
            
        # Si es una ruta relativa (comienza con /media/ o /mediafiles/)
        elif url.startswith(('/media/', '/mediafiles/')):
            # Obtener la ruta relativa del archivo
            if url.startswith('/media/'):
                rel_path = url[7:]  # Quitar '/media/'
            else:
                rel_path = url[11:]  # Quitar '/mediafiles/'
            
            # Construir ruta absoluta
            file_path = os.path.join(settings.MEDIA_ROOT, rel_path)
            
            # Verificar que el archivo existe
            if not os.path.exists(file_path):
                return HttpResponse('Archivo no encontrado', status=404)
            
            # Adivinar el tipo MIME
            content_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
            
            # Crear respuesta con el archivo
            response = FileResponse(
                open(file_path, 'rb'),
                content_type=content_type
            )
            
            # Configurar cabeceras
            response['X-Frame-Options'] = 'SAMEORIGIN'
            
            # Si es un PDF, asegurarse de que se muestre en línea
            if content_type == 'application/pdf':
                response['Content-Disposition'] = 'inline; filename="{}"'.format(
                    os.path.basename(file_path)
                )
                
            return response
        
        # Para cualquier otro caso, devolver error
        else:
            return HttpResponse('URL no válida', status=400)
            
    except Exception as e:
        return HttpResponse(f'Error al procesar el documento: {str(e)}', status=500)
