from django.contrib import admin
from .models import Customer

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'business_name', 'tax_id', 'email', 'phone')
    search_fields = ('name', 'business_name', 'tax_id', 'email', 'phone')
    list_filter = ('tax_id',)
