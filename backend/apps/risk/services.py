"""
Configurable Clinical Risk Assessment Service.
Computes composite risk score (0-100), risk tier, identified risk factors, and recommended action.
"""

from typing import List, Dict, Any, Optional
from ai.base import RiskData, FindingData
from apps.patients.models import Patient

class RiskAssessmentService:
    """
    Evaluates patient risk across multi-parametric clinical indicators:
    1. AI Diagnostic Severity (Base weight: 0 - 55 pts)
    2. Number of Detected Hemorrhages & Microaneurysms (0 - 20 pts)
    3. Longitudinal Progression Velocity (0 - 15 pts)
    4. Duration of Diabetes & HbA1c Level (0 - 10 pts)
    """

    @classmethod
    def calculate_risk(
        cls,
        predicted_stage: str,
        findings: List[FindingData],
        has_progression_alert: bool = False,
        patient: Optional[Patient] = None
    ) -> RiskData:
        score = 0
        factors: List[str] = []

        # 1. Base stage score
        stage_weights = {
            'NO_DR': 10,
            'MILD': 35,
            'MODERATE': 65,
            'SEVERE': 85,
            'PROLIFERATIVE': 96,
            'UNDETERMINED': 40
        }
        score += stage_weights.get(predicted_stage, 25)
        
        if predicted_stage != 'NO_DR':
            factors.append(f"AI Retinopathy Classification: {predicted_stage.replace('_', ' ')}")

        # 2. Findings contribution
        num_findings = len(findings)
        has_hemorrhages = any(f.finding_type == 'HEMORRHAGE' for f in findings)
        has_exudates = any(f.finding_type == 'EXUDATE' for f in findings)
        has_neovascular = any(f.finding_type == 'NEOVASCULARIZATION' for f in findings)

        if has_neovascular:
            score += 15
            factors.append("Critical Finding: Neovascularization suspected at optic disc/arcade")
        if has_hemorrhages:
            score += 8
            factors.append(f"Active retinal hemorrhages present ({sum(1 for f in findings if f.finding_type == 'HEMORRHAGE')} lesions)")
        if has_exudates:
            score += 6
            factors.append("Lipid exudate deposits observed near macular perifovea")

        # 3. Longitudinal progression contribution
        if has_progression_alert:
            score += 12
            factors.append("Longitudinal Progression: Accelerated lesion velocity noted compared to prior baseline scan")

        # 4. Patient metabolic factors
        if patient:
            if patient.diabetes_duration_years >= 10:
                score += 5
                factors.append(f"Long diabetes duration ({patient.diabetes_duration_years} years)")
            if patient.hba1c and float(patient.hba1c) >= 8.0:
                score += 5
                factors.append(f"Elevated HbA1c: {patient.hba1c}%")

        # Clamp composite score
        score = max(5, min(99, score))

        # Determine Risk Level & Action Recommendation
        if score >= 90 or predicted_stage == 'PROLIFERATIVE' or has_neovascular:
            level = 'URGENT'
            recommendation = {
                'action': 'EMERGENCY_APEX_DISPATCH',
                'timeframe_days': 2,
                'target_facility': 'Tertiary Apex Eye Hospital',
                'transport_assistance': True,
                'clinical_guidance': 'Immediate vitreoretinal specialist review. High threat of preretinal hemorrhage or tractional retinal detachment.'
            }
        elif score >= 70 or predicted_stage in ('MODERATE', 'SEVERE') or has_progression_alert:
            level = 'HIGH'
            recommendation = {
                'action': 'SPECIALIST_REFERRAL',
                'timeframe_days': 14,
                'target_facility': 'District Government Regional Eye Hospital',
                'transport_assistance': True,
                'clinical_guidance': 'Referral for dilated clinical biomicroscopy and optical coherence tomography (OCT).'
            }
        elif score >= 40 or predicted_stage == 'MILD':
            level = 'MODERATE'
            recommendation = {
                'action': 'PRIMARY_SURVEILLANCE',
                'timeframe_days': 180,
                'target_facility': 'Primary Community Clinic / PHC',
                'transport_assistance': False,
                'clinical_guidance': '6-month repeat retinal screening surveillance. Glycemic and blood pressure optimization.'
            }
        else:
            level = 'LOW'
            recommendation = {
                'action': 'ANNUAL_RECALL',
                'timeframe_days': 365,
                'target_facility': 'Community Health Camp / PHC',
                'transport_assistance': False,
                'clinical_guidance': 'Annual diabetic retinopathy screening recall. Continue routine glycemic management.'
            }

        return RiskData(
            risk_level=level,
            risk_score=score,
            risk_factors=factors,
            recommendation=recommendation,
            is_prototype_score=True
        )
