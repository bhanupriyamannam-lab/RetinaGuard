"""HIPAA/Clinical Audit Trail Logging Models and Middleware."""

import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.organizations.models import Organization

class AuditLog(models.Model):
    """
    Append-only regulatory and clinical audit trail.
    Tracks all data access, AI inference triggers, and clinical state transitions.
    """

    class Action(models.TextChoices):
        VIEW = 'VIEW', _('Record Viewed')
        CREATE = 'CREATE', _('Record Created')
        UPDATE = 'UPDATE', _('Record Updated')
        DELETE = 'DELETE', _('Record Deleted')
        AI_ANALYSIS = 'AI_ANALYSIS', _('AI Screening Inference Run')
        REFERRAL_CREATED = 'REFERRAL_CREATED', _('Specialist Referral Created')
        REFERRAL_UPDATED = 'REFERRAL_UPDATED', _('Referral Stage Changed')
        LOGIN = 'LOGIN', _('User Authentication')
        LOGOUT = 'LOGOUT', _('User Logout')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        db_index=True
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        db_index=True
    )
    action = models.CharField(max_length=30, choices=Action.choices, db_index=True)
    entity_type = models.CharField(max_length=50, db_index=True, help_text=_('e.g. Patient, Screening, Referral'))
    entity_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['organization', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    def __str__(self):
        user_str = self.user.email if self.user else 'Anonymous/System'
        return f"Audit: {user_str} performed {self.action} on {self.entity_type} ({self.entity_id}) at {self.timestamp}"
