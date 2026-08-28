"""Screening Camp Serializers and Statistics Views."""

from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from apps.health_camps.models import ScreeningCamp
from apps.screenings.models import ScreeningSession
from common.permissions import HasOrganizationAccess
from common.utilities import api_response

class ScreeningCampSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    coordinator_name = serializers.CharField(source='coordinator.get_full_name', read_only=True)
    screened_count = serializers.SerializerMethodField()

    class Meta:
        model = ScreeningCamp
        fields = [
            'id', 'name', 'organization', 'organization_name', 'location',
            'district', 'state', 'start_date', 'end_date', 'target_capacity',
            'status', 'coordinator', 'coordinator_name', 'notes',
            'screened_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'screened_count']

    def get_screened_count(self, obj):
        return obj.screenings.count()


class ScreeningCampViewSet(viewsets.ModelViewSet):
    """
    CRUD API and Camp Statistics for rural screening camps.
    """
    queryset = ScreeningCamp.objects.select_related('organization', 'coordinator').all()
    serializer_class = ScreeningCampSerializer
    permission_classes = [IsAuthenticated, HasOrganizationAccess]
    filterset_fields = ['status', 'organization', 'district']
    search_fields = ['name', 'location', 'district']
    ordering_fields = ['start_date', 'name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_superuser or getattr(user, 'role', '') == 'ADMIN':
            return qs
        return qs.filter(organization__memberships__user=user, organization__memberships__is_active=True).distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return api_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(data=serializer.data)

    @extend_schema(summary="Get real-time statistics and yield for a specific health camp")
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        camp = self.get_object()
        screenings = camp.screenings.all()
        
        total_screened = screenings.count()
        target = camp.target_capacity
        remaining = max(0, target - total_screened)
        high_risk = screenings.filter(risk_assessment__risk_level__in=['HIGH', 'URGENT']).count()
        referrals = screenings.filter(status='REFERRED').count()
        followups = screenings.filter(followups__isnull=False).distinct().count()

        stats = {
            'camp_id': str(camp.id),
            'camp_name': camp.name,
            'location': camp.location,
            'status': camp.status,
            'target_capacity': target,
            'total_screened': total_screened,
            'remaining_capacity': remaining,
            'progress_percentage': round((total_screened / target) * 100, 1) if target else 0,
            'high_risk_count': high_risk,
            'referrals_dispatched': referrals,
            'followups_scheduled': followups,
            'pending_offline_sync': 0
        }
        return api_response(data=stats)
