"""Analytics URL routing."""

from django.urls import path
from apps.analytics.views import (
    DashboardAnalyticsView,
    ScreeningTrendsAnalyticsView,
    SeverityDistributionAnalyticsView,
    ReferralAnalyticsView,
    FollowupAnalyticsView
)

urlpatterns = [
    path('dashboard/', DashboardAnalyticsView.as_view(), name='analytics_dashboard'),
    path('screenings/', ScreeningTrendsAnalyticsView.as_view(), name='analytics_screenings'),
    path('severity/', SeverityDistributionAnalyticsView.as_view(), name='analytics_severity'),
    path('referrals/', ReferralAnalyticsView.as_view(), name='analytics_referrals'),
    path('followups/', FollowupAnalyticsView.as_view(), name='analytics_followups'),
]
