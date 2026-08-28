"""
Mock AI providers for deterministic hackathon demonstrations and testing.
Simulates all clinical DR severity stages, Grad-CAM overlays, optical quality conditions, and progression deltas.
"""

import time
from typing import Optional, Dict, Any, List
from ai.base import (
    BaseRetinalAIProvider,
    BaseImageQualityProvider,
    BaseProgressionProvider,
    QualityAssessmentData,
    AIResultData,
    FindingData,
    FindingLocation,
    ProgressionData,
    FindingChangeData
)
from ai.explainability import GradCAMService

class MockImageQualityProvider(BaseImageQualityProvider):
    """Simulates pre-screening optical assessment for demo scenarios."""

    def assess(self, image_path: str, is_poor_override: bool = False) -> QualityAssessmentData:
        filename = (image_path or '').lower()
        if is_poor_override or 'blur' in filename or 'poor' in filename:
            return QualityAssessmentData(
                overall_quality='POOR',
                sharpness=38,
                brightness=42,
                contrast=46,
                retinal_visibility=48,
                field_of_view=30,
                issues=['MOTION_BLUR', 'SUB_OPTIMAL_ILLUMINATION'],
                recommendation='RETAKE',
                algorithm_version='RetinaGuard-OpticalQC-v2.4-Demo'
            )

        return QualityAssessmentData(
            overall_quality='GOOD',
            sharpness=92,
            brightness=94,
            contrast=90,
            retinal_visibility=96,
            field_of_view=45,
            issues=[],
            recommendation='ACCEPT',
            algorithm_version='RetinaGuard-OpticalQC-v2.4-Demo'
        )


class MockRetinalAIProvider(BaseRetinalAIProvider):
    """
    Deterministic AI provider supporting scenario testing:
    - HEALTHY: No DR, 98.4% confidence
    - MILD: Mild NPDR, 2 microaneurysms, 93.2% confidence
    - MODERATE: Moderate NPDR, 3 microaneurysms, 1 hemorrhage, 91.8% confidence
    - PROGRESSION: Moderate NPDR with +5 MA, +3 Hem, +2 Exudates, 94.2% confidence
    - PROLIFERATIVE: PDR with neovascularization, 96.5% confidence
    """

    def __init__(self, model_name: str = "RetinaGuard-DeepVision-Ensemble", model_version: str = "v2.4"):
        self.model_name = model_name
        self.model_version = model_version

    def analyze(self, image_path: str, context: Optional[Dict[str, Any]] = None) -> AIResultData:
        start_time = time.time()
        ctx = context or {}
        scenario = ctx.get('scenario', 'PROGRESSION').upper()
        patient_code = ctx.get('patient_code', '')

        # Determine clinical stage and findings
        if scenario == 'HEALTHY' or patient_code in ('RG-1088', 'p-1088'):
            stage = 'NO_DR'
            confidence = 0.984
            findings = []
        elif scenario == 'MILD':
            stage = 'MILD'
            confidence = 0.932
            findings = [
                FindingData(
                    finding_type='MICROANEURYSM',
                    confidence=0.89,
                    severity='MILD',
                    location=FindingLocation(x=0.38, y=0.52, width=0.04, height=0.04, area=16)
                ),
                FindingData(
                    finding_type='MICROANEURYSM',
                    confidence=0.86,
                    severity='MILD',
                    location=FindingLocation(x=0.44, y=0.61, width=0.03, height=0.03, area=9)
                )
            ]
        elif scenario == 'MODERATE' or patient_code in ('RG-1051', 'p-1051'):
            stage = 'MODERATE'
            confidence = 0.918
            findings = [
                FindingData(
                    finding_type='MICROANEURYSM',
                    confidence=0.92,
                    severity='MODERATE',
                    location=FindingLocation(x=0.35, y=0.54, width=0.04, height=0.04, area=18)
                ),
                FindingData(
                    finding_type='MICROANEURYSM',
                    confidence=0.88,
                    severity='MODERATE',
                    location=FindingLocation(x=0.42, y=0.60, width=0.04, height=0.04, area=15)
                ),
                FindingData(
                    finding_type='MICROANEURYSM',
                    confidence=0.85,
                    severity='MILD',
                    location=FindingLocation(x=0.48, y=0.57, width=0.03, height=0.03, area=10)
                ),
                FindingData(
                    finding_type='HEMORRHAGE',
                    confidence=0.91,
                    severity='MODERATE',
                    location=FindingLocation(x=0.39, y=0.65, width=0.05, height=0.05, area=25)
                )
            ]
        elif scenario == 'PROLIFERATIVE' or patient_code in ('RG-1029', 'p-1029'):
            stage = 'PROLIFERATIVE'
            confidence = 0.965
            findings = [
                FindingData(
                    finding_type='MICROANEURYSM',
                    confidence=0.96,
                    severity='SEVERE',
                    location=FindingLocation(x=0.32, y=0.48, width=0.05, height=0.05, area=30)
                ),
                FindingData(
                    finding_type='HEMORRHAGE',
                    confidence=0.95,
                    severity='SEVERE',
                    location=FindingLocation(x=0.36, y=0.55, width=0.08, height=0.07, area=56)
                ),
                FindingData(
                    finding_type='EXUDATE',
                    confidence=0.94,
                    severity='MODERATE',
                    location=FindingLocation(x=0.50, y=0.46, width=0.06, height=0.06, area=36)
                ),
                FindingData(
                    finding_type='NEOVASCULARIZATION',
                    confidence=0.96,
                    severity='SEVERE',
                    location=FindingLocation(x=0.22, y=0.50, width=0.09, height=0.09, area=81),
                    metadata={'location_description': 'Optic disc margin (NVD)'}
                )
            ]
        else:
            # Default: Anita Rao (#RG-1042) progression scan
            stage = 'MODERATE'
            confidence = 0.942
            findings = [
                FindingData(
                    finding_type='MICROANEURYSM',
                    confidence=0.94,
                    severity='MODERATE',
                    location=FindingLocation(x=0.34, y=0.55, width=0.04, height=0.04, area=20)
                ),
                FindingData(
                    finding_type='MICROANEURYSM',
                    confidence=0.91,
                    severity='MODERATE',
                    location=FindingLocation(x=0.39, y=0.59, width=0.04, height=0.04, area=18)
                ),
                FindingData(
                    finding_type='MICROANEURYSM',
                    confidence=0.89,
                    severity='MILD',
                    location=FindingLocation(x=0.45, y=0.63, width=0.03, height=0.03, area=12)
                ),
                FindingData(
                    finding_type='HEMORRHAGE',
                    confidence=0.93,
                    severity='MODERATE',
                    location=FindingLocation(x=0.37, y=0.66, width=0.06, height=0.05, area=30)
                ),
                FindingData(
                    finding_type='HEMORRHAGE',
                    confidence=0.90,
                    severity='MODERATE',
                    location=FindingLocation(x=0.48, y=0.52, width=0.05, height=0.05, area=24)
                ),
                FindingData(
                    finding_type='EXUDATE',
                    confidence=0.91,
                    severity='MILD',
                    location=FindingLocation(x=0.52, y=0.47, width=0.05, height=0.05, area=22)
                ),
                FindingData(
                    finding_type='EXUDATE',
                    confidence=0.88,
                    severity='MILD',
                    location=FindingLocation(x=0.55, y=0.49, width=0.04, height=0.04, area=16)
                )
            ]

        # Generate Explainability assets
        explainability = GradCAMService.save_explainability_assets(image_path, findings, stage)
        proc_time = int((time.time() - start_time) * 1000)

        return AIResultData(
            predicted_stage=stage,
            confidence=confidence,
            model_name=self.model_name,
            model_version=self.model_version,
            processing_time_ms=max(150, proc_time),
            findings=findings,
            explainability=explainability,
            raw_scores={
                'NO_DR': 0.01 if stage != 'NO_DR' else 0.984,
                'MILD': 0.04 if stage != 'MILD' else 0.932,
                'MODERATE': 0.942 if stage == 'MODERATE' else 0.03,
                'SEVERE': 0.02,
                'PROLIFERATIVE': 0.965 if stage == 'PROLIFERATIVE' else 0.01
            },
            is_simulation=True
        )


