"""Referral Endpoints and Stage Transitions."""

from rest_framework import viewsets, status, permissions
from drf_spectacular.utils import extend_schema
from apps.referrals.models import Referral, ReferralEvent
from apps.referrals.serializers import ReferralSerializer
from apps.notifications.models import Notification
from apps.progression.services import ProgressionService
from common.utilities import api_response
from apps.audit.middleware import AuditLoggingMiddleware

class ReferralViewSet(viewsets.ModelViewSet):
    """
    CRUD and Clinical Stage Progression for Specialist Referrals.
    Tracks stages: CREATED -> REFERRED -> PATIENT_NOTIFIED -> APPOINTMENT_BOOKED -> SPECIALIST_REVIEW -> COMPLETED.
    """
    queryset = Referral.objects.select_related('patient', 'created_by', 'assigned_doctor').prefetch_related('stage_history').all()
    serializer_class = ReferralSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['status', 'priority', 'facility_type', 'hospital_name']
    search_fields = ['patient__patient_code', 'patient__first_name', 'patient__last_name', 'specialist_name', 'hospital_name']
    ordering_fields = ['created_at', 'target_date', 'priority', 'status']

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user and user.is_authenticated:
            if getattr(user, 'is_superuser', False) or getattr(user, 'role', '') == 'ADMIN':
                return qs
            if getattr(user, 'role', '') == 'PATIENT':
                return qs.filter(patient__email=user.email)
            membership = getattr(user, 'organization_memberships', None)
            if membership:
                return qs.filter(patient__organization__memberships__user=user, patient__organization__memberships__is_active=True).distinct()
        return qs

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

    def create(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if data.get('status') == 'NOTIFIED':
            data['status'] = 'PATIENT_NOTIFIED'
        elif data.get('status') == 'SPECIALIST_REVIEWED':
            data['status'] = 'SPECIALIST_REVIEW'
        elif data.get('status') == 'SCREENED':
            data['status'] = 'REFERRED'

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            user = request.user if (request.user and request.user.is_authenticated) else None
            referral = serializer.save(created_by=user)

            # Record initial referral event
            ReferralEvent.objects.create(
                referral=referral,
                from_status='NONE',
                to_status=referral.status,
                changed_by=user,
                notes='Referral initiated via RetinaGuard clinical assessment'
            )

            # Record in patient longitudinal timeline
            try:
                ProgressionService.record_timeline_event(
                    patient=referral.patient,
                    screening=referral.screening,
                    event_type='REFERRED',
                    stage_title='Specialist Referral Dispatched',
                    severity=referral.patient.current_severity,
                    risk_level=referral.priority,
                    risk_score=80 if referral.priority == 'URGENT' else 50,
                    summary=f"Direct referral to {referral.hospital_name} ({referral.specialist_name})."
                )
            except Exception:
                pass

            try:
                AuditLoggingMiddleware.log_action(
                    request,
                    action='REFERRAL_CREATED',
                    entity_type='Referral',
                    entity_id=str(referral.id),
                    organization=referral.patient.organization
                )
            except Exception:
                pass

            return api_response(data=ReferralSerializer(referral).data, message='Referral created and dispatched.', status_code=status.HTTP_201_CREATED)
        return api_response(success=False, errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_status = instance.status

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if data.get('status') == 'NOTIFIED':
            data['status'] = 'PATIENT_NOTIFIED'
        elif data.get('status') == 'SPECIALIST_REVIEWED':
            data['status'] = 'SPECIALIST_REVIEW'
        elif data.get('status') == 'SCREENED':
            data['status'] = 'REFERRED'

        serializer = self.get_serializer(instance, data=data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            
            # If status changed, record transition event
            new_status = updated.status
            if old_status != new_status:
                user = request.user if (request.user and request.user.is_authenticated) else None
                ReferralEvent.objects.create(
                    referral=updated,
                    from_status=old_status,
                    to_status=new_status,
                    changed_by=user,
                    notes=request.data.get('notes', f"Status advanced to {new_status}")
                )

                try:
                    AuditLoggingMiddleware.log_action(
                        request,
                        action='REFERRAL_UPDATED',
                        entity_type='Referral',
                        entity_id=str(updated.id),
                        metadata={'from_status': old_status, 'to_status': new_status},
                        organization=updated.patient.organization
                    )
                except Exception:
                    pass

            return api_response(data=ReferralSerializer(updated).data, message='Referral updated.')
        return api_response(success=False, errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
