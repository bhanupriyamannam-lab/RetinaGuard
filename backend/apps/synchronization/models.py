"""Offline Synchronization and Idempotency Models."""

import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.organizations.models import Organization

class SyncRecord(models.Model):
    """
    Tracks offline-first client entity synchronization events.
    Guarantees strict idempotency and conflict resolution for field health camps.
    """

    class EntityType(models.TextChoices):
        PATIENT = 'PATIENT', _('Patient Record')
        SCREENING = 'SCREENING', _('Screening Session')
        IMAGE = 'IMAGE', _('Retinal Image Capture')
        REFERRAL = 'REFERRAL', _('Specialist Referral')
        FOLLOWUP = 'FOLLOWUP', _('Patient Follow-up')

    class Operation(models.TextChoices):
        CREATE = 'CREATE', _('Create New Entity')
        UPDATE = 'UPDATE', _('Update Existing Entity')

    class SyncStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending Synchronization')
        SYNCED = 'SYNCED', _('Successfully Synchronized')
        FAILED = 'FAILED', _('Synchronization Failed')
        CONFLICT = 'CONFLICT', _('Version Conflict Detected')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempotency_key = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text=_('Unique client-generated idempotency key to prevent duplicate creation.')
    )
    device_id = models.CharField(max_length=100, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sync_records')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='sync_records')
    entity_type = models.CharField(max_length=30, choices=EntityType.choices, db_index=True)
    entity_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    operation = models.CharField(max_length=20, choices=Operation.choices, default=Operation.CREATE)
    client_timestamp = models.DateTimeField(help_text=_('Timestamp when record was captured offline on mobile device'))
    server_timestamp = models.DateTimeField(auto_now_add=True)
    sync_status = models.CharField(max_length=20, choices=SyncStatus.choices, default=SyncStatus.SYNCED, db_index=True)
    payload = models.JSONField(default=dict, help_text=_('Raw payload submitted by offline client'))
    server_response_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = _('Sync Record')
        verbose_name_plural = _('Sync Records')
        ordering = ['-server_timestamp']
        indexes = [
            models.Index(fields=['device_id', 'sync_status']),
            models.Index(fields=['organization', 'sync_status']),
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    def __str__(self):
        return f"Sync [{self.sync_status}]: {self.entity_type} ({self.idempotency_key}) by {self.device_id}"
