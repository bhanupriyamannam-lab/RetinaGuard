"""Clinical Notifications and Recall Alerts."""

import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Notification(models.Model):
    """Real-time clinical alert and notification model for medical staff."""

    class NotificationType(models.TextChoices):
        HIGH_RISK = 'HIGH_RISK', _('High Risk Screening Detected')
        PROGRESSION_ALERT = 'PROGRESSION_ALERT', _('Possible Disease Progression Alert')
        FOLLOWUP_DUE = 'FOLLOWUP_DUE', _('Patient Follow-up Due')
        FOLLOWUP_OVERDUE = 'FOLLOWUP_OVERDUE', _('Follow-up Overdue / Lost to Follow-up')
        REFERRAL_CREATED = 'REFERRAL_CREATED', _('Specialist Referral Created')
        REFERRAL_UPDATED = 'REFERRAL_UPDATED', _('Referral Stage Updated')
        SYNC_REQUIRED = 'SYNC_REQUIRED', _('Offline Device Sync Pending')
        SYSTEM = 'SYSTEM', _('System Alert')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications', db_index=True)
    notification_type = models.CharField(max_length=40, choices=NotificationType.choices, default=NotificationType.SYSTEM, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(blank=True, null=True)
    related_entity_type = models.CharField(max_length=50, blank=True, null=True)
    related_entity_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification [{self.notification_type}] for {self.user.email}: {self.title}"
