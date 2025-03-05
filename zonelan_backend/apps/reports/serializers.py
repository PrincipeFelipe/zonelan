from rest_framework import serializers
from .models import WorkReport, MaterialUsed, TechnicianAssignment, ReportImage
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
            MaterialUsed.objects.create(
                report=report,
                material_id=material_data['material'],
                quantity=material_data['quantity']
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
        
        # Eliminar imágenes que ya no están en existing_images
        ReportImage.objects.filter(
            report=instance
        ).exclude(
            id__in=existing_image_ids
        ).delete()
        
        # Actualizar las imágenes existentes que permanecen
        for img_data in existing_images:
            if img_data.get('id'):
                ReportImage.objects.filter(id=img_data['id']).update(
                    description=img_data.get('description', ''),
                    image_type=img_data['image_type']
                )

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