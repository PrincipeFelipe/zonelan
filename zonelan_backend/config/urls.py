from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('apps.users.urls')),
    path('customers/', include('apps.customers.urls')),
    path('materials/', include('apps.materials.urls')),
    path('incidents/', include('apps.incidents.urls')),
    path('reports/', include('apps.reports.urls')),
    path('tickets/', include('apps.tickets.urls')),
]

# Añadir esta configuración para servir archivos multimedia en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)