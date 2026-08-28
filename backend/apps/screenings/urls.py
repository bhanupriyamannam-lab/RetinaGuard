"""Screenings URL routing."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.screenings.views import ScreeningSessionViewSet, RetinalImageViewSet

router = DefaultRouter()
router.register('images', RetinalImageViewSet, basename='retinal-image')
router.register('', ScreeningSessionViewSet, basename='screening')

urlpatterns = router.urls
