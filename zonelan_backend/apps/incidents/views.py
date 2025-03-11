from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import filters
from django.db.models import Q
from .models import Incident
from .serializers import IncidentSerializer
from django_filters.rest_framework import DjangoFilterBackend

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all().order_by('-created_at')
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'status', 'priority']  # Añadir 'customer' aquí
    search_fields = ['title', 'description', 'customer__name', 'customer__business_name', 'customer__tax_id']
    ordering_fields = ['created_at', 'status', 'priority']
    
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
    Retorna estadísticas de incidencias: pendientes, en progreso y total
    """
    try:
        pending_count = Incident.objects.filter(status='PENDING').count()
        in_progress_count = Incident.objects.filter(status='IN_PROGRESS').count()
        active_count = pending_count + in_progress_count
        total_count = Incident.objects.count()
        
        return Response({
            'pending': pending_count,  # Solo las pendientes
            'in_progress': in_progress_count,
            'active': active_count,    # Suma de pendientes + en progreso
            'total': total_count       # Todas las incidencias
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Create your views here.
