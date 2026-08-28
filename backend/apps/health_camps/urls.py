"""Health Camps URL routing."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.health_camps.views import ScreeningCampViewSet

router = DefaultRouter()
router.register('', ScreeningCampViewSet, basename='camp')

urlpatterns = router.urls
