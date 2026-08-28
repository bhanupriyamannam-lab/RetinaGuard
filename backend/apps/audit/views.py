"""Audit Trail Serializers and Views."""

from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticated
from apps.audit.models import AuditLog
from common.permissions import IsAdminUserRole
from common.utilities import api_response

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'organization', 'organization_name',
            'action', 'entity_type', 'entity_id', 'timestamp', 'ip_address',
            'user_agent', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Audit Trail Inspection Endpoint.
    Immutable log records for regulatory compliance and clinical security.
    """
    queryset = AuditLog.objects.select_related('user', 'organization').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filterset_fields = ['action', 'entity_type', 'user', 'organization']
    search_fields = ['entity_type', 'entity_id', 'user__email']
    ordering_fields = ['timestamp', 'action']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return api_response(data=serializer.data)
