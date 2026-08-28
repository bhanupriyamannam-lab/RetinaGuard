"""Longitudinal Progression and Timeline Event Tracking Models."""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.patients.models import Patient
from apps.screenings.models import ScreeningSession

class ProgressionAssessment(models.Model):
    """Longitudinal microvascular delta assessment between two chronological scans."""

    class Status(models.TextChoices):
        STABLE = 'STABLE', _('Stable Retinal Vasculature')
        IMPROVING = 'IMPROVING', _('Regression / Improving')
        POSSIBLE_PROGRESSION = 'POSSIBLE_PROGRESSION', _('Possible Longitudinal Progression')
        SIGNIFICANT_CHANGE = 'SIGNIFICANT_CHANGE', _('Significant Microvascular Change')
        INSUFFICIENT_DATA = 'INSUFFICIENT_DATA', _('Insufficient Prior Data for Longitudinal Comparison')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='progression_assessments', db_index=True)
    previous_screening = models.ForeignKey(
        ScreeningSession,
        on_delete=models.CASCADE,
        related_name='as_previous_progression_evaluations'
    )
    current_screening = models.ForeignKey(
        ScreeningSession,
        on_delete=models.CASCADE,
        related_name='as_current_progression_evaluations'
    )
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.STABLE, db_index=True)
    changes = models.JSONField(default=list, blank=True, help_text=_('Quantitative list of lesion delta metrics'))
    confidence = models.DecimalField(max_digits=5, decimal_places=4, default=0.9420)
    velocity_assessment = models.CharField(max_length=20, default='HIGH', choices=[
        ('NORMAL', 'Normal / Expected'),
        ('MODERATE', 'Moderate'),
        ('HIGH', 'High Velocity / Rapid Progression'),
    ])
    summary = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Progression Assessment')
        verbose_name_plural = _('Progression Assessments')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient.patient_code}: {self.status} (Scan {self.previous_screening_id} -> {self.current_screening_id})"


class ScreeningEvent(models.Model):
    """Chronological longitudinal lifecycle event in the patient's care continuum."""

    class EventType(models.TextChoices):
        SCREENED = 'SCREENED', _('Retinal Photography Captured')
        AI_ANALYZED = 'AI_ANALYZED', _('AI Screening Inference Generated')
        REFERRED = 'REFERRED', _('Specialist Referral Dispatched')
        FOLLOWUP_DUE = 'FOLLOWUP_DUE', _('Follow-up Recall Due')
        FOLLOWUP_COMPLETED = 'FOLLOWUP_COMPLETED', _('Patient Follow-up Completed')
        SPECIALIST_REVIEWED = 'SPECIALIST_REVIEWED', _('Vitreoretinal Specialist Examination')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='timeline_events', db_index=True)
    screening = models.ForeignKey(
        ScreeningSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='timeline_events'
    )
    event_type = models.CharField(max_length=30, choices=EventType.choices, default=EventType.SCREENED, db_index=True)
    event_date = models.DateField(db_index=True)
    stage_title = models.CharField(max_length=150, blank=True, null=True)
    severity = models.CharField(max_length=30, default='NO_DR')
    risk_level = models.CharField(max_length=20, default='LOW')
    risk_score = models.PositiveIntegerField(default=10)
    summary = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Screening Timeline Event')
        verbose_name_plural = _('Screening Timeline Events')
        ordering = ['event_date', 'created_at']

    def __str__(self):
        return f"{self.patient.patient_code} [{self.event_date}] - {self.event_type} ({self.stage_title})"
