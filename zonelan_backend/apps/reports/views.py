from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from .models import WorkReport, MaterialUsed, ReportImage
from .serializers import WorkReportSerializer, MaterialUsedSerializer
from apps.materials.models import Material, MaterialControl

class WorkReportViewSet(viewsets.ModelViewSet):
    queryset = WorkReport.objects.filter(is_deleted=False)
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
        queryset = WorkReport.objects.filter(is_deleted=False)  # Solo mostrar los no eliminados
        
        # Filtrar por incidencia si se proporciona
        incident = self.request.query_params.get('incident', None)
        if incident is not None:
            queryset = queryset.filter(incident=incident)
        
        # Filtrar por estado si se proporciona
        status = self.request.query_params.get('status', None)
        if status is not None:
            queryset = queryset.filter(status=status)

        return queryset.order_by('-date')
    
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
