from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContractViewSet, 
    MaintenanceRecordViewSet, 
    ContractDocumentViewSet, 
    ContractReportViewSet,
    pending_maintenances,
    expiring_soon
)

router = DefaultRouter()
router.register(r'contracts', ContractViewSet)
router.register(r'maintenance-records', MaintenanceRecordViewSet)
router.register(r'documents', ContractDocumentViewSet)
router.register(r'reports', ContractReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('pending-maintenances/', pending_maintenances, name='pending-maintenances'),
    path('expiring-soon/', expiring_soon, name='expiring-soon'),
    path('dashboard/', ContractViewSet.as_view({'get': 'dashboard'}), name='dashboard'),
]