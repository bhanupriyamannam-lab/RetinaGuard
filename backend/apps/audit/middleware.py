"""Middleware to automatically record clinical audit events."""

import logging
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)

class AuditLoggingMiddleware:
    """Captures request context for audit logging."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    @classmethod
    def log_action(cls, request, action: str, entity_type: str, entity_id: str, metadata: dict = None, organization=None):
        """Helper method to explicitly log an audit record from any view/service."""
        try:
            user = request.user if request and request.user.is_authenticated else None
            ip = cls.get_client_ip(request) if request else None
            ua = request.META.get('HTTP_USER_AGENT', '')[:250] if request else None

            AuditLog.objects.create(
                user=user,
                organization=organization,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id),
                ip_address=ip,
                user_agent=ua,
                metadata=metadata or {}
            )
        except Exception as e:
            logger.warning(f"Failed to record audit log: {e}")
