"""Health Camp / Screening Camp Models for rural outreach."""

import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.organizations.models import Organization

class ScreeningCamp(models.Model):
    """Outreach health camp for rural ASHA / community diabetic retinopathy screening."""

    class Status(models.TextChoices):
        PLANNED = 'PLANNED', _('Planned')
        ACTIVE = 'ACTIVE', _('Active / Screening Today')
        COMPLETED = 'COMPLETED', _('Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, db_index=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='screening_camps')
    location = models.CharField(max_length=250, help_text=_('Village, Community Hall, or PHC Location'))
    district = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, default='Andhra Pradesh')
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    target_capacity = models.PositiveIntegerField(default=100)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    coordinator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='coordinated_camps'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Screening Camp')
        verbose_name_plural = _('Screening Camps')
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} - {self.location} ({self.status})"
