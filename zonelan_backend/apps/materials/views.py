from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import transaction
from .models import Material, MaterialControl
from .serializers import MaterialSerializer, MaterialControlSerializer

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by('name')
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        material = serializer.save()
        
        # Registrar en el control de materiales
        MaterialControl.objects.create(
            user=request.user,
            material=material,
            quantity=material.quantity,
            operation='ADD',
            reason='COMPRA'  # Para nuevos materiales, siempre es COMPRA
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_quantity = instance.quantity
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Obtener los datos adicionales para el registro de control
        operation = request.data.get('operation')
        quantity_change = int(request.data.get('quantity_change', 0))
        reason = request.data.get('reason')
        
        # Registrar el control solo si hay información de operación y no llamar a perform_update
        if operation and quantity_change > 0:
            MaterialControl.objects.create(
                user=request.user,
                material=instance,
                quantity=quantity_change,
                operation=operation,
                reason=reason
            )
            
            # Actualizar el material directamente sin llamar a perform_update
            if operation == 'ADD':
                instance.quantity += quantity_change
            else:
                instance.quantity -= quantity_change
                
            instance.name = request.data.get('name', instance.name)
            instance.price = request.data.get('price', instance.price)
            instance.save()
            
            return Response(serializer.data)
        else:
            # Si no hay operación, solo actualizamos los campos básicos
            self.perform_update(serializer)
            return Response(serializer.data)

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
            materials_used = instance.materials_used.all()
            
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

class MaterialControlViewSet(viewsets.ModelViewSet):
    queryset = MaterialControl.objects.all().order_by('-date')
    serializer_class = MaterialControlSerializer
    permission_classes = [IsAuthenticated]
