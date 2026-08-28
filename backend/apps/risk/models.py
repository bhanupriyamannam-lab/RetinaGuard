"""Risk Assessment Model and Clinical Decision Support Records."""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.screenings.models import ScreeningSession
from apps.patients.models import Patient

class RiskAssessment(models.Model):
    """
    Multi-factor clinical risk scoring model.
    Synthesizes AI findings, longitudinal progression velocity, and patient history.
    """

    class RiskLevel(models.TextChoices):
        LOW = 'LOW', _('Low Risk')
        MODERATE = 'MODERATE', _('Moderate Risk')
        HIGH = 'HIGH', _('High Risk')
        URGENT = 'URGENT', _('Urgent / Immediate Specialist Dispatch')
        UNKNOWN = 'UNKNOWN', _('Unknown')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    screening = models.OneToOneField(ScreeningSession, on_delete=models.CASCADE, related_name='risk_assessment')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='risk_assessments', db_index=True)
    risk_level = models.CharField(max_length=20, choices=RiskLevel.choices, default=RiskLevel.LOW, db_index=True)
    risk_score = models.PositiveIntegerField(default=25, help_text=_('Calculated composite risk score 0 - 100'))
    risk_factors = models.JSONField(default=list, blank=True, help_text=_('List of clinical risk factors identified'))
    recommendation = models.JSONField(default=dict, blank=True, help_text=_('Structured action recommendations'))
    is_prototype_score = models.BooleanField(
        default=True,
        help_text=_('Clearly designates the risk score as an AI-assisted screening estimate.')
    )
    assessed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Risk Assessment')
        verbose_name_plural = _('Risk Assessments')
        ordering = ['-assessed_at']

    def __str__(self):
        return f"{self.patient.patient_code} - Risk: {self.risk_level} (Score: {self.risk_score})"
