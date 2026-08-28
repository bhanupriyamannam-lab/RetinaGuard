"""Patient Records, Clinical History, and Consent Management Models."""

import uuid
from datetime import date
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.organizations.models import Organization

class Patient(models.Model):
    """Core Patient Demographic and Clinical Record."""

    class Gender(models.TextChoices):
        FEMALE = 'FEMALE', _('Female')
        MALE = 'MALE', _('Male')
        OTHER = 'OTHER', _('Other')

    class DiabetesType(models.TextChoices):
        TYPE_1 = 'TYPE_1', _('Type 1 Diabetes')
        TYPE_2 = 'TYPE_2', _('Type 2 Diabetes')
        GESTATIONAL = 'GESTATIONAL', _('Gestational Diabetes')
        PRE_DIABETIC = 'PRE_DIABETIC', _('Pre-Diabetic')
        UNKNOWN = 'UNKNOWN', _('Unknown / Unclassified')

    class RiskLevel(models.TextChoices):
        LOW = 'LOW', _('Low Risk')
        MODERATE = 'MODERATE', _('Moderate Risk')
        HIGH = 'HIGH', _('High Risk')
        URGENT = 'URGENT', _('Urgent / Critical')
        UNKNOWN = 'UNKNOWN', _('Unknown')

    class Severity(models.TextChoices):
        NO_DR = 'NO_DR', _('No Apparent Diabetic Retinopathy')
        MILD_DR = 'MILD_DR', _('Mild Non-Proliferative DR')
        MODERATE_DR = 'MODERATE_DR', _('Moderate Non-Proliferative DR')
        SEVERE_DR = 'SEVERE_DR', _('Severe Non-Proliferative DR')
        PROLIFERATIVE_DR = 'PROLIFERATIVE_DR', _('Proliferative Diabetic Retinopathy')
        PROGRESSION = 'PROGRESSION', _('Possible Longitudinal Progression')
        UNDETERMINED = 'UNDETERMINED', _('Undetermined')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_code = models.CharField(max_length=50, unique=True, db_index=True, help_text=_('Human-readable patient ID e.g. RG-1042'))
    first_name = models.CharField(max_length=100, db_index=True)
    last_name = models.CharField(max_length=100, db_index=True)
    date_of_birth = models.DateField(blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True, help_text=_('Patient age in years'))
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.FEMALE)
    avatar = models.TextField(blank=True, null=True, help_text=_('Patient profile photo base64 or URL'))
    phone = models.CharField(max_length=25, blank=True, null=True, db_index=True)
    email = models.EmailField(blank=True, null=True)
    preferred_language = models.CharField(max_length=10, default='te', choices=[
        ('en', 'English'),
        ('te', 'Telugu'),
        ('hi', 'Hindi'),
        ('ta', 'Tamil'),
    ])
    village = models.CharField(max_length=150, blank=True, null=True, db_index=True)
    district = models.CharField(max_length=100, db_index=True, default='Visakhapatnam')
    state = models.CharField(max_length=100, default='Andhra Pradesh')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='patients', db_index=True)

    # Diabetic History
    diabetes_type = models.CharField(max_length=30, choices=DiabetesType.choices, default=DiabetesType.TYPE_2)
    diabetes_duration_years = models.PositiveIntegerField(default=5)
    hba1c = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True, help_text=_('Latest Glycated Hemoglobin %'))
    medical_notes = models.TextField(blank=True, null=True)

    # Current Clinical Triage Status (Cached for instant query velocity)
    current_risk_level = models.CharField(max_length=20, choices=RiskLevel.choices, default=RiskLevel.LOW, db_index=True)
    current_severity = models.CharField(max_length=30, choices=Severity.choices, default=Severity.NO_DR, db_index=True)
    has_progression_alert = models.BooleanField(default=False, db_index=True)
    last_screening_date = models.DateField(blank=True, null=True, db_index=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registered_patients'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Patient')
        verbose_name_plural = _('Patients')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'current_risk_level']),
            models.Index(fields=['organization', 'current_severity']),
            models.Index(fields=['organization', 'has_progression_alert']),
            models.Index(fields=['organization', 'last_screening_date']),
        ]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def display_id(self):
        return f"#{self.patient_code}" if not self.patient_code.startswith('#') else self.patient_code

    def calculate_age(self):
        if self.date_of_birth:
            today = date.today()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return self.age

    def save(self, *args, **kwargs):
        if self.date_of_birth and not self.age:
            self.age = self.calculate_age()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.display_id})"


class PatientConsent(models.Model):
    """Informed Consent Record tracking for clinical screening and tele-ophthalmology data sharing."""

    class ConsentType(models.TextChoices):
        SCREENING_AND_AI = 'SCREENING_AND_AI', _('Retinal Photography & AI-Assisted Screening')
        DATA_SHARING_SPECIALIST = 'DATA_SHARING_SPECIALIST', _('Clinical Data Sharing with Specialist Ophthalmologists')
        RESEARCH_ANONYMIZED = 'RESEARCH_ANONYMIZED', _('Anonymized Epidemiological Research')
        TELEMEDICINE = 'TELEMEDICINE', _('Tele-Ophthalmology Remote Consultation')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consents')
    consent_type = models.CharField(max_length=50, choices=ConsentType.choices, default=ConsentType.SCREENING_AND_AI)
    granted = models.BooleanField(default=True)
    granted_at = models.DateTimeField(auto_now_add=True)
    withdrawn_at = models.DateTimeField(blank=True, null=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_consents'
    )
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = _('Patient Consent')
        verbose_name_plural = _('Patient Consents')
        unique_together = ('patient', 'consent_type')

    def __str__(self):
        status = "Granted" if self.granted else "Withdrawn"
        return f"{self.patient.patient_code} - {self.consent_type}: {status}"
