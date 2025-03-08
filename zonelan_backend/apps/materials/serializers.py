from rest_framework import serializers
from .models import Material, MaterialControl

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'quantity', 'price']

class MaterialControlSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source='material.name')
    user_name = serializers.ReadOnlyField(source='user.username')
    report_deleted = serializers.SerializerMethodField()
    ticket_number = serializers.SerializerMethodField()
    ticket_canceled = serializers.SerializerMethodField()
    invoice_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MaterialControl
        fields = ['id', 'material', 'material_name', 'user', 'user_name', 
                  'quantity', 'operation', 'reason', 'report', 'report_deleted',
                  'ticket', 'ticket_number', 'ticket_canceled',
                  'invoice_url', 'date']
    
    def get_report_deleted(self, obj):
        if obj.report:
            try:
                return obj.report.is_deleted
            except:
                return True
        return False
    
    def get_ticket_number(self, obj):
        if obj.ticket:
            try:
                return obj.ticket.ticket_number
            except:
                return None
        return None
    
    def get_ticket_canceled(self, obj):
        if obj.ticket:
            try:
                return obj.ticket.status == 'CANCELED'
            except:
                return False
        return False
    
    def get_invoice_url(self, obj):
        if obj.invoice_image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.invoice_image.url)
            return obj.invoice_image.url
        return None