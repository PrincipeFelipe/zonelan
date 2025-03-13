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
            location_id = material_data.get('location_id')  # Nueva variable para obtener la ubicación
            
            if material_id and quantity:
                material = Material.objects.get(id=material_id)
                
                # Crear MaterialUsed
                MaterialUsed.objects.create(
                    report=report,
                    material_id=material_id,
                    quantity=quantity
                )
                
                # Verificar si se está usando una ubicación específica
                if location_id:
                    try:
                        from apps.storage.models import MaterialLocation
                        location = MaterialLocation.objects.get(id=location_id)
                        
                        # Verificar que la ubicación corresponde al material
                        if location.material.id != int(material_id):
                            raise ValidationError(f"La ubicación no corresponde al material seleccionado.")
                        
                        # Verificar que haya suficiente stock en la ubicación
                        if location.quantity < int(quantity):
                            raise ValidationError(f"No hay suficiente stock en la ubicación. Disponible: {location.quantity}")
                        
                        # Actualizar stock en ubicación
                        location.quantity -= int(quantity)
                        location.save()
                        
                        # En este caso, ya se descontará del stock total más abajo
                    except MaterialLocation.DoesNotExist:
                        # Si la ubicación no existe, seguir con la lógica normal
                        pass
                
                # Actualizar stock total
                material.quantity -= int(quantity)
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
        request = self.context.get('request')
        
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
        
        # Procesar materiales
        materials_data = json.loads(request.data.get('materials_used', '[]'))
        for material_data in materials_data:
            if material_data and 'material' in material_data and 'quantity' in material_data:
                material_id = material_data['material']
                quantity = int(material_data['quantity'])
                location_id = material_data.get('location_id')  # Obtener la ubicación seleccionada
                
                new_materials[material_id] = quantity
                
                # Si es un material nuevo y se ha especificado una ubicación
                if material_id not in current_materials and location_id:
                    try:
                        from apps.storage.models import MaterialLocation
                        location = MaterialLocation.objects.get(id=location_id)
                        
                        # Verificar que la ubicación corresponde al material
                        if location.material.id != material_id:
                            raise ValidationError(f"La ubicación no corresponde al material seleccionado.")
                        
                        # Verificar que haya suficiente stock en la ubicación
                        if location.quantity < quantity:
                            raise ValidationError(f"No hay suficiente stock en la ubicación. Disponible: {location.quantity}")
                        
                        # Actualizar stock en ubicación
                        location.quantity -= quantity
                        location.save()
                        
                        # El stock total se manejará más adelante, no aquí
                        # ELIMINAR ESTA PARTE:
                        # from apps.materials.models import Material
                        # material = Material.objects.get(id=material_id)
                        # material.quantity -= quantity
                        # material.save()
                        
                    except MaterialLocation.DoesNotExist:
                        raise ValidationError(f"La ubicación especificada no existe.")
        
        # Identificar materiales que se van a eliminar (están en current pero no en new)
        for material_id, old_quantity in current_materials.items():
            if material_id not in new_materials:
                # Material eliminado: devolver al inventario
                material = Material.objects.get(id=material_id)
                
                # Devolver al inventario
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
                # Material nuevo: registrar como USO, pero solo si no se ha procesado ya a través de location_id
                material = Material.objects.get(id=material_id)
                
                # Aquí es donde se debe reducir el inventario general si no se ha usado location_id
                location_id_used = False
                for m_data in materials_data:
                    if m_data.get('material') == material_id and m_data.get('location_id'):
                        location_id_used = True
                        break
                
                if not location_id_used:
                    # Reducir el inventario solo si no se ha procesado a través de location_id
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