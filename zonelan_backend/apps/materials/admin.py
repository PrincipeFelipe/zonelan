from django.contrib import admin
from .models import Material, MaterialControl

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'quantity', 'price')
    search_fields = ('name',)

@admin.register(MaterialControl)
class MaterialControlAdmin(admin.ModelAdmin):
    list_display = ('material', 'user', 'quantity', 'date')
    list_filter = ('material', 'user', 'date')
    search_fields = ('material__name', 'user__username')
