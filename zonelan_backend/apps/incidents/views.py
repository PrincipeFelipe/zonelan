from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Incident
from .serializers import IncidentSerializer

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
def incident_counts(request):
    """
    Retorna el número de incidencias pendientes y en progreso
    """
    try:
        pending_count = Incident.objects.filter(status='PENDING').count()
        in_progress_count = Incident.objects.filter(status='IN_PROGRESS').count()
        
        return Response({
            'pending': pending_count,
            'in_progress': in_progress_count,
            'total': pending_count + in_progress_count
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Create your views here.
