"""Specialist Referral and Tele-Ophthalmology Pipeline Models."""

import uuid
from datetime import date, timedelta
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.patients.models import Patient
from apps.screenings.models import ScreeningSession

class Referral(models.Model):
    """Tele-ophthalmology specialist referral record tracking patient intervention."""

    class Priority(models.TextChoices):
        ROUTINE = 'ROUTINE', _('Routine (Standard Surveillance)')
        PRIORITY = 'PRIORITY', _('Priority (Within 30 Days)')
        URGENT = 'URGENT', _('Urgent (Within 7-14 Days)')
        EMERGENCY = 'EMERGENCY', _('Emergency (Within 48 Hours)')

    class Status(models.TextChoices):
        CREATED = 'CREATED', _('Referral Created')
        REFERRED = 'REFERRED', _('Dispatched to Destination Hospital')
        PATIENT_NOTIFIED = 'PATIENT_NOTIFIED', _('Patient Contacted & Informed')
        APPOINTMENT_PENDING = 'APPOINTMENT_PENDING', _('Appointment Slot Requested')
        APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED', _('Appointment Confirmed')
        SPECIALIST_REVIEW = 'SPECIALIST_REVIEW', _('Specialist Examination in Progress')
        COMPLETED = 'COMPLETED', _('Intervention & Care Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')

    class FacilityType(models.TextChoices):
        TERTIARY_APEX = 'TERTIARY_APEX', _('Tertiary Apex Center')
        DISTRICT_HOSPITAL = 'DISTRICT_HOSPITAL', _('District Eye Hospital')
        MOBILE_UNIT = 'MOBILE_UNIT', _('Mobile Tele-Ophthalmology Unit')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='referrals', db_index=True)
    screening = models.ForeignKey(
        ScreeningSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referrals'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='initiated_referrals'
    )
    assigned_doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_referrals'
    )
    specialist_name = models.CharField(max_length=150, default='Dr. Arvind Swaminathan (Vitreoretinal Surgeon)')
    hospital_name = models.CharField(max_length=200, default='Visakha Government Regional Eye Hospital', db_index=True)
    facility_type = models.CharField(max_length=40, choices=FacilityType.choices, default=FacilityType.TERTIARY_APEX)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.URGENT, db_index=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.REFERRED, db_index=True)
    target_date = models.DateField(db_index=True, blank=True, null=True)
    primary_diagnosis = models.CharField(
        max_length=255,
        default='Moderate NPDR with Rapid Progression & Early DME Threat'
    )
    transport_assistance_required = models.BooleanField(default=True)
    clinical_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Referral')
        verbose_name_plural = _('Referrals')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['hospital_name', 'status']),
            models.Index(fields=['target_date', 'status']),
        ]

    def save(self, *args, **kwargs):
        if not self.target_date:
            days = 2 if self.priority == self.Priority.EMERGENCY else 14 if self.priority == self.Priority.URGENT else 30
            self.target_date = date.today() + timedelta(days=days)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Referral: {self.patient.patient_code} -> {self.hospital_name} [{self.status}]"


class ReferralEvent(models.Model):
    """Audit history of state transitions across the referral lifecycle."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referral = models.ForeignKey(Referral, on_delete=models.CASCADE, related_name='stage_history')
    from_status = models.CharField(max_length=30)
    to_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Referral Event')
        verbose_name_plural = _('Referral Events')
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.from_status} -> {self.to_status} at {self.timestamp}"
