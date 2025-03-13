from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'materials', views.MaterialViewSet)
router.register(r'control', views.MaterialControlViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('material-history/<int:material_id>/', views.material_history, name='material-history'),
    path('stats/', views.material_stats, name='material-stats'),
]

# La acción adjust_stock estará disponible en:
# /materials/materials/{id}/adjust_stock/