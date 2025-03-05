from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Incident
from .serializers import IncidentSerializer

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

    def get_queryset(self):
        queryset = Incident.objects.all()
        
        # Filtrar por cliente si se proporciona
        customer = self.request.query_params.get('customer', None)
        if customer is not None:
            queryset = queryset.filter(customer=customer)
        
        # Filtrar por estado si se proporciona
        status = self.request.query_params.get('status', None)
        if status is not None:
            queryset = queryset.filter(status=status)

        return queryset.order_by('-created_at')

# Create your views here.
