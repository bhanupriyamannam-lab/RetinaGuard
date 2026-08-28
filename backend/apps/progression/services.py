"""
Longitudinal Progression and Timeline Services.
Evaluates historical scan deltas and records care continuum timeline milestones.
"""

from datetime import date
from typing import Optional, List
from apps.patients.models import Patient
from apps.screenings.models import ScreeningSession
from apps.progression.models import ProgressionAssessment, ScreeningEvent
from ai.base import FindingData, FindingLocation
from ai import get_progression_provider

class ProgressionService:
    """Evaluates longitudinal progression and manages timeline history."""

    @classmethod
    def evaluate_progression(
        cls,
        current_screening: ScreeningSession,
        previous_screening: Optional[ScreeningSession] = None
    ) -> Optional[ProgressionAssessment]:
        patient = current_screening.patient

        # 1. Find previous screening if not specified
        if previous_screening is None:
            previous_screening = ScreeningSession.objects.filter(
                patient=patient,
                status='ANALYZED'
            ).exclude(id=current_screening.id).order_by('-created_at').first()

        if not previous_screening:
            return None

        # 2. Extract findings from previous and current analyses
        curr_analysis = current_screening.ai_analyses.order_by('-created_at').first()
        prev_analysis = previous_screening.ai_analyses.order_by('-created_at').first()

        if not curr_analysis or not prev_analysis:
            return None

        def extract_findings(analysis) -> List[FindingData]:
            return [
                FindingData(
                    finding_type=f.finding_type,
                    confidence=float(f.confidence),
                    severity=f.severity,
                    location=FindingLocation(x=f.x, y=f.y, width=f.width, height=f.height, area=f.area),
                    eye_side=f.eye_side
                )
                for f in analysis.findings.all()
            ]

        curr_findings = extract_findings(curr_analysis)
        prev_findings = extract_findings(prev_analysis)

        # 3. Compute interval in months
        days_diff = (current_screening.screening_date - previous_screening.screening_date).days
        months_diff = max(1, round(days_diff / 30.4))

        # 4. Call progression provider
        provider = get_progression_provider()
        prog_result = provider.compare_screenings(
            previous_findings=prev_findings,
            current_findings=curr_findings,
            previous_stage=prev_analysis.predicted_stage,
            current_stage=curr_analysis.predicted_stage,
            interval_months=months_diff
        )

        changes_list = [
            {
                'finding_type': c.finding_type,
                'previous_count': c.previous_count,
                'current_count': c.current_count,
                'delta': c.delta,
                'change_percentage': c.change_percentage,
                'description': c.description
            }
            for c in prog_result.changes
        ]

        # 5. Persist or update ProgressionAssessment
        assessment, _ = ProgressionAssessment.objects.update_or_create(
            current_screening=current_screening,
            defaults={
                'patient': patient,
                'previous_screening': previous_screening,
                'status': prog_result.status,
                'changes': changes_list,
                'confidence': prog_result.confidence,
                'velocity_assessment': prog_result.velocity_assessment,
                'summary': prog_result.summary
            }
        )

        # 6. Update patient status
        patient.has_progression_alert = (prog_result.status == 'POSSIBLE_PROGRESSION')
        patient.save(update_fields=['has_progression_alert'])

        return assessment

    @classmethod
    def record_timeline_event(
        cls,
        patient: Patient,
        event_type: str,
        stage_title: str,
        severity: str,
        risk_level: str,
        risk_score: int,
        summary: str,
        event_date: Optional[date] = None,
        screening: Optional[ScreeningSession] = None,
        metadata: Optional[dict] = None
    ) -> ScreeningEvent:
        """Appends a new chronological milestone to the patient's care trajectory."""
        return ScreeningEvent.objects.create(
            patient=patient,
            screening=screening,
            event_type=event_type,
            event_date=event_date or date.today(),
            stage_title=stage_title,
            severity=severity,
            risk_level=risk_level,
            risk_score=risk_score,
            summary=summary,
            metadata=metadata or {}
        )
