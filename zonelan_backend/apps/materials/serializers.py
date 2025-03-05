from rest_framework import serializers
from .models import Material, MaterialControl

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'quantity', 'price']

class MaterialControlSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    material_name = serializers.ReadOnlyField(source='material.name')

    class Meta:
        model = MaterialControl
        fields = ['id', 'user', 'user_name', 'material', 'material_name', 'quantity', 'operation', 'date']
        read_only_fields = ['date']