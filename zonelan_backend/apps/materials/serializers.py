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
    
    class Meta:
        model = MaterialControl
        fields = ['id', 'material', 'material_name', 'user', 'user_name', 
                  'quantity', 'operation', 'reason', 'report', 'report_deleted', 'date']
    
    def get_report_deleted(self, obj):
        if obj.report:
            return obj.report.is_deleted
        return False