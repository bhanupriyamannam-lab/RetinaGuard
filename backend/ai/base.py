"""
Abstract base classes and dataclasses for the RetinaGuard AI Engine.
Provides complete provider independence (Mock, Local PyTorch/ONNX, Remote Cloud API).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class QualityAssessmentData:
    overall_quality: str  # 'GOOD', 'ACCEPTABLE', 'POOR'
    sharpness: int        # 0 - 100
    brightness: int       # 0 - 100
    contrast: int         # 0 - 100
    retinal_visibility: int  # 0 - 100
    field_of_view: int    # in degrees e.g. 45
    issues: List[str] = field(default_factory=list)
    recommendation: str = 'ACCEPT'  # 'ACCEPT', 'RETAKE'
    algorithm_version: str = 'OpenCV-v2.1'

@dataclass
class FindingLocation:
    x: float       # normalized 0.0 - 1.0
    y: float       # normalized 0.0 - 1.0
    width: float   # normalized 0.0 - 1.0
    height: float  # normalized 0.0 - 1.0
    area: float = 0.0

@dataclass
class FindingData:
    finding_type: str  # 'MICROANEURYSM', 'HEMORRHAGE', 'EXUDATE', 'COTTON_WOOL_SPOT', 'NEOVASCULARIZATION', 'OTHER'
    confidence: float  # 0.0 - 1.0
    severity: str      # 'TRACE', 'MILD', 'MODERATE', 'SEVERE'
    location: FindingLocation
    eye_side: str = 'RIGHT'
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AttentionRegionData:
    id: str
    name: str
    contribution: str  # 'High', 'Moderate', 'Low'
    contribution_percentage: int  # 0 - 100
    description: str
    coordinates: Dict[str, float] = field(default_factory=dict)
    findings_nearby: List[str] = field(default_factory=list)

@dataclass
class ExplainabilityData:
    method: str  # 'GRAD_CAM', 'GRAD_CAM_PLUS_PLUS', 'INTEGRATED_GRADIENTS'
    heatmap_path: Optional[str] = None
    overlay_path: Optional[str] = None
    regions: List[AttentionRegionData] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AIResultData:
    predicted_stage: str  # 'NO_DR', 'MILD', 'MODERATE', 'SEVERE', 'PROLIFERATIVE', 'UNDETERMINED'
    confidence: float     # 0.0 - 1.0
    model_name: str
    model_version: str
    processing_time_ms: int
    findings: List[FindingData] = field(default_factory=list)
    explainability: Optional[ExplainabilityData] = None
    raw_scores: Dict[str, float] = field(default_factory=dict)
    is_simulation: bool = False

@dataclass
class FindingChangeData:
    finding_type: str
    previous_count: int
    current_count: int
    delta: int
    change_percentage: float
    description: str

@dataclass
class ProgressionData:
    status: str  # 'STABLE', 'IMPROVING', 'POSSIBLE_PROGRESSION', 'SIGNIFICANT_CHANGE', 'INSUFFICIENT_DATA'
    confidence: float
    changes: List[FindingChangeData] = field(default_factory=list)
    summary: str = ''
    velocity_assessment: str = 'NORMAL'  # 'NORMAL', 'MODERATE', 'HIGH'

@dataclass
class RiskData:
    risk_level: str  # 'LOW', 'MODERATE', 'HIGH', 'URGENT', 'UNKNOWN'
    risk_score: int  # 0 - 100
    risk_factors: List[str] = field(default_factory=list)
    recommendation: Dict[str, Any] = field(default_factory=dict)
    is_prototype_score: bool = True


# Abstract Provider Interfaces

class BaseRetinalAIProvider(ABC):
    """Abstract interface for Diabetic Retinopathy prediction models."""
    
    @abstractmethod
    def analyze(self, image_path: str, context: Optional[Dict[str, Any]] = None) -> AIResultData:
        """Runs multi-lesion detection, stage classification, and confidence estimation."""
        pass

class BaseImageQualityProvider(ABC):
    """Abstract interface for pre-screening optical image quality check."""
    
    @abstractmethod
    def assess(self, image_path: str) -> QualityAssessmentData:
        """Evaluates sharpness, illumination, contrast, and motion blur artifacts."""
        pass

class BaseProgressionProvider(ABC):
    """Abstract interface for longitudinal comparison and lesion delta tracking."""
    
    @abstractmethod
    def compare_screenings(
        self,
        previous_findings: List[FindingData],
        current_findings: List[FindingData],
        previous_stage: str,
        current_stage: str,
        interval_months: int = 6
    ) -> ProgressionData:
        """Calculates lesion velocity and possible disease progression."""
        pass
