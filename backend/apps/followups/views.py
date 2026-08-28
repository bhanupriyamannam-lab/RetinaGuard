"""Follow-up Recall Radar Endpoints."""

from datetime import date
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema
from apps.followups.models import FollowUp
from apps.followups.serializers import FollowUpSerializer
from apps.progression.services import ProgressionService
from common.utilities import api_response
from apps.audit.middleware import AuditLoggingMiddleware

class FollowUpViewSet(viewsets.ModelViewSet):
    """
    CRUD and Recall Action Execution for Follow-ups.
    Tracks upcoming, due, and overdue patients with SMS/call recall logging.
    """
    queryset = FollowUp.objects.select_related('patient', 'assigned_to', 'referral').all()
    serializer_class = FollowUpSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['status', 'priority', 'recall_channel']
    search_fields = ['patient__patient_code', 'patient__first_name', 'patient__last_name', 'patient__phone', 'patient__village']
    ordering_fields = ['due_date', 'priority', 'status']

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user and user.is_authenticated:
            if not (getattr(user, 'is_superuser', False) or getattr(user, 'role', '') == 'ADMIN'):
                if getattr(user, 'role', '') == 'PATIENT':
                    qs = qs.filter(patient__email=user.email)
                else:
                    membership = getattr(user, 'organization_memberships', None)
                    if membership:
                        qs = qs.filter(patient__organization__memberships__user=user, patient__organization__memberships__is_active=True).distinct()

        status_filter = self.request.query_params.get('status')
        today = date.today()

        if status_filter == 'today' or status_filter == 'DUE':
            return qs.filter(due_date=today, status__in=['UPCOMING', 'DUE'])
        elif status_filter == 'overdue' or status_filter == 'OVERDUE':
            return qs.filter(due_date__lt=today).exclude(status__in=['COMPLETED', 'CANCELLED'])
        elif status_filter == 'completed' or status_filter == 'COMPLETED':
            return qs.filter(status='COMPLETED')

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
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            followup = serializer.save(assigned_to=request.user)

            AuditLoggingMiddleware.log_action(
                request,
                action='CREATE',
                entity_type='FollowUp',
                entity_id=str(followup.id),
                organization=followup.patient.organization
            )
            return api_response(data=FollowUpSerializer(followup).data, status_code=status.HTTP_201_CREATED)
        return api_response(success=False, errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

    @extend_schema(summary="Trigger automated SMS recall notification in patient preferred language")
    @action(detail=True, methods=['post'])
    def trigger_sms(self, request, pk=None):
        followup = self.get_object()
        patient = followup.patient

        # Simulate multilingual SMS dispatch
        lang = patient.preferred_language
        messages = {
            'te': f"నమస్కారం {patient.first_name} గారు, మీ డయాబెటిక్ రెటినోపతి పరీక్ష తనిఖీ సమయం వచ్చింది. దయచేసి సమీప నేత్ర శిబిరానికి రండి.",
            'hi': f"नमस्ते {patient.first_name} जी, आपकी डायबिटिक रेटिनोपैथी फॉलो-अप जांच का समय हो गया है। कृपया नजदीकी नेत्र केंद्र में आएं।",
            'ta': f"வணக்கம் {patient.first_name}, உங்கள் விழித்திரை மறுபரிசோதனைக்கான நேரம் வந்துவிட்டது. அருகிலுள்ள கண் கிளினிக்கிற்கு வரவும்.",
            'en': f"Hello {patient.first_name}, your diabetic retinopathy annual screening follow-up is due. Please visit your local eye camp."
        }

        sms_text = messages.get(lang, messages['en'])
        followup.notes = f"SMS Recall Sent on {date.today().isoformat()}: '{sms_text}'"
        followup.recall_channel = 'SMS'
        followup.status = 'DUE'
        followup.save()

        AuditLoggingMiddleware.log_action(
            request,
            action='UPDATE',
            entity_type='FollowUp',
            entity_id=str(followup.id),
            metadata={'action': 'TRIGGER_SMS', 'language': lang}
        )

        return api_response(
            data={
                'followup_id': str(followup.id),
                'recipient_phone': patient.phone,
                'language': lang,
                'sms_text': sms_text,
                'status': 'DISPATCHED'
            },
            message='Multilingual recall SMS dispatched successfully.'
        )

    @extend_schema(summary="Mark follow-up examination as completed")
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        followup = self.get_object()
        followup.status = 'COMPLETED'
        followup.completed_date = date.today()
        followup.notes = request.data.get('notes', followup.notes or 'Completed at clinic')
        followup.save()

        ProgressionService.record_timeline_event(
            patient=followup.patient,
            screening=followup.screening,
            event_type='FOLLOWUP_COMPLETED',
            stage_title='Patient Follow-up Completed',
            severity=followup.patient.current_severity,
            risk_level=followup.patient.current_risk_level,
            risk_score=20,
            summary=f"Follow-up examination completed. Surveillance cycle updated."
        )

        return api_response(data=FollowUpSerializer(followup).data, message='Follow-up marked as completed.')
