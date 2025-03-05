from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'cod_worker', 'type')
    search_fields = ('name', 'email', 'cod_worker')
    list_filter = ('type',)