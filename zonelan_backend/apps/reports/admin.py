from django.contrib import admin
from .models import WorkReport, MaterialUsed, ReportImage, TechnicianAssignment

class MaterialUsedInline(admin.TabularInline):
    model = MaterialUsed
    extra = 1

class TechnicianAssignmentInline(admin.TabularInline):
    model = TechnicianAssignment
    extra = 1

@admin.register(WorkReport)
class WorkReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'incident', 'status', 'date', 'is_deleted')
    list_filter = ('status', 'incident', 'date', 'is_deleted')
    search_fields = ('description', 'incident__title')
    inlines = [TechnicianAssignmentInline, MaterialUsedInline]

@admin.register(MaterialUsed)
class MaterialUsedAdmin(admin.ModelAdmin):
    list_display = ('report', 'material', 'quantity')
    list_filter = ('report', 'material')
    search_fields = ('report__id', 'material__name')

@admin.register(ReportImage)
class ReportImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'report', 'created_at', 'image_type']  # Cambiado de uploaded_at a created_at
    list_filter = ['created_at', 'image_type']  # Cambiado de uploaded_at a created_at
    search_fields = ['report__id', 'description']
    readonly_fields = ['created_at']

@admin.register(TechnicianAssignment)
class TechnicianAssignmentAdmin(admin.ModelAdmin):
    list_display = ('technician', 'report')
    list_filter = ('technician', 'report')
    search_fields = ('technician__username', 'report__id')
