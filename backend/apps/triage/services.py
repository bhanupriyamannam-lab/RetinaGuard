"""
Clinical Triage Engine and Priority Calculation Service.
Calculates multi-parametric urgency rankings to optimize ophthalmologist review queues.
"""

from datetime import date
from typing import Dict, Any, List
from django.db.models import Q, QuerySet
from apps.patients.models import Patient
from apps.screenings.models import ScreeningSession

class TriageService:
    """Computes dynamic priority rankings for the clinical review triage queue."""

    @classmethod
    def get_triage_queue(
        cls,
        organization=None,
        risk_filter: str = 'ALL',
        severity_filter: str = 'ALL',
        progression_only: bool = False,
        search_query: str = '',
        sort_by: str = 'priority'
    ) -> List[Dict[str, Any]]:
        """
        Queries and ranks patients needing immediate review or intervention.
        """
        queryset: QuerySet[Patient] = Patient.objects.filter(is_active=True).select_related('organization').prefetch_related(
            'screenings__ai_analyses',
            'screenings__risk_assessment',
            'referrals',
            'followups'
        )

        if organization:
            queryset = queryset.filter(organization=organization)

        if risk_filter and risk_filter != 'ALL':
            queryset = queryset.filter(current_risk_level=risk_filter)

        if severity_filter and severity_filter != 'ALL':
            queryset = queryset.filter(current_severity=severity_filter)

        if progression_only:
            queryset = queryset.filter(has_progression_alert=True)

        if search_query.strip():
            q = search_query.strip()
            queryset = queryset.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(patient_code__icontains=q) |
                Q(phone__icontains=q) |
                Q(village__icontains=q)
            )

        triage_items: List[Dict[str, Any]] = []
        today = date.today()

        for patient in queryset:
            latest_screening = patient.screenings.order_by('-created_at').first()
            active_referral = patient.referrals.exclude(status__in=['COMPLETED', 'CANCELLED']).order_by('-created_at').first()
            if not active_referral:
                active_referral = patient.referrals.order_by('-created_at').first()
            active_followup = patient.followups.exclude(status='COMPLETED').order_by('due_date').first()
            if not active_followup:
                active_followup = patient.followups.order_by('due_date').first()

            # Calculate Priority Score (0 - 100)
            score = 0
            
            # Severity weight
            severity_weights = {
                'PROLIFERATIVE_DR': 50,
                'SEVERE_DR': 40,
                'MODERATE_DR': 25,
                'MILD_DR': 10,
                'NO_DR': 0,
            }
            score += severity_weights.get(patient.current_severity, 15)

            # Progression weight
            if patient.has_progression_alert:
                score += 25

            # Risk tier weight
            if patient.current_risk_level == 'URGENT':
                score += 20
            elif patient.current_risk_level == 'HIGH':
                score += 15
            elif patient.current_risk_level == 'MODERATE':
                score += 8

            # Follow-up overdue weight
            if active_followup and active_followup.is_overdue:
                score += min(20, int(active_followup.days_overdue * 0.5))

            # Waiting time weight
            if latest_screening:
                waiting_days = (today - latest_screening.screening_date).days
                score += min(10, int(waiting_days * 0.2))

            priority_score = min(99, score)

            # Determine Priority Tier
            if priority_score >= 80 or patient.current_risk_level == 'URGENT':
                priority_tier = 'CRITICAL'
            elif priority_score >= 55 or patient.current_risk_level == 'HIGH':
                priority_tier = 'HIGH'
            elif priority_score >= 30:
                priority_tier = 'MODERATE'
            else:
                priority_tier = 'ROUTINE'

            # Primary clinical indicator summary
            if active_referral and active_referral.status != 'COMPLETED':
                indicator = f"Specialist Referral Active ({active_referral.hospital_name})"
            elif patient.has_progression_alert:
                indicator = 'Possible Progression (+5 MA, +3 Hemorrhages)'
            elif patient.current_severity == 'PROLIFERATIVE_DR':
                indicator = 'Suspected Neovascularization at Disc'
            elif patient.current_severity == 'MODERATE_DR':
                indicator = 'Multiple Microaneurysms along Inferior Arcade'
            elif active_followup and active_followup.is_overdue:
                indicator = f'Follow-up overdue by {active_followup.days_overdue} days'
            else:
                indicator = 'Routine diabetic microvascular surveillance'

            p_name = patient.full_name or f"{patient.first_name} {patient.last_name}".strip()
            if not p_name or p_name == ' ':
                p_name = f"Patient {patient.patient_code}"

            triage_items.append({
                'patient_id': str(patient.id),
                'patient_code': patient.patient_code,
                'display_id': patient.display_id,
                'patient_name': p_name,
                'age': patient.age,
                'gender': patient.gender,
                'village': patient.village,
                'organization_name': getattr(patient.organization, 'name', 'Clinical Center'),
                'priority_score': priority_score,
                'priority_tier': priority_tier,
                'current_severity': patient.current_severity,
                'current_risk_level': patient.current_risk_level,
                'has_progression_alert': patient.has_progression_alert,
                'primary_indicator': indicator,
                'last_screening_date': str(patient.last_screening_date) if patient.last_screening_date else str(today),
                'latest_screening_id': str(latest_screening.id) if latest_screening else None,
                'active_referral': {
                    'id': str(active_referral.id),
                    'status': active_referral.status,
                    'hospital_name': active_referral.hospital_name,
                } if active_referral else None,
                'active_followup': {
                    'id': str(active_followup.id),
                    'status': active_followup.status,
                    'due_date': str(active_followup.due_date),
                    'days_overdue': active_followup.days_overdue,
                } if active_followup else None,
            })

        # Sorting
        if sort_by == 'priority':
            triage_items.sort(key=lambda x: x['priority_score'], reverse=True)
        elif sort_by == 'latest':
            triage_items.sort(key=lambda x: x['last_screening_date'] or '', reverse=True)
        elif sort_by == 'oldest':
            triage_items.sort(key=lambda x: x['last_screening_date'] or '')
        elif sort_by == 'risk':
            risk_order = {'URGENT': 4, 'HIGH': 3, 'MODERATE': 2, 'LOW': 1, 'UNKNOWN': 0}
            triage_items.sort(key=lambda x: risk_order.get(x['current_risk_level'], 0), reverse=True)

        return triage_items
