"""Triage URL routing."""

from django.urls import path
from apps.triage.views import TriageQueueView

urlpatterns = [
    path('', TriageQueueView.as_view(), name='triage_queue'),
]
