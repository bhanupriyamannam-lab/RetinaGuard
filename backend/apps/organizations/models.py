"""Healthcare Organizations and Multi-Tenant Membership Models."""

import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Organization(models.Model):
    """
    Healthcare Facility, Hospital, NGO, or Primary Health Centre (PHC).
    Enforces strict organization-level data isolation.
    """

    class OrgType(models.TextChoices):
        HOSPITAL = 'HOSPITAL', _('Tertiary / Secondary Eye Hospital')
        CLINIC = 'CLINIC', _('Specialty Ophthalmology Clinic')
        PHC = 'PHC', _('Primary Health Centre / Community Clinic')
        NGO = 'NGO', _('Non-Governmental Health Organization')
        GOVT_PROGRAM = 'GOVT_PROGRAM', _('National Health Screening Mission')
        CAMP_ORG = 'CAMP_ORG', _('Rural Screening Camp Organization')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, db_index=True)
    code = models.CharField(max_length=50, unique=True, db_index=True, help_text=_('Unique facility identifier code e.g. VREH-01'))
    org_type = models.CharField(max_length=30, choices=OrgType.choices, default=OrgType.HOSPITAL, db_index=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, default='Andhra Pradesh')
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=25, blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Organization')
        verbose_name_plural = _('Organizations')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class OrganizationMembership(models.Model):
    """Associates platform users with one or more healthcare organizations."""

    class MemberRole(models.TextChoices):
        ADMIN = 'ADMIN', _('Facility Administrator')
        DOCTOR = 'DOCTOR', _('Attending Ophthalmologist')
        HEALTHCARE_WORKER = 'HEALTHCARE_WORKER', _('Field Health Worker / ASHA')
        SCREENING_OPERATOR = 'SCREENING_OPERATOR', _('Camera Operator')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organization_memberships')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='memberships')
    role_in_org = models.CharField(max_length=30, choices=MemberRole.choices, default=MemberRole.HEALTHCARE_WORKER)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Organization Membership')
        verbose_name_plural = _('Organization Memberships')
        unique_together = ('user', 'organization')

    def __str__(self):
        return f"{self.user.email} -> {self.organization.name} [{self.role_in_org}]"
