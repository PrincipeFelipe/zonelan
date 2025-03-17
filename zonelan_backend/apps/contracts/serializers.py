from rest_framework import serializers
from django.utils import timezone
from .models import Contract, MaintenanceRecord, ContractDocument, ContractReport
from apps.customers.serializers import CustomerSerializer
from apps.users.serializers import UserSerializer
from apps.materials.models import Material, MaterialControl
from apps.materials.serializers import MaterialSerializer
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
    performed_by_name = serializers.ReadOnlyField(source='performed_by.name')
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = MaintenanceRecord
        fields = '__all__'
    
    def get_status_display(self, obj):
        return dict(MaintenanceRecord.STATUS_CHOICES).get(obj.status, obj.status)


class ContractReportSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.ReadOnlyField(source='performed_by.name')
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ContractReport
        fields = '__all__'
    
    def get_status_display(self, obj):
        return dict(ContractReport.STATUS_CHOICES).get(obj.status, obj.status)


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