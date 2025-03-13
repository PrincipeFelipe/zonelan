from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseViewSet, 
    DepartmentViewSet, 
    ShelfViewSet, 
    TrayViewSet, 
    MaterialLocationViewSet, 
    MaterialMovementViewSet,
    material_locations,  # Ya importada
    material_inventory_check  # Añade esta importación
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
    path('materials/<int:material_id>/inventory_check/', material_inventory_check, name='material-inventory-check'),
    # Otras rutas existentes...
]