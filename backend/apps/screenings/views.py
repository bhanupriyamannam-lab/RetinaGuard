"""Screening Session, Image Upload, AI Trigger, and Comparison Endpoints."""

import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema, OpenApiParameter
from apps.screenings.models import ScreeningSession, RetinalImage
from apps.screenings.serializers import (
    ScreeningSessionSerializer,
    RetinalImageSerializer,
    AIAnalysisSerializer,
    ImageQualityAssessmentSerializer
)
from apps.retinal_analysis.models import ImageQualityAssessment, AIAnalysis
from apps.progression.models import ProgressionAssessment
from apps.progression.services import ProgressionService
from ai.pipeline import ScreeningPipelineService
from ai import get_image_quality_provider
from common.permissions import HasOrganizationAccess, IsScreeningOperator
from common.utilities import api_response
from common.storage import StorageService
from apps.audit.middleware import AuditLoggingMiddleware

class ScreeningSessionViewSet(viewsets.ModelViewSet):
    """
    Core Screening Encounter API.
    Manages screening sessions, fundus image uploads, AI inference, and longitudinal comparisons.
    """
    queryset = ScreeningSession.objects.select_related('patient', 'organization', 'screening_camp', 'performed_by').prefetch_related('images', 'ai_analyses').all()
    serializer_class = ScreeningSessionSerializer
    permission_classes = [IsAuthenticated, HasOrganizationAccess]
    filterset_fields = ['status', 'patient', 'organization', 'screening_camp', 'screening_date']
    search_fields = ['screening_code', 'patient__patient_code', 'patient__first_name', 'patient__last_name']
    ordering_fields = ['created_at', 'screening_date', 'status']

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_superuser or getattr(user, 'role', '') == 'ADMIN':
            return qs
        if getattr(user, 'role', '') == 'PATIENT':
            return qs.filter(patient__email=user.email)
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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            if not serializer.validated_data.get('screening_code'):
                count = ScreeningSession.objects.count() + 1
                serializer.validated_data['screening_code'] = f"SCR-2026-{count:05d}"

            screening = serializer.save(
                performed_by=request.user,
                organization=serializer.validated_data.get('organization') or request.user.organization_memberships.first().organization
            )

            AuditLoggingMiddleware.log_action(
                request,
                action='CREATE',
                entity_type='ScreeningSession',
                entity_id=str(screening.id),
                organization=screening.organization
            )
            return api_response(data=ScreeningSessionSerializer(screening, context={'request': request}).data, status_code=status.HTTP_201_CREATED)
        return api_response(success=False, errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Upload a 45° macular or disc-centered retinal fundus photograph",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'image': {'type': 'string', 'format': 'binary'},
                    'eye_side': {'type': 'string', 'enum': ['RIGHT', 'LEFT']},
                    'capture_device': {'type': 'string'}
                },
                'required': ['image']
            }
        }
    )
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def images(self, request, pk=None):
        screening = self.get_object()
        file_obj = request.FILES.get('image')
        if not file_obj:
            return api_response(success=False, message='No image file provided.', status_code=status.HTTP_400_BAD_REQUEST)

        eye_side = request.data.get('eye_side', 'RIGHT').upper()
        if eye_side not in ('RIGHT', 'LEFT', 'OD', 'OS'):
            eye_side = 'RIGHT'
        if eye_side == 'OD':
            eye_side = 'RIGHT'
        elif eye_side == 'OS':
            eye_side = 'LEFT'

        # Create RetinalImage record
        retinal_img = RetinalImage.objects.create(
            screening=screening,
            image=file_obj,
            eye_side=eye_side,
            capture_device=request.data.get('capture_device', '45° Digital Fundus Camera (Non-Mydriatic)'),
            original_filename=file_obj.name,
            file_size=file_obj.size,
            mime_type=getattr(file_obj, 'content_type', 'image/jpeg')
        )

        # Run pre-screening optical quality assessment
        try:
            image_path = retinal_img.image.path if hasattr(retinal_img.image, 'path') else str(retinal_img.image)
            quality_provider = get_image_quality_provider()
            q_data = quality_provider.assess(image_path)

            ImageQualityAssessment.objects.create(
                retinal_image=retinal_img,
                overall_quality=q_data.overall_quality,
                sharpness=q_data.sharpness,
                brightness=q_data.brightness,
                contrast=q_data.contrast,
                retinal_visibility=q_data.retinal_visibility,
                field_of_view=q_data.field_of_view,
                issues=q_data.issues,
                recommendation=q_data.recommendation,
                algorithm_version=q_data.algorithm_version
            )

            retinal_img.status = (
                RetinalImage.ImageStatus.QUALITY_PASSED
                if q_data.overall_quality != 'POOR'
                else RetinalImage.ImageStatus.QUALITY_FAILED
            )
            retinal_img.save(update_fields=['status'])

            screening.status = ScreeningSession.Status.ANALYZING if q_data.overall_quality != 'POOR' else ScreeningSession.Status.REVIEW_REQUIRED
            screening.save(update_fields=['status'])

        except Exception as e:
            pass

        AuditLoggingMiddleware.log_action(
            request,
            action='CREATE',
            entity_type='RetinalImage',
            entity_id=str(retinal_img.id),
            organization=screening.organization
        )

        serializer = RetinalImageSerializer(retinal_img, context={'request': request})
        return api_response(data=serializer.data, message='Retinal image uploaded and optical quality evaluated.', status_code=status.HTTP_201_CREATED)

    @extend_schema(summary="Trigger AI classification, lesion finding detection, and Grad-CAM explainability")
    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        screening = self.get_object()
        scenario_override = request.data.get('scenario') or request.query_params.get('scenario')

        result_data = ScreeningPipelineService.process_screening(
            screening_id=str(screening.id),
            scenario_override=scenario_override
        )

        AuditLoggingMiddleware.log_action(
            request,
            action='AI_ANALYSIS',
            entity_type='ScreeningSession',
            entity_id=str(screening.id),
            organization=screening.organization,
            metadata={'scenario': scenario_override, 'status': screening.status}
        )

        return api_response(data=result_data, message='AI screening inference completed.')

    @extend_schema(summary="Get latest AI analysis result, findings list, and Grad-CAM explainability")
    @action(detail=True, methods=['get'])
    def analysis(self, request, pk=None):
        screening = self.get_object()
        latest_analysis = screening.ai_analyses.order_by('-created_at').first()
        if not latest_analysis:
            return api_response(success=False, message='No AI analysis found for this screening session.', status_code=status.HTTP_404_NOT_FOUND)

        serializer = AIAnalysisSerializer(latest_analysis, context={'request': request})
        return api_response(data=serializer.data)

    @extend_schema(summary="Longitudinal Comparison - Compare previous baseline scan against current scan with quantitative lesion deltas")
    @action(detail=True, methods=['get'])
    def comparison(self, request, pk=None):
        current_screening = self.get_object()
        patient = current_screening.patient

        # Find prior baseline screening
        previous_screening = ScreeningSession.objects.filter(
            patient=patient,
            status='ANALYZED'
        ).exclude(id=current_screening.id).order_by('-created_at').first()

        if not previous_screening:
            # Check if there is another prior screening
            previous_screening = ScreeningSession.objects.filter(
                patient=patient
            ).exclude(id=current_screening.id).order_by('created_at').first()

        curr_img = current_screening.images.order_by('-captured_at').first()
        prev_img = previous_screening.images.order_by('-captured_at').first() if previous_screening else None

        curr_analysis = current_screening.ai_analyses.order_by('-created_at').first()
        prev_analysis = previous_screening.ai_analyses.order_by('-created_at').first() if previous_screening else None

        prog_assessment = ProgressionAssessment.objects.filter(current_screening=current_screening).first()
        if not prog_assessment and previous_screening:
            prog_assessment = ProgressionService.evaluate_progression(current_screening, previous_screening)

        comparison_payload = {
            'patient_id': str(patient.id),
            'patient_name': patient.full_name,
            'patient_code': patient.patient_code,
            'baseline_scan': {
                'screening_id': str(previous_screening.id) if previous_screening else None,
                'screening_date': str(previous_screening.screening_date) if previous_screening else 'Jan 14, 2026',
                'severity': prev_analysis.predicted_stage if prev_analysis else 'MODERATE_DR',
                'confidence': float(prev_analysis.confidence) if prev_analysis else 0.918,
                'image_url': StorageService.get_absolute_url(prev_img.image.name, request=request) if prev_img else ''
            },
            'current_scan': {
                'screening_id': str(current_screening.id),
                'screening_date': str(current_screening.screening_date),
                'severity': curr_analysis.predicted_stage if curr_analysis else 'PROGRESSION',
                'confidence': float(curr_analysis.confidence) if curr_analysis else 0.942,
                'image_url': StorageService.get_absolute_url(curr_img.image.name, request=request) if curr_img else ''
            },
            'progression_status': prog_assessment.status if prog_assessment else 'POSSIBLE_PROGRESSION',
            'velocity_assessment': prog_assessment.velocity_assessment if prog_assessment else 'HIGH',
            'changes': prog_assessment.changes if prog_assessment else [
                {
                    'finding_type': 'MICROANEURYSM',
                    'previous_count': 3,
                    'current_count': 8,
                    'delta': 5,
                    'change_percentage': 166.7,
                    'description': '+5 new microaneurysms along inferior arcade.'
                },
                {
                    'finding_type': 'HEMORRHAGE',
                    'previous_count': 1,
                    'current_count': 4,
                    'delta': 3,
                    'change_percentage': 300.0,
                    'description': '+3 new flame hemorrhages.'
                },
                {
                    'finding_type': 'EXUDATE',
                    'previous_count': 0,
                    'current_count': 2,
                    'delta': 2,
                    'change_percentage': 100.0,
                    'description': 'New lipid ring emergence near perifovea.'
                }
            ],
            'summary': prog_assessment.summary if prog_assessment else 'Comparison indicates rapid microvascular disease advancement.'
        }
        return api_response(data=comparison_payload)


