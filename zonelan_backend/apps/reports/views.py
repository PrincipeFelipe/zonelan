from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from .models import WorkReport, MaterialUsed, ReportImage
from .serializers import WorkReportSerializer, MaterialUsedSerializer

class WorkReportViewSet(viewsets.ModelViewSet):
    queryset = WorkReport.objects.all()
    serializer_class = WorkReportSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Guardar el reporte sin el técnico
        report = serializer.save()
        
        # Procesar técnicos
        technicians_data = self.request.data.get('technicians', [])
        for tech_data in technicians_data:
            if tech_data and 'technician' in tech_data:
                TechnicianAssignment.objects.create(
                    report=report,
                    technician_id=tech_data['technician']
                )

        # Procesar materiales
        materials_data = self.request.data.get('materials_used', [])
        for material_data in materials_data:
            if material_data and 'material' in material_data and 'quantity' in material_data:
                MaterialUsed.objects.create(
                    report=report,
                    material_id=material_data['material'],
                    quantity=material_data['quantity']
                )

        return report

    def get_queryset(self):
        queryset = WorkReport.objects.all()
        
        # Filtrar por incidencia si se proporciona
        incident = self.request.query_params.get('incident', None)
        if incident is not None:
            queryset = queryset.filter(incident=incident)
        
        # Filtrar por estado si se proporciona
        status = self.request.query_params.get('status', None)
        if status is not None:
            queryset = queryset.filter(status=status)

        return queryset.order_by('-date')

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
                # Usar solo la ruta relativa de la imagen
                uploaded_images.append({
                    'id': image.id,
                    'image': image.image.url,  # Esto devolverá la ruta relativa
                    'description': '',
                    'image_type': image_type
                })
            
        return Response(uploaded_images)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
