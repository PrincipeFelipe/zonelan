from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import IncidentViewSet

router = DefaultRouter()
router.register(r'', IncidentViewSet)

urlpatterns = router.urls