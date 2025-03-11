from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkReportViewSet, MaterialUsedViewSet, upload_images, delete_image, report_counts

router = DefaultRouter()
router.register(r'reports', WorkReportViewSet)
router.register(r'materials-used', MaterialUsedViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('upload-images/', upload_images, name='upload-images'),
    path('delete-image/<int:image_id>/', delete_image, name='delete-image'),
    path('counts/', report_counts, name='report-counts'),
]