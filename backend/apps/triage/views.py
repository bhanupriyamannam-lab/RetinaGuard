"""Clinical Triage API View."""

from rest_framework.views import APIView
from rest_framework import permissions
from drf_spectacular.utils import extend_schema, OpenApiParameter
from apps.triage.services import TriageService
from common.utilities import api_response

class TriageQueueView(APIView):
    """
    Priority-ranked Clinical Triage Queue.
    Orders patients by urgency, disease progression velocity, and overdue days.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Get priority-ranked clinical triage queue with multi-factor urgency scores",
        parameters=[
            OpenApiParameter('risk', str, description='Filter by risk level: LOW, MODERATE, HIGH, URGENT, ALL'),
            OpenApiParameter('severity', str, description='Filter by DR severity: NO_DR, MILD_DR, MODERATE_DR, SEVERE_DR, PROLIFERATIVE_DR, ALL'),
            OpenApiParameter('progression', bool, description='Filter only patients with progression alerts'),
            OpenApiParameter('search', str, description='Search by patient name, code, or phone'),
            OpenApiParameter('sort_by', str, description='Sort field: priority, latest, oldest, risk')
        ]
    )
    def get(self, request):
        risk = request.query_params.get('risk', 'ALL')
        severity = request.query_params.get('severity', 'ALL')
        progression = request.query_params.get('progression', '').lower() in ('true', '1')
        search = request.query_params.get('search', '')
        sort_by = request.query_params.get('sort_by', 'priority')

        user = request.user
        org = None
        if user and user.is_authenticated:
            if not getattr(user, 'is_superuser', False) and getattr(user, 'role', '') != 'ADMIN':
                membership = getattr(user, 'organization_memberships', None)
                if membership:
                    active_mem = membership.filter(is_active=True).first()
                    if active_mem:
                        org = active_mem.organization

        queue_items = TriageService.get_triage_queue(
            organization=org,
            risk_filter=risk,
            severity_filter=severity,
            progression_only=progression,
            search_query=search,
            sort_by=sort_by
        )

        return api_response(data=queue_items)
