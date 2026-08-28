"""Screening Session and Retinal Image Serializers."""

from rest_framework import serializers
from apps.screenings.models import ScreeningSession, RetinalImage
from apps.retinal_analysis.models import ImageQualityAssessment, AIAnalysis, RetinalFinding, ExplainabilityResult
from apps.risk.models import RiskAssessment
from common.storage import StorageService
from common.validators import validate_retinal_image

class ImageQualityAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageQualityAssessment
        fields = [
            'id', 'overall_quality', 'sharpness', 'brightness', 'contrast',
            'retinal_visibility', 'field_of_view', 'issues', 'recommendation',
            'algorithm_version', 'assessed_at'
        ]


class RetinalImageSerializer(serializers.ModelSerializer):
    quality_assessment = ImageQualityAssessmentSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = RetinalImage
        fields = [
            'id', 'screening', 'image', 'image_url', 'eye_side', 'capture_device',
            'captured_at', 'original_filename', 'file_size', 'mime_type',
            'file_hash', 'status', 'quality_assessment'
        ]
        read_only_fields = ['id', 'captured_at', 'file_size', 'mime_type', 'file_hash', 'status', 'image_url']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return StorageService.get_absolute_url(obj.image.name, request=request)
        return None

    def validate_image(self, value):
        meta = validate_retinal_image(value)
        return value


class RetinalFindingSerializer(serializers.ModelSerializer):
    location = serializers.SerializerMethodField()

    class Meta:
        model = RetinalFinding
        fields = ['id', 'finding_type', 'confidence', 'severity', 'location', 'eye_side', 'metadata']

    def get_location(self, obj):
        return {
            'x': obj.x,
            'y': obj.y,
            'width': obj.width,
            'height': obj.height,
            'area': obj.area
        }


class ExplainabilityResultSerializer(serializers.ModelSerializer):
    heatmap_url = serializers.SerializerMethodField()
    overlay_url = serializers.SerializerMethodField()

    class Meta:
        model = ExplainabilityResult
        fields = ['id', 'method', 'heatmap_url', 'overlay_url', 'regions', 'metadata', 'created_at']

    def get_heatmap_url(self, obj):
        request = self.context.get('request')
        return StorageService.get_absolute_url(obj.heatmap_path, request=request)

    def get_overlay_url(self, obj):
        request = self.context.get('request')
        return StorageService.get_absolute_url(obj.overlay_path, request=request)


class AIAnalysisSerializer(serializers.ModelSerializer):
    findings = RetinalFindingSerializer(many=True, read_only=True)
    explainability = ExplainabilityResultSerializer(read_only=True)

    class Meta:
        model = AIAnalysis
        fields = [
            'id', 'screening', 'provider', 'model_name', 'model_version',
            'status', 'predicted_stage', 'confidence', 'processing_time_ms',
            'findings', 'explainability', 'is_simulation', 'created_at'
        ]


class RiskAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskAssessment
        fields = ['id', 'risk_level', 'risk_score', 'risk_factors', 'recommendation', 'is_prototype_score', 'assessed_at']


try:
    from apps.patients.serializers import SafeOrganizationField
except ImportError:
    from patients.serializers import SafeOrganizationField
from apps.organizations.models import Organization

class ScreeningSessionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_code = serializers.CharField(source='patient.patient_code', read_only=True)
    organization = SafeOrganizationField(queryset=Organization.objects.all(), required=False, allow_null=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    images = RetinalImageSerializer(many=True, read_only=True)
    latest_ai_analysis = serializers.SerializerMethodField()
    risk_assessment = RiskAssessmentSerializer(read_only=True)

    class Meta:
        model = ScreeningSession
        fields = [
            'id', 'screening_code', 'patient', 'patient_code', 'patient_name',
            'screening_camp', 'performed_by', 'organization', 'organization_name',
            'status', 'screening_date', 'notes', 'images', 'latest_ai_analysis',
            'risk_assessment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'screening_code', 'created_at', 'updated_at', 'screening_date', 'latest_ai_analysis']

    def get_latest_ai_analysis(self, obj):
        analysis = obj.ai_analyses.order_by('-created_at').first()
        if analysis:
            return AIAnalysisSerializer(analysis, context=self.context).data
        return None
