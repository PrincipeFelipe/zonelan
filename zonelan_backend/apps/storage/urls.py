from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseViewSet, DepartmentViewSet, ShelfViewSet, TrayViewSet,
    MaterialLocationViewSet, MaterialMovementViewSet
)

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'shelves', ShelfViewSet)
router.register(r'trays', TrayViewSet)
router.register(r'locations', MaterialLocationViewSet)
router.register(r'movements', MaterialMovementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]