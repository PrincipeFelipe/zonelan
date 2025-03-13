from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseViewSet, 
    DepartmentViewSet, 
    ShelfViewSet, 
    TrayViewSet, 
    MaterialLocationViewSet, 
    MaterialMovementViewSet,
    material_locations  # Asegúrate de importar esta función
)

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouses')
router.register(r'departments', DepartmentViewSet, basename='departments')
router.register(r'shelves', ShelfViewSet, basename='shelves')
router.register(r'trays', TrayViewSet, basename='trays')
router.register(r'locations', MaterialLocationViewSet, basename='locations')
router.register(r'movements', MaterialMovementViewSet, basename='movements')

urlpatterns = [
    path('', include(router.urls)),
    path('materials/<int:material_id>/locations/', material_locations, name='material-locations'),
    # Otras rutas existentes...
]