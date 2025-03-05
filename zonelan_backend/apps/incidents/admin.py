from django.contrib import admin
from .models import Incident

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ('title', 'customer', 'status', 'priority', 'created_at')
    list_filter = ('status', 'priority', 'customer')
    search_fields = ('title', 'description', 'customer__name')
