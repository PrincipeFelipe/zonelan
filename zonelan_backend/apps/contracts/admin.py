from django.contrib import admin
from .models import Contract, MaintenanceRecord, ContractDocument, ContractReport

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('title', 'customer', 'status', 'start_date', 'end_date', 'requires_maintenance', 'next_maintenance_date')
    list_filter = ('status', 'requires_maintenance', 'customer')
    search_fields = ('title', 'description', 'customer__name')
    date_hierarchy = 'start_date'

@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ('contract', 'date', 'performed_by', 'status')
    list_filter = ('status', 'contract')
    search_fields = ('contract__title', 'notes')
    date_hierarchy = 'date'

@admin.register(ContractDocument)
class ContractDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'contract', 'uploaded_by', 'uploaded_at')
    list_filter = ('contract',)
    search_fields = ('title', 'description', 'contract__title')
    date_hierarchy = 'uploaded_at'

@admin.register(ContractReport)
class ContractReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'contract', 'date', 'status', 'hours_worked', 'is_deleted']
    list_filter = ['contract', 'status', 'date', 'is_deleted']
    search_fields = ['description', 'contract__title']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at']
    
    def get_status_display(self, obj):
        return dict(ContractReport.STATUS_CHOICES).get(obj.status, obj.status)
    get_status_display.short_description = 'Estado'
    
    def get_performed_by(self, obj):
        if hasattr(obj, 'performed_by') and obj.performed_by:
            return obj.performed_by.username
        return '-'
    get_performed_by.short_description = 'Realizado por'
    
    def is_completed(self, obj):
        return obj.status == 'COMPLETED'
    is_completed.boolean = True
    is_completed.short_description = 'Completado'
