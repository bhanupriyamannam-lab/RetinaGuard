"""Custom User Model and Role Definitions."""

import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    """Custom user manager supporting email as primary identifier."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('An email address must be provided.'))
        email = self.normalize_email(email)
        extra_fields.setdefault('username', email.split('@')[0])
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    RetinaGuard platform user supporting Role-Based Access Control:
    - ADMIN: Hospital/System Administrator
    - DOCTOR: Ophthalmologist / Vitreoretinal Specialist
    - HEALTHCARE_WORKER: Community ASHA / Primary Clinic Nurse
    - SCREENING_OPERATOR: Fundus Camera Technician
    - PATIENT: Registered Screening Patient
    """

    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Administrator')
        DOCTOR = 'DOCTOR', _('Doctor / Ophthalmologist')
        HEALTHCARE_WORKER = 'HEALTHCARE_WORKER', _('Healthcare Worker / ASHA')
        SCREENING_OPERATOR = 'SCREENING_OPERATOR', _('Screening Operator')
        PATIENT = 'PATIENT', _('Patient')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True, db_index=True)
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.HEALTHCARE_WORKER, db_index=True)
    phone = models.CharField(max_length=25, blank=True, null=True)
    license_number = models.CharField(max_length=50, blank=True, null=True, help_text=_('Medical council registration number for doctors'))
    preferred_language = models.CharField(max_length=10, default='en', choices=[
        ('en', 'English'),
        ('te', 'Telugu'),
        ('hi', 'Hindi'),
        ('ta', 'Tamil'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-date_joined']

    def __str__(self):
        full_name = self.get_full_name()
        return f"{full_name or self.email} ({self.role})"
