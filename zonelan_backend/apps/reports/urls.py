from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import WorkReportViewSet, MaterialUsedViewSet, upload_images

router = DefaultRouter()
router.register(r'reports', WorkReportViewSet)
router.register(r'materials-used', MaterialUsedViewSet)

urlpatterns = [
    path('upload-images/', upload_images, name='upload-images'),
] + router.urls