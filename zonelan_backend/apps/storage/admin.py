from django.contrib import admin
from .models import (
    Warehouse, Department, Shelf, Tray,
    MaterialLocation, MaterialMovement
)


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'location', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'code', 'location')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'warehouse', 'is_active')
    list_filter = ('warehouse', 'is_active')
    search_fields = ('name', 'code')


@admin.register(Shelf)
class ShelfAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'department', 'is_active')
    list_filter = ('department__warehouse', 'department', 'is_active')
    search_fields = ('name', 'code')


@admin.register(Tray)
class TrayAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'shelf', 'is_active', 'get_full_code')
    list_filter = ('shelf__department__warehouse', 'shelf__department', 'shelf', 'is_active')
    search_fields = ('name', 'code')


@admin.register(MaterialLocation)
class MaterialLocationAdmin(admin.ModelAdmin):
    list_display = ('material', 'tray', 'quantity', 'minimum_quantity')
    list_filter = ('tray__shelf__department__warehouse', 'tray__shelf__department', 'tray__shelf')
    search_fields = ('material__name', 'tray__name', 'tray__code')


@admin.register(MaterialMovement)
class MaterialMovementAdmin(admin.ModelAdmin):
    list_display = ('material', 'quantity', 'operation', 'source_location', 'target_location', 'user', 'timestamp')
    list_filter = ('operation', 'user', 'timestamp')
    search_fields = ('material__name', 'notes')
    date_hierarchy = 'timestamp'
