"""Retinal Analysis URL routing."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.retinal_analysis.views import AIAnalysisViewSet

router = DefaultRouter()
router.register('analyses', AIAnalysisViewSet, basename='analysis')

urlpatterns = router.urls
