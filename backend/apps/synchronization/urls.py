"""Synchronization URL routing."""

from django.urls import path
from apps.synchronization.views import BatchSyncView

urlpatterns = [
    path('', BatchSyncView.as_view(), name='batch_sync'),
]
