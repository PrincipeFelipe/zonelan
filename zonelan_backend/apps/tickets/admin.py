from django.contrib import admin
from .models import Ticket, TicketItem

class TicketItemInline(admin.TabularInline):
    model = TicketItem
    fields = ('material', 'quantity', 'unit_price', 'discount_percentage', 'notes')
    extra = 0

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'customer', 'created_at', 'status', 'payment_method', 'total_amount')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('ticket_number', 'customer__name', 'notes')
    date_hierarchy = 'created_at'
    readonly_fields = ('ticket_number', 'created_at', 'paid_at', 'canceled_at', 'total_amount')
    inlines = [TicketItemInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer', 'created_by')
    
    def has_delete_permission(self, request, obj=None):
        # No permitir eliminar tickets pagados
        if obj and obj.status == 'PAID':
            return False
        return super().has_delete_permission(request, obj)

@admin.register(TicketItem)
class TicketItemAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'material', 'quantity', 'unit_price', 'discount_percentage', 'total_price')
    list_filter = ('ticket__status',)
    search_fields = ('ticket__ticket_number', 'material__name')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('ticket', 'material')
