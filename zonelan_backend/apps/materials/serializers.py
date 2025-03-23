from rest_framework import serializers
from .models import Material, MaterialControl

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'quantity', 'price']

class MaterialControlSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source='material.name')
    username = serializers.ReadOnlyField(source='user.username')
    operation_display = serializers.ReadOnlyField(source='get_operation_display')
    reason_display = serializers.ReadOnlyField(source='get_reason_display')
    report_id = serializers.PrimaryKeyRelatedField(source='report', read_only=True)
    ticket_id = serializers.PrimaryKeyRelatedField(source='ticket', read_only=True)
    contract_report_id = serializers.PrimaryKeyRelatedField(source='contract_report', read_only=True)
    movement_id = serializers.IntegerField(read_only=True)
    ticket_deleted = serializers.SerializerMethodField()
    ticket_deleted_at = serializers.SerializerMethodField()
    report_deleted = serializers.SerializerMethodField()
    report_deleted_at = serializers.SerializerMethodField()
    contract_report_deleted = serializers.SerializerMethodField()
    contract_report_deleted_at = serializers.SerializerMethodField()
    
    class Meta:
        model = MaterialControl
        fields = [
            'id', 'user', 'username', 'material', 'material_name', 'quantity', 
            'operation', 'operation_display', 'reason', 'reason_display', 
            'date', 'report', 'report_id', 'report_deleted', 'report_deleted_at', 
            'ticket', 'ticket_id', 'contract_report', 'contract_report_id',
            'contract_report_deleted', 'contract_report_deleted_at',
            'movement_id', 'location_reference', 'invoice_image', 
            'ticket_deleted', 'ticket_deleted_at', 'notes'
        ]
    
    def get_ticket_deleted(self, obj):
        if obj.ticket:
            return obj.ticket.is_deleted
        return False

    def get_ticket_deleted_at(self, obj):
        if obj.ticket and obj.ticket.is_deleted and obj.ticket.deleted_at:
            return obj.ticket.deleted_at
        return None

    def get_report_deleted(self, obj):
        if obj.report:
            return obj.report.is_deleted
        return False
        
    def get_report_deleted_at(self, obj):
        if obj.report and obj.report.is_deleted and hasattr(obj.report, 'deleted_at'):
            return obj.report.deleted_at
        return None

    def get_contract_report_deleted(self, obj):
        if obj.contract_report:
            return obj.contract_report.is_deleted
        return False

    def get_contract_report_deleted_at(self, obj):
        if obj.contract_report and obj.contract_report.is_deleted and hasattr(obj.contract_report, 'deleted_at'):
            return obj.contract_report.deleted_at
        return None