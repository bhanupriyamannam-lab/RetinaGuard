"""Notification Serializers and Endpoints."""

from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from apps.notifications.models import Notification
from common.utilities import api_response

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'is_read',
            'read_at', 'related_entity_type', 'related_entity_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class NotificationViewSet(viewsets.ModelViewSet):
    """Real-time clinical alert and notification management."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['notification_type', 'is_read']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('is_read', '-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return api_response(data=serializer.data)

    @extend_schema(summary="Mark notification as read")
    @action(detail=True, methods=['patch', 'post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at'])
        return api_response(data=NotificationSerializer(notification).data, message='Notification marked as read.')

    @extend_schema(summary="Mark all user notifications as read")
    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        now = timezone.now()
        updated_count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True, read_at=now)
        return api_response(message=f'{updated_count} notifications marked as read.')
