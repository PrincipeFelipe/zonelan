from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'contracts', views.ContractViewSet)
router.register(r'maintenance-records', views.MaintenanceRecordViewSet)
router.register(r'documents', views.ContractDocumentViewSet)
router.register(r'reports', views.ContractReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('pending-maintenances/', views.pending_maintenances, name='pending-maintenances'),
    path('expiring-soon/', views.expiring_soon, name='expiring-soon'),
    path('dashboard/', views.ContractViewSet.as_view({'get': 'dashboard'}), name='dashboard'),
    # Añadir esta URL para el proxy de documentos
    path('document-proxy/', views.document_proxy, name='document-proxy'),
]