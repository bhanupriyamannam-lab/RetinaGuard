"""Explainability and AI Analysis Endpoints."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from apps.retinal_analysis.models import AIAnalysis, ExplainabilityResult
from apps.screenings.serializers import AIAnalysisSerializer, ExplainabilityResultSerializer
from common.permissions import HasOrganizationAccess
from common.utilities import api_response

class AIAnalysisViewSet(viewsets.ReadOnlyModelViewSet):
    """
    AI Analysis and Explainable AI (Grad-CAM) query endpoints.
    """
    queryset = AIAnalysis.objects.select_related('screening__organization', 'retinal_image').prefetch_related('findings', 'explainability').all()
    serializer_class = AIAnalysisSerializer
    permission_classes = [IsAuthenticated, HasOrganizationAccess]

    @extend_schema(summary="Get Grad-CAM explainability heatmap overlay and contributing anatomical regions")
    @action(detail=True, methods=['get'])
    def explanation(self, request, pk=None):
        analysis = self.get_object()
        if not hasattr(analysis, 'explainability'):
            return api_response(success=False, message='Explainability assets not generated for this analysis.', status_code=status.HTTP_404_NOT_FOUND)

        serializer = ExplainabilityResultSerializer(analysis.explainability, context={'request': request})
        return api_response(data=serializer.data)
