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

        # Obtener los materiales actuales antes de actualizarlos
        current_materials = {
            material.material_id: material.quantity 
            for material in MaterialUsed.objects.filter(report=instance)
        }
        
        # Los materiales que se van a usar en la nueva versión del reporte
        new_materials = {}
        materials_data = json.loads(request.data.get('materials_used', '[]'))
        for material_data in materials_data:
            if material_data and 'material' in material_data and 'quantity' in material_data:
                material_id = material_data['material']
                quantity = int(material_data['quantity'])
                new_materials[material_id] = quantity
        
        # Identificar materiales que se van a eliminar (están en current pero no en new)
        for material_id, old_quantity in current_materials.items():
            if material_id not in new_materials:
                # Material eliminado: registrar como DEVOLUCION
                material = Material.objects.get(id=material_id)
                
                # Devolver el material al inventario
                material.quantity += old_quantity
                material.save()
                
                # Registrar en el control como devolución
                MaterialControl.objects.create(
                    user=request.user,
                    material=material,
                    quantity=old_quantity,
                    operation='ADD',
                    reason='DEVOLUCION',
                    report=instance
                )
            elif new_materials[material_id] < old_quantity:
                # Cantidad disminuida: devolver la diferencia
                material = Material.objects.get(id=material_id)
                difference = old_quantity - new_materials[material_id]
                
                # Devolver la diferencia al inventario
                material.quantity += difference
                material.save()
                
                # Registrar en el control como devolución parcial
                MaterialControl.objects.create(
                    user=request.user,
                    material=material,
                    quantity=difference,
                    operation='ADD',
                    reason='DEVOLUCION',
                    report=instance
                )
        
        # Identificar materiales que se van a añadir o aumentar (están en new pero no en current o con mayor cantidad)
        for material_id, new_quantity in new_materials.items():
            if material_id not in current_materials:
                # Material nuevo: registrar como USO
                material = Material.objects.get(id=material_id)
                
                # Reducir el inventario
                material.quantity -= new_quantity
                material.save()
                
                # Registrar en el control como uso
                MaterialControl.objects.create(
                    user=request.user,
                    material=material,
                    quantity=new_quantity,
                    operation='REMOVE',
                    reason='USO',
                    report=instance
                )
            elif new_quantity > current_materials[material_id]:
                # Cantidad aumentada: usar la diferencia
                material = Material.objects.get(id=material_id)
                difference = new_quantity - current_materials[material_id]
                
                # Reducir la diferencia del inventario
                material.quantity -= difference
                material.save()
                
                # Registrar en el control como uso adicional
                MaterialControl.objects.create(
                    user=request.user,
                    material=material,
                    quantity=difference,
                    operation='REMOVE',
                    reason='USO',
                    report=instance
                )
        
        # Eliminar todos los materiales actuales para recrearlos
        MaterialUsed.objects.filter(report=instance).delete()
        
        # Crear los nuevos registros de materiales (sin afectar inventario adicional, ya se hizo arriba)
        for material_data in materials_data:
            if material_data and 'material' in material_data and 'quantity' in material_data:
                MaterialUsed.objects.create(
                    report=instance,
                    material_id=material_data['material'],
                    quantity=material_data['quantity']
                )

        # Procesar imágenes marcadas para eliminación
        images_to_delete_ids = json.loads(request.data.get('images_to_delete', '[]'))
        if images_to_delete_ids:
            images_to_delete = ReportImage.objects.filter(
                id__in=images_to_delete_ids,
                report=instance
            )
            for image in images_to_delete:
                image.delete()
        
        # Actualizar las imágenes existentes
        existing_images = json.loads(request.data.get('existing_images', '[]'))
        for img_data in existing_images:
            if img_data.get('id'):
                try:
                    image = ReportImage.objects.get(id=img_data['id'], report=instance)
                    image.description = img_data.get('description', '')
                    image.image_type = img_data['image_type']
                    image.save()
                except ReportImage.DoesNotExist:
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