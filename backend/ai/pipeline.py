"""
Screening Pipeline Service:
Orchestrates the entire clinical diagnostic pipeline end-to-end:
Image Upload -> Optical Quality Check -> Preprocessing -> DR Prediction ->
Finding Detection -> Grad-CAM Explainability -> Risk Assessment -> Progression Analysis -> Timeline Event.
"""

import logging
from typing import Dict, Any, Optional
from django.db import transaction
from django.utils import timezone
from apps.screenings.models import ScreeningSession, RetinalImage
from apps.retinal_analysis.models import (
    ImageQualityAssessment,
    AIAnalysis,
    RetinalFinding,
    ExplainabilityResult
)
from apps.risk.models import RiskAssessment
from apps.risk.services import RiskAssessmentService
from apps.progression.services import ProgressionService
from apps.notifications.models import Notification
from ai import get_retinal_ai_provider, get_image_quality_provider
from common.storage import StorageService

logger = logging.getLogger(__name__)

class ScreeningPipelineService:
    """End-to-end clinical workflow execution engine."""

    @classmethod
    @transaction.atomic
    def process_screening(
        cls,
        screening_id: str,
        retinal_image_id: Optional[str] = None,
        scenario_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes multi-stage AI diagnostic assessment for a screening session.
        """
        screening = ScreeningSession.objects.select_for_update().get(id=screening_id)
        patient = screening.patient

        # 1. Resolve retinal image
        if retinal_image_id:
            retinal_img = RetinalImage.objects.get(id=retinal_image_id, screening=screening)
        else:
            retinal_img = screening.images.order_by('-captured_at').first()

        if not retinal_img:
            raise ValueError(f"No retinal image available for screening {screening.screening_code}")

        screening.status = ScreeningSession.Status.ANALYZING
        screening.save(update_fields=['status'])

        image_path = retinal_img.image.path if hasattr(retinal_img.image, 'path') else str(retinal_img.image)

        # 2. Stage 1: Optical Quality Assessment
        quality_provider = get_image_quality_provider()
        quality_data = quality_provider.assess(image_path)

        # Persist ImageQualityAssessment
        quality_record, _ = ImageQualityAssessment.objects.update_or_create(
            retinal_image=retinal_img,
            defaults={
                'overall_quality': quality_data.overall_quality,
                'sharpness': quality_data.sharpness,
                'brightness': quality_data.brightness,
                'contrast': quality_data.contrast,
                'retinal_visibility': quality_data.retinal_visibility,
                'field_of_view': quality_data.field_of_view,
                'issues': quality_data.issues,
                'recommendation': quality_data.recommendation,
                'algorithm_version': quality_data.algorithm_version,
            }
        )

        retinal_img.status = (
            RetinalImage.ImageStatus.QUALITY_PASSED
            if quality_data.overall_quality != 'POOR'
            else RetinalImage.ImageStatus.QUALITY_FAILED
        )
        retinal_img.save(update_fields=['status'])

        # If image quality is poor and recommendation is RETAKE, pause AI inference for safety
        if quality_data.overall_quality == 'POOR' and quality_data.recommendation == 'RETAKE':
            screening.status = ScreeningSession.Status.REVIEW_REQUIRED
            screening.save(update_fields=['status'])

            return {
                'screening_id': str(screening.id),
                'screening_code': screening.screening_code,
                'status': screening.status,
                'image_quality': {
                    'overall': quality_data.overall_quality,
                    'sharpness': quality_data.sharpness,
                    'brightness': quality_data.brightness,
                    'contrast': quality_data.contrast,
                    'issues': quality_data.issues,
                    'recommendation': quality_data.recommendation,
                },
                'ai': None,
                'findings': [],
                'risk': None,
                'explanation': None,
                'progression': None,
                'recommendation': {
                    'action': 'RETAKE_IMAGE',
                    'message': 'Pre-screening optical analysis detected motion blur. Please retake before running AI inference.'
                }
            }

        # 3. Stage 2: DR Classification & Finding Detection
        try:
            ai_provider = get_retinal_ai_provider()
            context = {
                'patient_code': patient.patient_code,
                'scenario': scenario_override or ('HEALTHY' if patient.patient_code == 'RG-1088' else 'PROGRESSION')
            }
            ai_result = ai_provider.analyze(image_path, context=context)

            # Persist AIAnalysis
            analysis_record = AIAnalysis.objects.create(
                screening=screening,
                retinal_image=retinal_img,
                provider=ai_provider.__class__.__name__,
                model_name=ai_result.model_name,
                model_version=ai_result.model_version,
                status=AIAnalysis.Status.COMPLETED,
                predicted_stage=ai_result.predicted_stage,
                confidence=ai_result.confidence,
                processing_time_ms=ai_result.processing_time_ms,
                raw_scores=ai_result.raw_scores,
                is_simulation=ai_result.is_simulation
            )

            # Persist RetinalFindings
            for f in ai_result.findings:
                RetinalFinding.objects.create(
                    ai_analysis=analysis_record,
                    finding_type=f.finding_type,
                    confidence=f.confidence,
                    severity=f.severity,
                    x=f.location.x,
                    y=f.location.y,
                    width=f.location.width,
                    height=f.location.height,
                    area=f.location.area,
                    eye_side=f.eye_side,
                    metadata=f.metadata
                )

            # Persist ExplainabilityResult
            if ai_result.explainability:
                exp = ai_result.explainability
                ExplainabilityResult.objects.create(
                    ai_analysis=analysis_record,
                    method=exp.method,
                    heatmap_path=exp.heatmap_path,
                    overlay_path=exp.overlay_path,
                    regions=[
                        {
                            'id': r.id,
                            'name': r.name,
                            'contribution': r.contribution,
                            'contribution_percentage': r.contribution_percentage,
                            'description': r.description,
                            'coordinates': r.coordinates,
                            'findings_nearby': r.findings_nearby
                        }
                        for r in exp.regions
                    ],
                    metadata=exp.metadata
                )
        except Exception as ai_err:
            logger.error(f"AI inference failed for screening {screening.screening_code}: {ai_err}")
            screening.status = ScreeningSession.Status.FAILED
            screening.save(update_fields=['status'])

            AIAnalysis.objects.create(
                screening=screening,
                retinal_image=retinal_img,
                provider='AIProvider',
                status=AIAnalysis.Status.FAILED,
                error_message=str(ai_err),
                predicted_stage='UNDETERMINED',
                confidence=0.0
            )

            return {
                'screening_id': str(screening.id),
                'screening_code': screening.screening_code,
                'status': 'FAILED',
                'error': {
                    'category': 'AI_PROCESSING_FAILED',
                    'message': 'AI inference model could not complete analysis. The clinical team can retry or review manually.'
                },
                'can_retry': True,
                'image_quality': {
                    'overall': quality_data.overall_quality,
                    'sharpness': quality_data.sharpness,
                    'brightness': quality_data.brightness,
                    'contrast': quality_data.contrast,
                    'issues': quality_data.issues,
                    'recommendation': quality_data.recommendation,
                },
                'ai': None,
                'findings': [],
                'risk': None,
                'explanation': None
            }

        # 4. Stage 3: Longitudinal Progression Check
        prog_assessment = ProgressionService.evaluate_progression(screening)
        has_progression = (prog_assessment.status == 'POSSIBLE_PROGRESSION') if prog_assessment else False

        # 5. Stage 4: Multi-Factor Clinical Risk Assessment
        risk_data = RiskAssessmentService.calculate_risk(
            predicted_stage=ai_result.predicted_stage,
            findings=ai_result.findings,
            has_progression_alert=has_progression,
            patient=patient
        )

        RiskAssessment.objects.update_or_create(
            screening=screening,
            defaults={
                'patient': patient,
                'risk_level': risk_data.risk_level,
                'risk_score': risk_data.risk_score,
                'risk_factors': risk_data.risk_factors,
                'recommendation': risk_data.recommendation,
                'is_prototype_score': risk_data.is_prototype_score
            }
        )

        # 6. Update Patient Global Cached Fields
        patient.current_severity = ai_result.predicted_stage
        patient.current_risk_level = risk_data.risk_level
        patient.last_screening_date = timezone.now().date()
        patient.has_progression_alert = has_progression
        patient.save(update_fields=['current_severity', 'current_risk_level', 'last_screening_date', 'has_progression_alert'])

        # 7. Record Milestone in Patient Longitudinal Timeline
        stage_titles = {
            'NO_DR': 'No Apparent Retinopathy (Healthy)',
            'MILD': 'Mild Non-Proliferative DR',
            'MODERATE': 'Moderate Non-Proliferative DR',
            'SEVERE': 'Severe Non-Proliferative DR',
            'PROLIFERATIVE': 'Proliferative DR (Critical)',
        }
        ProgressionService.record_timeline_event(
            patient=patient,
            screening=screening,
            event_type='AI_ANALYZED',
            stage_title=stage_titles.get(ai_result.predicted_stage, ai_result.predicted_stage),
            severity=ai_result.predicted_stage,
            risk_level=risk_data.risk_level,
            risk_score=risk_data.risk_score,
            summary=f"Automated AI screening completed. {len(ai_result.findings)} retinal findings evaluated."
        )

        # 8. Notify Clinical Team if Urgent/High Risk
        if risk_data.risk_level in ('HIGH', 'URGENT') or has_progression:
            if screening.performed_by:
                Notification.objects.create(
                    user=screening.performed_by,
                    notification_type=Notification.NotificationType.HIGH_RISK if risk_data.risk_level == 'HIGH' else Notification.NotificationType.PROGRESSION_ALERT,
                    title=f"Clinical Alert: {patient.full_name} ({patient.display_id})",
                    message=f"Screening #{screening.screening_code} classified as {ai_result.predicted_stage} with Risk Score {risk_data.risk_score}. Review triage queue.",
                    related_entity_type='Screening',
                    related_entity_id=str(screening.id)
                )

        screening.status = ScreeningSession.Status.ANALYZED
        screening.save(update_fields=['status'])

        return {
            'screening_id': str(screening.id),
            'screening_code': screening.screening_code,
            'status': screening.status,
            'image_quality': {
                'overall': quality_data.overall_quality,
                'sharpness': quality_data.sharpness,
                'brightness': quality_data.brightness,
                'contrast': quality_data.contrast,
                'retinal_visibility': quality_data.retinal_visibility,
                'field_of_view': quality_data.field_of_view,
                'issues': quality_data.issues,
                'recommendation': quality_data.recommendation
            },
            'ai': {
                'stage': ai_result.predicted_stage,
                'confidence': float(ai_result.confidence),
                'model_name': ai_result.model_name,
                'model_version': ai_result.model_version,
                'processing_time_ms': ai_result.processing_time_ms,
                'is_simulation': ai_result.is_simulation
            },
            'findings': [
                {
                    'type': f.finding_type,
                    'confidence': float(f.confidence),
                    'severity': f.severity,
                    'location': {
                        'x': f.location.x,
                        'y': f.location.y,
                        'width': f.location.width,
                        'height': f.location.height,
                        'area': f.location.area
                    }
                }
                for f in ai_result.findings
            ],
            'risk': {
                'level': risk_data.risk_level,
                'score': risk_data.risk_score,
                'factors': risk_data.risk_factors,
                'recommendation': risk_data.recommendation,
                'is_prototype_score': risk_data.is_prototype_score
            },
            'explanation': {
                'method': ai_result.explainability.method if ai_result.explainability else 'GRAD_CAM',
                'heatmap_url': StorageService.get_absolute_url(ai_result.explainability.heatmap_path) if ai_result.explainability else '',
                'overlay_url': StorageService.get_absolute_url(ai_result.explainability.overlay_path) if ai_result.explainability else '',
                'regions': [
                    {
                        'id': r.id,
                        'name': r.name,
                        'contribution': r.contribution,
                        'contribution_percentage': r.contribution_percentage,
                        'description': r.description,
                        'coordinates': r.coordinates,
                        'findings_nearby': r.findings_nearby
                    }
                    for r in ai_result.explainability.regions
                ] if ai_result.explainability else []
            },
            'progression': {
                'status': prog_assessment.status if prog_assessment else 'INSUFFICIENT_DATA',
                'velocity': prog_assessment.velocity_assessment if prog_assessment else 'NORMAL',
                'changes': prog_assessment.changes if prog_assessment else [],
                'summary': prog_assessment.summary if prog_assessment else ''
            } if prog_assessment else None,
            'recommendation': risk_data.recommendation
        }
