from rest_framework import serializers
from .models import (
    Warehouse, Department, Shelf, Tray, 
    MaterialLocation, MaterialMovement
)


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.ReadOnlyField(source='warehouse.name')
    
    class Meta:
        model = Department
        fields = '__all__'


class ShelfSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    warehouse_name = serializers.ReadOnlyField(source='department.warehouse.name')
    
    class Meta:
        model = Shelf
        fields = '__all__'


class TraySerializer(serializers.ModelSerializer):
    shelf_name = serializers.ReadOnlyField(source='shelf.name')
    department_name = serializers.ReadOnlyField(source='shelf.department.name')
    warehouse_name = serializers.ReadOnlyField(source='shelf.department.warehouse.name')
    full_code = serializers.ReadOnlyField(source='get_full_code')
    
    class Meta:
        model = Tray
        fields = '__all__'


class MaterialLocationSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source='material.name')
    tray_name = serializers.ReadOnlyField(source='tray.name')
    shelf_name = serializers.ReadOnlyField(source='tray.shelf.name')
    department_name = serializers.ReadOnlyField(source='tray.shelf.department.name')
    warehouse_name = serializers.ReadOnlyField(source='tray.shelf.department.warehouse.name')
    tray_full_code = serializers.ReadOnlyField(source='tray.get_full_code')
    
    class Meta:
        model = MaterialLocation
        fields = '__all__'


class MaterialMovementSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source='material.name')
    user_name = serializers.ReadOnlyField(source='user.username')
    operation_display = serializers.CharField(source='get_operation_display', read_only=True)
    
    class Meta:
        model = MaterialMovement
        fields = '__all__'
        read_only_fields = ('timestamp',)


class NestedDepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ('id', 'name', 'code', 'is_active')


class NestedShelfSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shelf
        fields = ('id', 'name', 'code', 'is_active')


class NestedTraySerializer(serializers.ModelSerializer):
    class Meta:
        model = Tray
        fields = ('id', 'name', 'code', 'is_active')


class DetailedWarehouseSerializer(serializers.ModelSerializer):
    departments = NestedDepartmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Warehouse
        fields = '__all__'


class DetailedDepartmentSerializer(serializers.ModelSerializer):
    shelves = NestedShelfSerializer(many=True, read_only=True)
    warehouse_name = serializers.ReadOnlyField(source='warehouse.name')
    
    class Meta:
        model = Department
        fields = '__all__'


class DetailedShelfSerializer(serializers.ModelSerializer):
    trays = NestedTraySerializer(many=True, read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    warehouse_name = serializers.ReadOnlyField(source='department.warehouse.name')
    
    class Meta:
        model = Shelf
        fields = '__all__'


class MaterialLocationWithMovementsSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source='material.name')
    tray_name = serializers.ReadOnlyField(source='tray.name')
    tray_full_code = serializers.ReadOnlyField(source='tray.get_full_code')
    recent_movements = serializers.SerializerMethodField()
    
    class Meta:
        model = MaterialLocation
        fields = '__all__'
    
    def get_recent_movements(self, obj):
        movements = MaterialMovement.objects.filter(
            material=obj.material, 
            source_location=obj
        ).order_by('-timestamp')[:5]  # Últimos 5 movimientos
        return MaterialMovementSerializer(movements, many=True).data