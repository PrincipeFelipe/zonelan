from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import filters
from django.db.models import Q
from .models import Incident
from .serializers import IncidentSerializer

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        queryset = Incident.objects.all()
        
        # Filtrar por cliente si se proporciona
        customer_id = self.request.query_params.get('customer', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # Filtrar por fechas si se proporcionan
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date and end_date:
            queryset = queryset.filter(
                Q(created_at__date__gte=start_date) &
                Q(created_at__date__lte=end_date)
            )
        
        return queryset

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
