from rest_framework import serializers
from django.utils import timezone
from .models import (
    Contract, 
    MaintenanceRecord, 
    ContractDocument, 
    ContractReport, 
    ContractReportTechnician, 
    ContractReportMaterial, 
    ContractReportImage
)
from apps.customers.serializers import CustomerSerializer
from apps.users.serializers import UserSerializer
from apps.materials.models import Material, MaterialControl
from apps.materials.serializers import MaterialSerializer
# Importar los serializadores necesarios de reports
from apps.reports.serializers import TechnicianAssignmentSerializer, MaterialUsedSerializer, ReportImageSerializer
from django.db import transaction
import json

class ContractDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.name')
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ContractDocument
        fields = '__all__'
        
    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()
    maintenance_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = MaintenanceRecord
        fields = ['id', 'contract', 'date', 'maintenance_type', 'maintenance_type_display', 
                 'technician', 'performed_by', 'performed_by_name', 
                 'status', 'status_display', 'observations', 'created_at']
    
    def get_performed_by_name(self, obj):
        return obj.performed_by.username if obj.performed_by else None
    
    def get_maintenance_type_display(self, obj):
        return obj.maintenance_type_display
    
    def get_status_display(self, obj):
        return obj.status_display


class ContractReportSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    technicians = TechnicianAssignmentSerializer(many=True, read_only=True)
    materials_used = MaterialUsedSerializer(many=True, read_only=True)
    before_images = ReportImageSerializer(many=True, read_only=True)
    after_images = ReportImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ContractReport
        fields = '__all__'
    
    def get_status_display(self, obj):
        return dict(ContractReport.STATUS_CHOICES).get(obj.status, obj.status)
    
    def get_performed_by_name(self, obj):
        if obj.performed_by:
            if hasattr(obj.performed_by, 'name'):
                return obj.performed_by.name
            else:
                return obj.performed_by.username
        return None
    
    @transaction.atomic
    def create(self, validated_data):
        report = super().create(validated_data)
        request = self.context['request']

        # Procesar técnicos
        technicians_data = json.loads(request.data.get('technicians', '[]'))
        for tech_data in technicians_data:
            if tech_data and 'technician' in tech_data:
                ContractReportTechnician.objects.create(
                    contract_report=report,
                    technician_id=tech_data['technician']
                )

        # Procesar materiales
        materials_data = json.loads(request.data.get('materials_used', '[]'))
        for material_data in materials_data:
            if material_data and 'material' in material_data and 'quantity' in material_data:
                material_id = material_data.get('material')
                quantity = int(material_data.get('quantity'))
                
                # Crear el registro de material usado
                ContractReportMaterial.objects.create(
                    contract_report=report,
                    material_id=material_id,
                    quantity=quantity
                )
                
                # Actualizar stock total del material
                material = Material.objects.get(id=material_id)
                material.quantity -= quantity
                material.save()
                
                # Registrar en el control de materiales con la referencia al reporte de contrato
                from apps.materials.models import MaterialControl
                MaterialControl.objects.create(
                    user=request.user,
                    material=material,
                    quantity=quantity,
                    operation='REMOVE',
                    reason='USO',
                    contract_report=report,  # Usar contract_report en lugar de report
                    notes=f"Uso en reporte de contrato #{report.id}"  # Añadir nota descriptiva
                )

        # Procesar nuevas imágenes
        for key in request.FILES:
            if key.startswith('new_before_images_'):
                ContractReportImage.objects.create(
                    contract_report=report,
                    image=request.FILES[key],
                    image_type='BEFORE'
                )
            elif key.startswith('new_after_images_'):
                ContractReportImage.objects.create(
                    contract_report=report,
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
        ContractReportTechnician.objects.filter(contract_report=instance).delete()
        technicians_data = json.loads(request.data.get('technicians', '[]'))
        for tech_data in technicians_data:
            if tech_data and 'technician' in tech_data:
                ContractReportTechnician.objects.create(
                    contract_report=instance,
                    technician_id=tech_data['technician']
                )

        # Obtener los materiales actuales antes de actualizarlos
        current_materials = {
            material.material_id: material.quantity 
            for material in ContractReportMaterial.objects.filter(contract_report=instance)
        }
        
        # Los materiales que se van a usar en la nueva versión del reporte
        new_materials = {}
        
        # Procesar materiales
        materials_data = json.loads(request.data.get('materials_used', '[]'))
        for material_data in materials_data:
            if material_data and 'material' in material_data and 'quantity' in material_data:
                material_id = material_data['material']
                quantity = int(material_data['quantity'])
                location_id = material_data.get('location_id')
                
                new_materials[material_id] = quantity
                
                # Si es un material nuevo y se ha especificado una ubicación
                if material_id not in current_materials and location_id:
                    try:
                        from apps.storage.models import MaterialLocation
                        location = MaterialLocation.objects.get(id=location_id)
                        
                        # Verificar que la ubicación corresponde al material
                        if location.material.id != material_id:
                            raise serializers.ValidationError(f"La ubicación no corresponde al material seleccionado.")
                        
                        # Verificar que haya suficiente stock en la ubicación
                        if location.quantity < quantity:
                            raise serializers.ValidationError(f"No hay suficiente stock en la ubicación. Disponible: {location.quantity}")
                        
                        # Actualizar stock en ubicación
                        location.quantity -= quantity
                        location.save()
                    except MaterialLocation.DoesNotExist:
                        pass

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
        ContractReportMaterial.objects.filter(contract_report=instance).delete()
        
        # Crear los nuevos registros de materiales
        for material_data in materials_data:
            if material_data and 'material' in material_data and 'quantity' in material_data:
                ContractReportMaterial.objects.create(
                    contract_report=instance,
                    material_id=material_data['material'],
                    quantity=material_data['quantity']
                )

        # Procesar imágenes marcadas para eliminación
        images_to_delete_ids = json.loads(request.data.get('images_to_delete', '[]'))
        if images_to_delete_ids:
            images_to_delete = ContractReportImage.objects.filter(
                id__in=images_to_delete_ids,
                contract_report=instance
            )
            for image in images_to_delete:
                image.delete()
        
        # Actualizar las imágenes existentes
        existing_images = json.loads(request.data.get('existing_images', '[]'))
        for img_data in existing_images:
            if img_data.get('id'):
                try:
                    image = ContractReportImage.objects.get(id=img_data['id'], contract_report=instance)
                    image.description = img_data.get('description', '')
                    image.image_type = img_data['image_type']
                    image.save()
                except ContractReportImage.DoesNotExist:
                    pass

        # Procesar nuevas imágenes
        for key in request.FILES:
            if key.startswith('new_before_images_'):
                ContractReportImage.objects.create(
                    contract_report=instance,
                    image=request.FILES[key],
                    image_type='BEFORE'
                )
            elif key.startswith('new_after_images_'):
                ContractReportImage.objects.create(
                    contract_report=instance,
                    image=request.FILES[key],
                    image_type='AFTER'
                )

        return instance


class ContractSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')
    status_display = serializers.SerializerMethodField()
    maintenance_frequency_display = serializers.SerializerMethodField()
    is_maintenance_pending = serializers.ReadOnlyField()
    days_to_next_maintenance = serializers.ReadOnlyField()
    created_by_name = serializers.ReadOnlyField(source='created_by.name')
    
    class Meta:
        model = Contract
        fields = '__all__'
    
    def get_status_display(self, obj):
        return dict(Contract.STATUS_CHOICES).get(obj.status, obj.status)
    
    def get_maintenance_frequency_display(self, obj):
        if not obj.maintenance_frequency:
            return None
        return dict(Contract.MAINTENANCE_FREQUENCY_CHOICES).get(obj.maintenance_frequency, obj.maintenance_frequency)


class ContractDetailSerializer(ContractSerializer):
    """Serializador para detalles de contrato que incluye información adicional."""
    customer = CustomerSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    maintenance_records = serializers.SerializerMethodField()
    documents = ContractDocumentSerializer(many=True, read_only=True)
    recent_reports = serializers.SerializerMethodField()
    
    class Meta:
        model = Contract
        fields = '__all__'
    
    def get_maintenance_records(self, obj):
        # Mostrar solo los últimos 5 registros de mantenimiento
        records = obj.maintenance_records.all()[:5]
        return MaintenanceRecordSerializer(records, many=True).data
    
    def get_recent_reports(self, obj):
        # Mostrar solo los últimos 5 reportes
        reports = obj.reports.filter(is_deleted=False)[:5]
        return ContractReportSerializer(reports, many=True).data