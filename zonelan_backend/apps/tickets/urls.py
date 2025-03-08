from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import TicketViewSet, TicketItemViewSet

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='tickets')

# Rutas anidadas para los ítems de tickets
tickets_router = routers.NestedSimpleRouter(router, r'tickets', lookup='ticket')
tickets_router.register(r'items', TicketItemViewSet, basename='ticket-items')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(tickets_router.urls)),
]