class MockProgressionProvider(BaseProgressionProvider):
    """Computes quantitative lesion delta and possible disease progression."""

    def compare_screenings(
        self,
        previous_findings: List[FindingData],
        current_findings: List[FindingData],
        previous_stage: str,
        current_stage: str,
        interval_months: int = 6
    ) -> ProgressionData:
        # Group counts by finding type
        prev_counts: Dict[str, int] = {}
        for f in previous_findings:
            prev_counts[f.finding_type] = prev_counts.get(f.finding_type, 0) + 1

        curr_counts: Dict[str, int] = {}
        for f in current_findings:
            curr_counts[f.finding_type] = curr_counts.get(f.finding_type, 0) + 1

        changes: List[FindingChangeData] = []
        all_types = set(prev_counts.keys()).union(set(curr_counts.keys()))

        if not all_types:
            all_types = {'MICROANEURYSM', 'HEMORRHAGE', 'EXUDATE'}

        for ftype in sorted(all_types):
            p_cnt = prev_counts.get(ftype, 0)
            c_cnt = curr_counts.get(ftype, 0)
            delta = c_cnt - p_cnt
            pct = round(((c_cnt - p_cnt) / max(1, p_cnt)) * 100, 1) if p_cnt > 0 else 100.0 if c_cnt > 0 else 0.0
            
            if delta > 0:
                desc = f"+{delta} new {ftype.lower().replace('_', ' ')}s detected along vascular arcade."
            elif delta < 0:
                desc = f"{abs(delta)} fewer {ftype.lower().replace('_', ' ')}s observed."
            else:
                desc = f"Stable lesion count ({c_cnt})."

            changes.append(
                FindingChangeData(
                    finding_type=ftype,
                    previous_count=p_cnt,
                    current_count=c_cnt,
                    delta=delta,
                    change_percentage=pct,
                    description=desc
                )
            )

        # Progression assessment rules
        total_delta = sum(c.delta for c in changes)
        if total_delta >= 4 or (previous_stage == 'MILD' and current_stage in ('MODERATE', 'SEVERE', 'PROLIFERATIVE')):
            status = 'POSSIBLE_PROGRESSION'
            velocity = 'HIGH'
            confidence = 0.942
            summary = f"Comparison with baseline scan ({interval_months} months prior) indicates accelerated microvascular progression (+{total_delta} lesions). Specialist review recommended."
        elif total_delta > 0:
            status = 'SIGNIFICANT_CHANGE'
            velocity = 'MODERATE'
            confidence = 0.885
            summary = f"Trace microvascular alterations noted (+{total_delta} lesions). Standard surveillance recommended."
        else:
            status = 'STABLE'
            velocity = 'NORMAL'
            confidence = 0.960
            summary = f"Retinal vasculature stable with no significant progression across the {interval_months}-month interval."

        return ProgressionData(
            status=status,
            confidence=confidence,
            changes=changes,
            summary=summary,
            velocity_assessment=velocity
        )
