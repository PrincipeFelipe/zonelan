from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Aquí está el problema principal - volvamos a la configuración original
router.register(r'incidents', views.IncidentViewSet, basename='incident')

urlpatterns = [
    # Ruta para el conteo
    path('counts/', views.incident_counts, name='incident-counts'),
    # Incluir las rutas del router
    path('', include(router.urls)),
]