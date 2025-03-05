from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Material, MaterialControl
from .serializers import MaterialSerializer, MaterialControlSerializer

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        material = serializer.save()
        MaterialControl.objects.create(
            user=self.request.user,
            material=material,
            quantity=material.quantity,
            operation='ADD'
        )

    def perform_update(self, serializer):
        old_quantity = self.get_object().quantity
        material = serializer.save()
        quantity_change = material.quantity - old_quantity
        if quantity_change != 0:
            operation = 'ADD' if quantity_change > 0 else 'REMOVE'
            MaterialControl.objects.create(
                user=self.request.user,
                material=material,
                quantity=abs(quantity_change),
                operation=operation
            )

class MaterialControlViewSet(viewsets.ModelViewSet):
    queryset = MaterialControl.objects.all().order_by('-date')
    serializer_class = MaterialControlSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
