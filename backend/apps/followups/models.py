"""Patient Follow-up, Recall Radar, and Care Adherence Models."""

import uuid
from datetime import date
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.patients.models import Patient
from apps.screenings.models import ScreeningSession
from apps.referrals.models import Referral

class FollowUp(models.Model):
    """
    Patient recall and follow-up surveillance tracker.
    Prevents patient drop-out / lost-to-follow-up in rural screening programs.
    """

    class Status(models.TextChoices):
        UPCOMING = 'UPCOMING', _('Upcoming Follow-up')
        DUE = 'DUE', _('Due Today / Active Recall')
        OVERDUE = 'OVERDUE', _('Overdue - High Risk of Drop-out')
        COMPLETED = 'COMPLETED', _('Follow-up Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')

    class Priority(models.TextChoices):
        ROUTINE = 'ROUTINE', _('Routine Recall (6-12 Months)')
        URGENT = 'URGENT', _('Urgent Recall (14-30 Days)')

    class RecallChannel(models.TextChoices):
        SMS = 'SMS', _('Automated Multilingual SMS')
        CALL = 'CALL', _('ASHA Telephonic Call')
        ASHA_VISIT = 'ASHA_VISIT', _('Physical ASHA Home Visit')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='followups', db_index=True)
    screening = models.ForeignKey(
        ScreeningSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='followups'
    )
    referral = models.ForeignKey(
        Referral,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='followups'
    )
    due_date = models.DateField(db_index=True)
    completed_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPCOMING, db_index=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.ROUTINE, db_index=True)
    recall_channel = models.CharField(max_length=20, choices=RecallChannel.choices, default=RecallChannel.SMS)
    notes = models.TextField(blank=True, null=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_followups'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Follow-Up')
        verbose_name_plural = _('Follow-Ups')
        ordering = ['due_date']
        indexes = [
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['priority', 'status']),
        ]

    @property
    def is_overdue(self):
        return self.status != self.Status.COMPLETED and self.due_date < date.today()

    @property
    def days_overdue(self):
        if self.is_overdue:
            return (date.today() - self.due_date).days
        return 0

    def __str__(self):
        return f"Follow-up: {self.patient.patient_code} - Due: {self.due_date} ({self.status})"
