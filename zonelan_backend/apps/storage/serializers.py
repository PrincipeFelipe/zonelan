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
        extra_kwargs = {
            'code': {'required': False, 'allow_null': True, 'allow_blank': True}
        }
    
    def validate(self, attrs):
        if 'code' not in attrs or attrs['code'] == "":
            attrs['code'] = None
        return attrs


class ShelfSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    warehouse_name = serializers.ReadOnlyField(source='department.warehouse.name')
    
    class Meta:
        model = Shelf
        fields = '__all__'
        extra_kwargs = {
            'code': {'required': False, 'allow_null': True, 'allow_blank': True}
        }

    def validate(self, attrs):
        if 'code' not in attrs or attrs['code'] == "":
            attrs['code'] = None
        return attrs


class TraySerializer(serializers.ModelSerializer):
    shelf_name = serializers.ReadOnlyField(source='shelf.name')
    department_name = serializers.ReadOnlyField(source='shelf.department.name')
    warehouse_name = serializers.ReadOnlyField(source='shelf.department.warehouse.name')
    department_id = serializers.ReadOnlyField(source='shelf.department.id')
    warehouse_id = serializers.ReadOnlyField(source='shelf.department.warehouse.id')
    
    class Meta:
        model = Tray
        fields = ['id', 'shelf', 'name', 'code', 'description', 'is_active', 
                  'created_at', 'updated_at', 'shelf_name', 'department_name', 
                  'warehouse_name', 'department_id', 'warehouse_id']
        extra_kwargs = {
            'code': {'required': False, 'allow_null': True, 'allow_blank': True}
        }
        
    def validate(self, attrs):
        if 'code' not in attrs or attrs['code'] == "":
            attrs['code'] = None
        return attrs


class MaterialLocationSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source='material.name')
    tray_name = serializers.ReadOnlyField(source='tray.name')
    shelf_name = serializers.ReadOnlyField(source='tray.shelf.name')
    department_name = serializers.ReadOnlyField(source='tray.shelf.department.name')
    warehouse_name = serializers.ReadOnlyField(source='tray.shelf.department.warehouse.name')
    tray_full_code = serializers.ReadOnlyField(source='tray.get_full_code')
    
    # Añadir este campo que será ignorado
    code = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = MaterialLocation
        fields = '__all__'
    
    def create(self, validated_data):
        # Eliminar 'code' si está presente antes de crear la instancia
        if 'code' in validated_data:
            validated_data.pop('code')
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Eliminar 'code' si está presente antes de actualizar la instancia
        if 'code' in validated_data:
            validated_data.pop('code')
        return super().update(instance, validated_data)


class MaterialMovementSerializer(serializers.ModelSerializer):
    material_name = serializers.ReadOnlyField(source='material.name')
    operation_display = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    username = serializers.ReadOnlyField(source='user.username')  # Añadir el campo username
    
    # Añadir estos campos para origen
    source_location_display = serializers.SerializerMethodField()
    source_location_warehouse = serializers.SerializerMethodField()
    
    # Añadir estos campos para destino
    target_location_display = serializers.SerializerMethodField()
    target_location_warehouse = serializers.SerializerMethodField()
    
    class Meta:
        model = MaterialMovement
        fields = '__all__'
    
    def get_operation_display(self, obj):
        return obj.get_operation_display()
    
    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return "---"
    
    # Método para obtener el display del origen
    def get_source_location_display(self, obj):
        if not obj.source_location:
            return None
        
        tray = obj.source_location.tray
        shelf = tray.shelf
        department = shelf.department
        warehouse = department.warehouse
        
        return f"{warehouse.name} > {department.name} > {shelf.name} > {tray.name}"
    
    # Método para obtener el almacén de origen
    def get_source_location_warehouse(self, obj):
        if not obj.source_location:
            return None
        return obj.source_location.tray.shelf.department.warehouse.id
    
    # Método para obtener el display del destino
    def get_target_location_display(self, obj):
        """
        Muestra la información completa de la ubicación de destino.
        """
        if obj.target_location:
            return self._get_full_location_path(obj.target_location)
        elif hasattr(obj, 'target_tray') and obj.target_tray:
            try:
                tray = Tray.objects.get(id=obj.target_tray)
                return f"{tray.shelf.department.warehouse.name} > {tray.shelf.department.name} > {tray.shelf.name} > {tray.name}"
            except Tray.DoesNotExist:
                return "Ubicación no encontrada"
        return None
    
    # Método para obtener el almacén de destino
    def get_target_location_warehouse(self, obj):
        """
        Obtiene el ID del almacén donde se encuentra la ubicación de destino.
        """
        if obj.target_location:
            try:
                return obj.target_location.tray.shelf.department.warehouse.id
            except AttributeError:
                return None
        return None
    
    # Agregar este método que falta
    def _get_full_location_path(self, location):
        """
        Devuelve la ruta completa de una ubicación en formato legible.
        """
        try:
            tray = location.tray
            shelf = tray.shelf
            department = shelf.department
            warehouse = department.warehouse
            
            return f"{warehouse.name} > {department.name} > {shelf.name} > {tray.name}"
        except Exception:
            return "Ubicación no disponible"


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