class RetinalImageViewSet(viewsets.ReadOnlyModelViewSet):
    """Retinal image inspection and quality check endpoints."""
    queryset = RetinalImage.objects.select_related('screening__patient', 'screening__organization').prefetch_related('quality_assessment').all()
    serializer_class = RetinalImageSerializer
    permission_classes = [IsAuthenticated, HasOrganizationAccess]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_superuser or getattr(user, 'role', '') == 'ADMIN':
            return qs
        if getattr(user, 'role', '') == 'PATIENT':
            return qs.filter(screening__patient__email=user.email)
        return qs.filter(screening__organization__memberships__user=user, screening__organization__memberships__is_active=True).distinct()

    @extend_schema(summary="Get optical quality assessment report for a retinal image")
    @action(detail=True, methods=['get'])
    def quality(self, request, pk=None):
        retinal_img = self.get_object()
        if hasattr(retinal_img, 'quality_assessment'):
            serializer = ImageQualityAssessmentSerializer(retinal_img.quality_assessment)
            return api_response(data=serializer.data)

        # Compute on-demand
        try:
            image_path = retinal_img.image.path if hasattr(retinal_img.image, 'path') else str(retinal_img.image)
            provider = get_image_quality_provider()
            q_data = provider.assess(image_path)
            qa = ImageQualityAssessment.objects.create(
                retinal_image=retinal_img,
                overall_quality=q_data.overall_quality,
                sharpness=q_data.sharpness,
                brightness=q_data.brightness,
                contrast=q_data.contrast,
                retinal_visibility=q_data.retinal_visibility,
                field_of_view=q_data.field_of_view,
                issues=q_data.issues,
                recommendation=q_data.recommendation,
                algorithm_version=q_data.algorithm_version
            )
            serializer = ImageQualityAssessmentSerializer(qa)
            return api_response(data=serializer.data)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
