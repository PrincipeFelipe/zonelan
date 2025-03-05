from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    def get_permissions(self):
        """
        Permite acceso sin autenticación a las acciones 'create' y 'list',
        pero requiere autenticación para el resto.
        """
        if self.action in ['create', 'list']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        customer = serializer.save()
        customer.save()
