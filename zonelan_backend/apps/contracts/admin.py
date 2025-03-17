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
    list_display = ('title', 'contract', 'date', 'performed_by', 'status', 'is_completed')
    list_filter = ('status', 'is_completed', 'contract')
    search_fields = ('title', 'description', 'contract__title')
    date_hierarchy = 'date'
