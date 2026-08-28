from rest_framework.views import APIView
from rest_framework import permissions
from drf_spectacular.utils import extend_schema, OpenApiParameter
from apps.analytics.services import AnalyticsService
from common.utilities import api_response

class DashboardAnalyticsView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Key Performance Indicators (KPIs) for Overview Dashboard",
        parameters=[OpenApiParameter('days', int, description='Time window in days (default 30)')]
    )
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        data = AnalyticsService.get_dashboard_kpis(days=days)
        return api_response(data=data)


class ScreeningTrendsAnalyticsView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Longitudinal Screening Volume and Referral Trends",
        parameters=[OpenApiParameter('days', int, description='Trend horizon in days (default 14)')]
    )
    def get(self, request):
        days = int(request.query_params.get('days', 14))
        data = AnalyticsService.get_screening_trends(days=days)
        return api_response(data=data)


class SeverityDistributionAnalyticsView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Diabetic Retinopathy Stage Prevalence and Severity Distribution")
    def get(self, request):
        data = AnalyticsService.get_severity_distribution()
        return api_response(data=data)


class ReferralAnalyticsView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Specialist Referral Pipeline and Hospital Distribution Metrics")
    def get(self, request):
        data = AnalyticsService.get_referral_analytics()
        return api_response(data=data)


class FollowupAnalyticsView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Follow-up Adherence and Recall Channel Analytics")
    def get(self, request):
        data = AnalyticsService.get_followup_analytics()
        return api_response(data=data)
