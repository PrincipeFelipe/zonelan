from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from .models import WorkReport, MaterialUsed, ReportImage
from .serializers import WorkReportSerializer, MaterialUsedSerializer
from apps.materials.models import Material, MaterialControl
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

class WorkReportViewSet(viewsets.ModelViewSet):
    # Asegurarse de que queryset incluya todos los reportes para poder accederlos después
    queryset = WorkReport.objects.all()
    serializer_class = WorkReportSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # Guardar el reporte sin el técnico
        report = serializer.save()
        
        # Procesar técnicos
        technicians_data = self.request.data.get('technicians', [])
        for tech_data in technicians_data:
            if (tech_data and 'technician' in tech_data):
                TechnicianAssignment.objects.create(
                    report=report,
                    technician_id=tech_data['technician']
                )

        # Procesar materiales
        materials_data = self.request.data.get('materials_used', [])
        for material_data in materials_data:
            if (material_data and 'material' in material_data and 'quantity' in material_data):
                MaterialUsed.objects.create(
                    report=report,
                    material_id=material_data['material'],
                    quantity=material_data['quantity']
                )

        return report

    def get_queryset(self):
        """
        Obtiene el queryset de reportes, filtrando por eliminados según corresponda
        """
        try:
            # Verificar si se solicitan reportes eliminados explícitamente
            show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
            
            if show_deleted and (self.request.user.is_superuser or getattr(self.request.user, 'type', None) in ['SuperAdmin', 'Admin']):
                # Si es admin/superadmin y solicita ver eliminados, mostrar todos
                queryset = WorkReport.objects.all()
            else:
                # Por defecto, filtrar los eliminados
                queryset = WorkReport.objects.filter(is_deleted=False)
            
            # Mantener los filtros existentes
            incident = self.request.query_params.get('incident', None)
            if incident is not None:
                queryset = queryset.filter(incident=incident)
            
            status = self.request.query_params.get('status', None)
            if status is not None:
                queryset = queryset.filter(status=status)
                
            return queryset.order_by('-date')
        except Exception as e:
            import traceback
            print(f"Error en get_queryset: {str(e)}")
            print(traceback.format_exc())
            # Devolver un queryset vacío en caso de error
            return WorkReport.objects.none()
    
    def get_object(self):
        """
        Permite obtener reportes eliminados si se especifica en la consulta
        """
        try:
            # Obtener el parámetro include_deleted de la consulta
            include_deleted = self.request.query_params.get('include_deleted', 'false').lower() == 'true'
            
            # Si el usuario solicita ver reportes eliminados y tiene permisos, modificar el queryset
            if include_deleted and (self.request.user.is_superuser or self.request.user.type in ['SuperAdmin', 'Admin']):
                queryset = WorkReport.objects.all()  # Incluye eliminados
            else:
                queryset = WorkReport.objects.filter(is_deleted=False)  # Solo no eliminados
            
            # Continuar con la lógica estándar para obtener el objeto
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
            
            # Log adicional para depuración
            print(f"Buscando reporte con {filter_kwargs}, include_deleted={include_deleted}")
            
            obj = get_object_or_404(queryset, **filter_kwargs)
            
            # Verificar permisos
            self.check_object_permissions(self.request, obj)
            
            return obj
        except Exception as e:
            import traceback
            print(f"Error en get_object: {str(e)}")
            print(traceback.format_exc())
            raise  # Volver a lanzar la excepción para que Django maneje la respuesta 404
        
    # Añadir acción para listar reportes eliminados específicamente
    @action(detail=False, methods=['get'], url_path='deleted')
    def list_deleted(self, request):
        """
        Listar reportes eliminados (solo superusuarios)
        """
        try:
            # Verificar permisos
            if not request.user.is_superuser and getattr(request.user, 'type', None) not in ['SuperAdmin', 'Admin']:
                return Response(
                    {"detail": "Solo los administradores pueden ver reportes eliminados."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Obtener reportes eliminados
            queryset = WorkReport.objects.filter(is_deleted=True).order_by('-date')
            
            # Aplicar paginación
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(f"Error en list_deleted: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            # Obtener el parámetro que indica si devolver los materiales
            return_materials = request.query_params.get('return_materials', 'false').lower() == 'true'
            
            # Marcar como eliminado y registrar la fecha de eliminación
            instance.is_deleted = True
            instance.status = 'DELETED'
            instance.deleted_at = timezone.now()
            instance.save()
            
            print(f"Reporte {instance.id} marcado como eliminado con éxito")
            
            # Si se solicita devolver los materiales
            if return_materials:
                # Obtener los materiales utilizados en el reporte
                materials_used = MaterialUsed.objects.filter(report=instance)
                
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
        except Exception as e:
            import traceback
            print(f"Error al eliminar reporte: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MaterialUsedViewSet(viewsets.ModelViewSet):
    queryset = MaterialUsed.objects.all()
    serializer_class = MaterialUsedSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = MaterialUsed.objects.all()
        
        # Filtrar por parte de trabajo si se proporciona
        work_report = self.request.query_params.get('work_report', None)
        if work_report is not None:
            queryset = queryset.filter(work_report=work_report)
            
        return queryset

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_images(request):
    try:
        uploaded_images = []
        files = request.FILES.getlist('images')
        image_type = request.data.get('image_type', 'BEFORE')
        
        for image_file in files:
            image = ReportImage.objects.create(
                image=image_file,
                image_type=image_type
            )
            image.save()
            
            if image and image.id:
                # Usar la URL real para evitar problemas con rutas
                image_url = image.image.url
                
                # Si la URL comienza con /media/ pero debería ser /mediafiles/
                if image_url.startswith('/media/'):
                    image_url = f'/mediafiles/{image_url[7:]}'
                
                uploaded_images.append({
                    'id': image.id,
                    'image': image_url,
                    'description': '',
                    'image_type': image_type
                })
            
        return Response(uploaded_images)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['DELETE'])
def delete_image(request, image_id):
    try:
        image = ReportImage.objects.get(id=image_id)
        
        # Guardar el path para poder eliminar el archivo físico
        image_path = image.image.path
        
        # Eliminar la imagen de la base de datos (esto ya llama al método delete() del modelo)
        image.delete()
        
        return Response({"detail": "Imagen eliminada correctamente."}, status=status.HTTP_200_OK)
    except ReportImage.DoesNotExist:
        return Response({"detail": "Imagen no encontrada."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def report_counts(request):
    """Devuelve estadísticas de reportes para el dashboard"""
    try:
        total = WorkReport.objects.filter(is_deleted=False).count()
        draft = WorkReport.objects.filter(status='DRAFT', is_deleted=False).count()
        completed = WorkReport.objects.filter(status='COMPLETED', is_deleted=False).count()
        
        return Response({
            'total': total,
            'draft': draft,
            'completed': completed
        })
    except Exception as e:
        import traceback
        print(f"Error en report_counts: {str(e)}")
        print(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
