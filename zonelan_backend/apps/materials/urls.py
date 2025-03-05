from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import MaterialViewSet, MaterialControlViewSet

router = DefaultRouter()
router.register(r'materials', MaterialViewSet)
router.register(r'control', MaterialControlViewSet)

urlpatterns = router.urls