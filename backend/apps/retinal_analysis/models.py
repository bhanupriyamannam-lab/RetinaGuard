"""
Diagnostic Assessment Models:
- Optical Image Quality Assessment
- AI Analysis & Diabetic Retinopathy Severity Classification
- Anatomical Retinal Findings & Bounding Regions
- Explainable AI (Grad-CAM) Visual Attributions
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.screenings.models import ScreeningSession, RetinalImage

class ImageQualityAssessment(models.Model):
    """Automated pre-screening optical assessment of fundus images."""

    class QualityRating(models.TextChoices):
        GOOD = 'GOOD', _('Good Quality / Diagnostic Resolution')
        ACCEPTABLE = 'ACCEPTABLE', _('Acceptable Quality')
        POOR = 'POOR', _('Poor Quality / Motion Blur Detected')

    class Recommendation(models.TextChoices):
        ACCEPT = 'ACCEPT', _('Proceed to AI Inference')
        RETAKE = 'RETAKE', _('Retake Retinal Image Before Inference')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    retinal_image = models.OneToOneField(RetinalImage, on_delete=models.CASCADE, related_name='quality_assessment')
    overall_quality = models.CharField(max_length=20, choices=QualityRating.choices, default=QualityRating.GOOD, db_index=True)
    sharpness = models.PositiveIntegerField(default=90, help_text=_('Sharpness score 0-100'))
    brightness = models.PositiveIntegerField(default=90, help_text=_('Brightness score 0-100'))
    contrast = models.PositiveIntegerField(default=90, help_text=_('Contrast score 0-100'))
    retinal_visibility = models.PositiveIntegerField(default=95, help_text=_('Retinal visibility percentage 0-100'))
    field_of_view = models.PositiveIntegerField(default=45, help_text=_('Field of View in degrees e.g. 45'))
    issues = models.JSONField(default=list, blank=True, help_text=_('List of detected optical defects e.g. ["MOTION_BLUR"]'))
    recommendation = models.CharField(max_length=20, choices=Recommendation.choices, default=Recommendation.ACCEPT)
    algorithm_version = models.CharField(max_length=50, default='OpenCV-v2.4')
    assessed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Image Quality Assessment')
        verbose_name_plural = _('Image Quality Assessments')

    def __str__(self):
        return f"Quality: {self.overall_quality} ({self.sharpness}% Sharpness) -> {self.recommendation}"


class AIAnalysis(models.Model):
    """Multi-layer deep neural network diagnostic assessment record."""

    class Status(models.TextChoices):
        QUEUED = 'QUEUED', _('Queued for Processing')
        PROCESSING = 'PROCESSING', _('Inference Running')
        COMPLETED = 'COMPLETED', _('Inference Completed')
        FAILED = 'FAILED', _('Inference Failed')

    class Stage(models.TextChoices):
        NO_DR = 'NO_DR', _('No Apparent Diabetic Retinopathy')
        MILD = 'MILD', _('Mild Non-Proliferative DR')
        MODERATE = 'MODERATE', _('Moderate Non-Proliferative DR')
        SEVERE = 'SEVERE', _('Severe Non-Proliferative DR')
        PROLIFERATIVE = 'PROLIFERATIVE', _('Proliferative Diabetic Retinopathy')
        UNDETERMINED = 'UNDETERMINED', _('Undetermined / Inconclusive')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    screening = models.ForeignKey(ScreeningSession, on_delete=models.CASCADE, related_name='ai_analyses', db_index=True)
    retinal_image = models.ForeignKey(RetinalImage, on_delete=models.SET_NULL, null=True, blank=True, related_name='analyses')
    provider = models.CharField(max_length=50, default='mock', help_text=_('AI provider backend name: mock, local, external_api'))
    model_name = models.CharField(max_length=150, default='RetinaGuard-DeepVision-Ensemble')
    model_version = models.CharField(max_length=50, default='v2.4')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETED, db_index=True)
    predicted_stage = models.CharField(max_length=30, choices=Stage.choices, default=Stage.NO_DR, db_index=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, default=0.9420, help_text=_('Prediction confidence 0.0000 - 1.0000'))
    processing_time_ms = models.PositiveIntegerField(default=180, help_text=_('Inference duration in milliseconds'))
    raw_scores = models.JSONField(default=dict, blank=True, help_text=_('Per-class probability distribution dictionary'))
    error_message = models.TextField(blank=True, null=True)
    is_simulation = models.BooleanField(default=False, help_text=_('Flagged true if run via mock demo provider'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('AI Analysis')
        verbose_name_plural = _('AI Analyses')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.screening.screening_code} - {self.predicted_stage} ({float(self.confidence)*100:.1f}%)"


class RetinalFinding(models.Model):
    """Individual pathological biomarker detected by the AI model with spatial coordinates."""

    class FindingType(models.TextChoices):
        MICROANEURYSM = 'MICROANEURYSM', _('Microaneurysm (Focal capillary dilation)')
        HEMORRHAGE = 'HEMORRHAGE', _('Flame / Blot Retinal Hemorrhage')
        EXUDATE = 'EXUDATE', _('Hard Lipid Exudate Cluster')
        COTTON_WOOL_SPOT = 'COTTON_WOOL_SPOT', _('Cotton Wool Spot (Nerve fiber infarction)')
        NEOVASCULARIZATION = 'NEOVASCULARIZATION', _('Neovascularization (NVD / NVE Abnormal Vessel Tuft)')
        OTHER = 'OTHER', _('Other Microvascular Alteration')

    class Severity(models.TextChoices):
        TRACE = 'TRACE', _('Trace / Isolated')
        MILD = 'MILD', _('Mild')
        MODERATE = 'MODERATE', _('Moderate')
        SEVERE = 'SEVERE', _('Severe / Confluent')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ai_analysis = models.ForeignKey(AIAnalysis, on_delete=models.CASCADE, related_name='findings', db_index=True)
    finding_type = models.CharField(max_length=30, choices=FindingType.choices, default=FindingType.MICROANEURYSM, db_index=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, default=0.9100)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.MILD)
    
    # Normalized bounding box coordinates (0.0 to 1.0)
    x = models.FloatField(default=0.0, help_text=_('Normalized horizontal origin coordinate 0.0 - 1.0'))
    y = models.FloatField(default=0.0, help_text=_('Normalized vertical origin coordinate 0.0 - 1.0'))
    width = models.FloatField(default=0.05, help_text=_('Normalized width 0.0 - 1.0'))
    height = models.FloatField(default=0.05, help_text=_('Normalized height 0.0 - 1.0'))
    area = models.FloatField(default=0.0, help_text=_('Pixel area measurement'))
    eye_side = models.CharField(max_length=10, default='RIGHT')
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _('Retinal Finding')
        verbose_name_plural = _('Retinal Findings')

    def __str__(self):
        return f"{self.finding_type} ({self.severity}) @ ({self.x:.2f}, {self.y:.2f})"


class ExplainabilityResult(models.Model):
    """Explainable AI (XAI) feature attribution and Grad-CAM visual heatmaps."""

    class Method(models.TextChoices):
        GRAD_CAM = 'GRAD_CAM', _('Gradient-weighted Class Activation Mapping (Grad-CAM)')
        GRAD_CAM_PLUS_PLUS = 'GRAD_CAM_PLUS_PLUS', _('Grad-CAM++ (High resolution multi-scale)')
        INTEGRATED_GRADIENTS = 'INTEGRATED_GRADIENTS', _('Axiomatic Integrated Gradients')
        OCCLUSION = 'OCCLUSION', _('Perturbation Occlusion Sensitivity')
        OTHER = 'OTHER', _('Other Attribution Architecture')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ai_analysis = models.OneToOneField(AIAnalysis, on_delete=models.CASCADE, related_name='explainability')
    method = models.CharField(max_length=40, choices=Method.choices, default=Method.GRAD_CAM)
    heatmap_path = models.CharField(max_length=255, blank=True, null=True, help_text=_('Relative media path to standalone heatmap image'))
    overlay_path = models.CharField(max_length=255, blank=True, null=True, help_text=_('Relative media path to blended fundus overlay'))
    regions = models.JSONField(default=list, blank=True, help_text=_('List of top contributing anatomical regions with coordinates'))
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Explainability Result')
        verbose_name_plural = _('Explainability Results')

    def __str__(self):
        return f"XAI: {self.method} for Analysis {self.ai_analysis_id}"
