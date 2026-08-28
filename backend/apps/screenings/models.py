"""Screening Session and Retinal Image Models."""

import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.patients.models import Patient
from apps.organizations.models import Organization
from apps.health_camps.models import ScreeningCamp
from common.storage import StorageService

def retinal_image_upload_path(instance, filename):
    return StorageService.get_upload_path(instance, filename, subfolder='retinal_images')

class ScreeningSession(models.Model):
    """
    Primary Retinal Screening Event representing an individual screening encounter.
    """

    class Status(models.TextChoices):
        CREATED = 'CREATED', _('Screening Created')
        IMAGE_PENDING = 'IMAGE_PENDING', _('Waiting for Image Capture')
        ANALYZING = 'ANALYZING', _('AI Inference in Progress')
        ANALYZED = 'ANALYZED', _('AI Analysis Completed')
        REVIEW_REQUIRED = 'REVIEW_REQUIRED', _('Ophthalmologist Review Required')
        REFERRED = 'REFERRED', _('Referred to Specialist')
        COMPLETED = 'COMPLETED', _('Screening Completed')
        FAILED = 'FAILED', _('Processing Failed')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    screening_code = models.CharField(max_length=50, unique=True, db_index=True, help_text=_('Unique screening session ID e.g. SCR-1042-04'))
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='screenings', db_index=True)
    screening_camp = models.ForeignKey(
        ScreeningCamp,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='screenings',
        db_index=True
    )
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='conducted_screenings'
    )
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='screenings', db_index=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.CREATED, db_index=True)
    screening_date = models.DateField(auto_now_add=True, db_index=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Screening Session')
        verbose_name_plural = _('Screening Sessions')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['organization', 'screening_date']),
            models.Index(fields=['patient', 'screening_date']),
        ]

    def __str__(self):
        return f"{self.screening_code} - {self.patient.full_name} ({self.status})"


class RetinalImage(models.Model):
    """
    Individual 45° macular or disc-centered fundus photograph captured during a screening.
    Supports left (OS) and right (OD) eyes and multiple captures per session.
    """

    class EyeSide(models.TextChoices):
        RIGHT = 'RIGHT', _('Right Eye (OD - Oculus Dexter)')
        LEFT = 'LEFT', _('Left Eye (OS - Oculus Sinister)')

    class ImageStatus(models.TextChoices):
        UPLOADED = 'UPLOADED', _('Image Uploaded')
        QUALITY_PASSED = 'QUALITY_PASSED', _('Optical Quality Check Passed')
        QUALITY_FAILED = 'QUALITY_FAILED', _('Optical Quality Insufficient')
        PROCESSED = 'PROCESSED', _('Analyzed by AI')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    screening = models.ForeignKey(ScreeningSession, on_delete=models.CASCADE, related_name='images', db_index=True)
    image = models.ImageField(upload_to=retinal_image_upload_path)
    eye_side = models.CharField(max_length=10, choices=EyeSide.choices, default=EyeSide.RIGHT, db_index=True)
    capture_device = models.CharField(max_length=150, default='45° Digital Fundus Camera (Non-Mydriatic)')
    captured_at = models.DateTimeField(auto_now_add=True)
    original_filename = models.CharField(max_length=255, blank=True, null=True)
    file_size = models.PositiveIntegerField(default=0, help_text=_('Size in bytes'))
    mime_type = models.CharField(max_length=50, default='image/jpeg')
    file_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True, help_text=_('SHA-256 integrity hash'))
    status = models.CharField(max_length=30, choices=ImageStatus.choices, default=ImageStatus.UPLOADED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Retinal Image')
        verbose_name_plural = _('Retinal Images')
        ordering = ['-captured_at']

    def __str__(self):
        return f"{self.screening.screening_code} - {self.eye_side} ({self.status})"
