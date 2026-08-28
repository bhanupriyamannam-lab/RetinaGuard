"""
Patient 360 Aggregator Service.
Constructs a single-query, high-performance comprehensive clinical overview for a patient.
"""

from typing import Dict, Any, Optional
from apps.patients.models import Patient
from common.storage import StorageService

class Patient360Service:
    """Aggregates all clinical dimensions into a cohesive Patient 360 object."""

    @classmethod
    def get_patient_overview(cls, patient_id: str, request=None) -> Optional[Dict[str, Any]]:
        try:
            patient = Patient.objects.prefetch_related(
                'consents',
                'timeline_events',
                'referrals',
                'followups',
                'screenings__images',
                'screenings__ai_analyses__findings',
                'screenings__ai_analyses__explainability',
                'screenings__risk_assessment',
                'progression_assessments'
            ).get(id=patient_id)
        except Patient.DoesNotExist:
            return None

        # 1. Demographics & Diabetic History
        demographics = {
            'id': str(patient.id),
            'patient_code': patient.patient_code,
            'display_id': patient.display_id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'full_name': patient.full_name,
            'age': patient.age,
            'gender': patient.gender,
            'phone': patient.phone,
            'email': patient.email,
            'preferred_language': patient.preferred_language,
            'village': patient.village,
            'district': patient.district,
            'state': patient.state,
            'organization': {
                'id': str(patient.organization.id),
                'name': patient.organization.name,
                'code': patient.organization.code,
            },
            'diabetes_type': patient.diabetes_type,
            'diabetes_duration_years': patient.diabetes_duration_years,
            'hba1c': float(patient.hba1c) if patient.hba1c else None,
            'medical_notes': patient.medical_notes,
            'current_risk_level': patient.current_risk_level,
            'current_severity': patient.current_severity,
            'has_progression_alert': patient.has_progression_alert,
            'last_screening_date': str(patient.last_screening_date) if patient.last_screening_date else None,
            'registered_at': patient.created_at.isoformat()
        }

        # 2. Latest Screening & AI Analysis
        latest_screening = patient.screenings.order_by('-created_at').first()
        latest_screening_data = None
        latest_ai_data = None
        findings_data = []
        explanation_data = None
        current_risk_data = None

        if latest_screening:
            latest_screening_data = {
                'id': str(latest_screening.id),
                'screening_code': latest_screening.screening_code,
                'screening_date': str(latest_screening.screening_date),
                'status': latest_screening.status,
                'camp': latest_screening.screening_camp.name if latest_screening.screening_camp else None,
                'images_count': latest_screening.images.count(),
                'primary_image_url': StorageService.get_absolute_url(
                    latest_screening.images.first().image.name, request=request
                ) if latest_screening.images.exists() else None
            }

            latest_analysis = latest_screening.ai_analyses.order_by('-created_at').first()
            if latest_analysis:
                latest_ai_data = {
                    'id': str(latest_analysis.id),
                    'predicted_stage': latest_analysis.predicted_stage,
                    'confidence': float(latest_analysis.confidence),
                    'model_name': latest_analysis.model_name,
                    'model_version': latest_analysis.model_version,
                    'processing_time_ms': latest_analysis.processing_time_ms,
                    'status': latest_analysis.status,
                    'is_simulation': latest_analysis.is_simulation
                }

                findings_data = [
                    {
                        'id': str(f.id),
                        'finding_type': f.finding_type,
                        'confidence': float(f.confidence),
                        'severity': f.severity,
                        'location': {
                            'x': f.x,
                            'y': f.y,
                            'width': f.width,
                            'height': f.height,
                            'area': f.area
                        },
                        'eye_side': f.eye_side
                    }
                    for f in latest_analysis.findings.all()
                ]

                if hasattr(latest_analysis, 'explainability'):
                    exp = latest_analysis.explainability
                    explanation_data = {
                        'method': exp.method,
                        'heatmap_url': StorageService.get_absolute_url(exp.heatmap_path, request=request),
                        'overlay_url': StorageService.get_absolute_url(exp.overlay_path, request=request),
                        'regions': exp.regions,
                        'metadata': exp.metadata
                    }

            if hasattr(latest_screening, 'risk_assessment'):
                ra = latest_screening.risk_assessment
                current_risk_data = {
                    'risk_level': ra.risk_level,
                    'risk_score': ra.risk_score,
                    'risk_factors': ra.risk_factors,
                    'recommendation': ra.recommendation,
                    'is_prototype_score': ra.is_prototype_score
                }

        # 3. Longitudinal Timeline & Trajectory Chart Points
        timeline_events = patient.timeline_events.order_by('event_date').all()
        timeline_list = [
            {
                'id': str(evt.id),
                'event_type': evt.event_type,
                'event_date': str(evt.event_date),
                'stage_title': evt.stage_title,
                'severity': evt.severity,
                'risk_level': evt.risk_level,
                'risk_score': evt.risk_score,
                'summary': evt.summary,
                'metadata': evt.metadata
            }
            for evt in timeline_events
        ]

        trajectory_chart = [
            {
                'date': str(evt.event_date),
                'stage_title': evt.stage_title,
                'risk_score': evt.risk_score,
                'severity': evt.severity
            }
            for evt in timeline_events
        ]

        # 4. Progression Assessment
        latest_prog = patient.progression_assessments.order_by('-created_at').first()
        progression_data = None
        if latest_prog:
            progression_data = {
                'id': str(latest_prog.id),
                'status': latest_prog.status,
                'confidence': float(latest_prog.confidence),
                'velocity_assessment': latest_prog.velocity_assessment,
                'changes': latest_prog.changes,
                'summary': latest_prog.summary,
                'previous_screening_id': str(latest_prog.previous_screening_id),
                'current_screening_id': str(latest_prog.current_screening_id)
            }

        # 5. Referral Status
        active_referral = patient.referrals.order_by('-created_at').first()
        referral_data = None
        if active_referral:
            referral_data = {
                'id': str(active_referral.id),
                'status': active_referral.status,
                'priority': active_referral.priority,
                'hospital_name': active_referral.hospital_name,
                'specialist_name': active_referral.specialist_name,
                'facility_type': active_referral.facility_type,
                'target_date': str(active_referral.target_date),
                'primary_diagnosis': active_referral.primary_diagnosis,
                'transport_assistance_required': active_referral.transport_assistance_required,
                'clinical_notes': active_referral.clinical_notes
            }

        # 6. Follow-up Status
        active_followup = patient.followups.order_by('due_date').first()
        followup_data = None
        if active_followup:
            followup_data = {
                'id': str(active_followup.id),
                'status': active_followup.status,
                'priority': active_followup.priority,
                'due_date': str(active_followup.due_date),
                'recall_channel': active_followup.recall_channel,
                'is_overdue': active_followup.is_overdue,
                'days_overdue': active_followup.days_overdue,
                'notes': active_followup.notes
            }

        # 7. Consents
        consents_list = [
            {
                'id': str(c.id),
                'consent_type': c.consent_type,
                'granted': c.granted,
                'granted_at': c.granted_at.isoformat(),
                'withdrawn_at': c.withdrawn_at.isoformat() if c.withdrawn_at else None
            }
            for c in patient.consents.all()
        ]

        return {
            'patient': demographics,
            'latest_screening': latest_screening_data,
            'latest_ai_analysis': latest_ai_data,
            'findings': findings_data,
            'explanation': explanation_data,
            'current_risk': current_risk_data,
            'progression': progression_data,
            'referral': referral_data,
            'followup': followup_data,
            'timeline': timeline_list,
            'trajectory_chart': trajectory_chart,
            'consents': consents_list
        }
