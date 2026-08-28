"""
Global URL Configuration for RetinaGuard Backend.
Exposes Versioned REST API endpoints under /api/v1/ and OpenAPI Documentation.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.patients.views import PatientViewSet

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Production health check endpoint."""
    return Response({
        "status": "ok",
        "service": "RetinaGuard Clinical AI Platform API",
        "version": "1.0.0",
        "environment": "production" if not settings.DEBUG else "development"
    })

api_v1_patterns = [
    path('health/', health_check, name='health-check'),
    path('auth/', include('apps.accounts.urls')),
    path('organizations/', include('apps.organizations.urls')),
    path('camps/', include('apps.health_camps.urls')),
    path('patients/', include('apps.patients.urls')),
    path('screenings/', include('apps.screenings.urls')),
    path('', include('apps.retinal_analysis.urls')),
    path('triage/', include('apps.triage.urls')),
    path('referrals/', include('apps.referrals.urls')),
    path('followups/', include('apps.followups.urls')),
    path('sync/', include('apps.synchronization.urls')),
    path('notifications/', include('apps.notifications.urls')),
    path('', include('apps.audit.urls')),
    path('analytics/', include('apps.analytics.urls')),
    path('search/', include('apps.search.urls')),
    path('demo/', include('apps.demo.urls')),
]

urlpatterns = [
    # Top-level and versioned health checks
    path('health/', health_check, name='top-health-check'),
    path('api/v1/health/', health_check, name='api-v1-health-check'),

    # Django Admin Panel
    path('admin/', admin.site.urls),

    # Versioned API Endpoints
    path('api/v1/', include(api_v1_patterns)),

    # OpenAPI Schema & Interactive Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve Media and Static Files in Development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
