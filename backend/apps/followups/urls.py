"""Follow-ups URL routing."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.followups.views import FollowUpViewSet

router = DefaultRouter()
router.register('', FollowUpViewSet, basename='followup')

urlpatterns = router.urls
