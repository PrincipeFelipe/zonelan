from django.contrib import admin
from .models import Material, MaterialControl

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'quantity', 'price')
    search_fields = ('name',)

@admin.register(MaterialControl)
class MaterialControlAdmin(admin.ModelAdmin):
    list_display = ('material', 'user', 'quantity', 'operation', 'reason', 'report', 'ticket', 'date')
    list_filter = ('material', 'user', 'operation', 'reason', 'date')
    search_fields = ('material__name', 'user__username')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('material', 'user', 'report', 'ticket')
