from rest_framework import serializers
from .models import WorkReport, MaterialUsed, TechnicianAssignment, ReportImage
from apps.materials.models import Material, MaterialControl  # Corregido: importar desde apps.materials.models
from django.db import transaction
import json

class ReportImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportImage
        fields = ['id', 'image', 'description', 'image_type', 'created_at']

class TechnicianAssignmentSerializer(serializers.ModelSerializer):
    technician_name = serializers.ReadOnlyField(source='technician.username')

    class Meta:
        model = TechnicianAssignment
        fields = ['id', 'technician', 'technician_name']

class MaterialUsedSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source='material.name')
    available_stock = serializers.ReadOnlyField(source='material.quantity')

    class Meta:
        model = MaterialUsed
        fields = ['id', 'material', 'material_name', 'quantity', 'available_stock']

    def validate(self, data):
        material = data.get('material')
        quantity = data.get('quantity')

        if material and quantity:
            if material.quantity < quantity:
                raise serializers.ValidationError({
                    'quantity': f'No hay suficiente stock. Stock disponible: {material.quantity}'
                })
        return data

class WorkReportSerializer(serializers.ModelSerializer):
    materials_used = MaterialUsedSerializer(many=True, read_only=True)
    technicians = TechnicianAssignmentSerializer(many=True, read_only=True)
    before_images = ReportImageSerializer(many=True, read_only=True)
    after_images = ReportImageSerializer(many=True, read_only=True)
    incident_title = serializers.ReadOnlyField(source='incident.title')
    customer_name = serializers.ReadOnlyField(source='incident.customer.name')

    class Meta:
        model = WorkReport
        fields = '__all__'

    def get_before_images(self, obj):
        return ReportImageSerializer(obj.before_images, many=True).data

    def get_after_images(self, obj):
        return ReportImageSerializer(obj.after_images, many=True).data

    @transaction.atomic
    def create(self, validated_data):
        report = super().create(validated_data)
        request = self.context['request']

        # Procesar técnicos
        technicians_data = json.loads(request.data.get('technicians', '[]'))
        for tech_data in technicians_data:
            TechnicianAssignment.objects.create(
                report=report,
                technician_id=tech_data['technician']
            )

        # Procesar materiales
        materials_data = json.loads(request.data.get('materials_used', '[]'))
        for material_data in materials_data:
            material_id = material_data.get('material')
            quantity = material_data.get('quantity')
            
            if material_id and quantity:
                material = Material.objects.get(id=material_id)
                
                # Crear MaterialUsed
                MaterialUsed.objects.create(
                    report=report,
                    material_id=material_id,
                    quantity=quantity
                )
                
                # Actualizar stock
                material.quantity -= quantity
                material.save()
                
                # Registrar en el control de materiales
                MaterialControl.objects.create(
                    user=request.user,
                    material=material,
                    quantity=quantity,
                    operation='REMOVE',
                    reason='USO',
                    report=report
                )

        # Procesar nuevas imágenes
        for key in request.FILES:
            if key.startswith('new_before_images_'):
                ReportImage.objects.create(
                    report=report,
                    image=request.FILES[key],
                    image_type='BEFORE'
                )
            elif key.startswith('new_after_images_'):
                ReportImage.objects.create(
                    report=report,
                    image=request.FILES[key],
                    image_type='AFTER'
                )

        return report

    @transaction.atomic
    def update(self, instance, validated_data):
        request = self.context['request']
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            if attr not in ['technicians', 'materials_used']:
                setattr(instance, attr, value)
        instance.save()

        # Actualizar técnicos
        TechnicianAssignment.objects.filter(report=instance).delete()
        technicians_data = json.loads(request.data.get('technicians', '[]'))
        for tech_data in technicians_data:
            if tech_data and 'technician' in tech_data:
                TechnicianAssignment.objects.create(
                    report=instance,
                    technician_id=tech_data['technician']
                )

        # Actualizar materiales
        current_materials = list(MaterialUsed.objects.filter(report=instance))
        for current_material in current_materials:
            current_material.material.quantity += current_material.quantity
            current_material.material.save()
        MaterialUsed.objects.filter(report=instance).delete()

        materials_data = json.loads(request.data.get('materials_used', '[]'))
        for material_data in materials_data:
            if material_data and 'material' in material_data and 'quantity' in material_data:
                MaterialUsed.objects.create(
                    report=instance,
                    material_id=material_data['material'],
                    quantity=material_data['quantity']
                )

        # Manejar imágenes existentes
        existing_images = json.loads(request.data.get('existing_images', '[]'))
        existing_image_ids = [img['id'] for img in existing_images if 'id' in img]
        
        # Procesar imágenes marcadas para eliminación
        images_to_delete_ids = json.loads(request.data.get('images_to_delete', '[]'))
        if images_to_delete_ids:
            # Primero verificamos que las imágenes pertenezcan a este reporte para evitar eliminaciones no autorizadas
            images_to_delete = ReportImage.objects.filter(
                id__in=images_to_delete_ids,
                report=instance
            )
            # Eliminar cada imagen (esto llamará al método delete sobrescrito que elimina el archivo físico)
            for image in images_to_delete:
                image.delete()
        
        # Actualizar las imágenes existentes que permanecen
        for img_data in existing_images:
            if img_data.get('id'):
                try:
                    # Verificar si la imagen existe antes de actualizarla
                    image = ReportImage.objects.get(id=img_data['id'], report=instance)
                    image.description = img_data.get('description', '')
                    image.image_type = img_data['image_type']
                    image.save()
                except ReportImage.DoesNotExist:
                    # La imagen puede no existir si se carga solo el id pero la imagen fue eliminada
                    pass

        # Procesar nuevas imágenes
        for key in request.FILES:
            if key.startswith('new_before_images_'):
                ReportImage.objects.create(
                    report=instance,
                    image=request.FILES[key],
                    image_type='BEFORE'
                )
            elif key.startswith('new_after_images_'):
                ReportImage.objects.create(
                    report=instance,
                    image=request.FILES[key],
                    image_type='AFTER'
                )

        return instance

    def validate(self, data):
        if data.get('status') == 'COMPLETED' and not data.get('hours_worked'):
            raise serializers.ValidationError({
                'hours_worked': 'Las horas trabajadas son obligatorias cuando el parte está completado.'
            })
        return data