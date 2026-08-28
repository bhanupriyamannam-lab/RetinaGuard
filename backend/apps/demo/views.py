"""Demo Scenarios and Live Demonstration APIs."""

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema
from common.utilities import api_response

DEMO_SCENARIOS = {
    'healthy': {
        'id': 'healthy',
        'title': 'Scenario 1: Healthy Non-Pathological Fundus',
        'patient_code': 'RG-1088',
        'patient_name': 'Rajesh Patel',
        'age': 44,
        'ai_prediction': 'NO_DR',
        'confidence': 0.984,
        'optical_quality': 'GOOD',
        'findings_count': 0,
        'risk_level': 'LOW',
        'risk_score': 12,
        'recommendation': 'Annual Screening Recall (365 Days)',
        'description': 'Normal fundus examination with intact foveal reflex and sharp optic disc margins.'
    },
    'moderate_dr': {
        'id': 'moderate_dr',
        'title': 'Scenario 2: Baseline Moderate NPDR',
        'patient_code': 'RG-1051',
        'patient_name': 'Ramesh Kumar',
        'age': 58,
        'ai_prediction': 'MODERATE_DR',
        'confidence': 0.918,
        'optical_quality': 'GOOD',
        'findings_count': 4,
        'risk_level': 'MODERATE',
        'risk_score': 54,
        'recommendation': '6-Month Surveillance & Glycemic Optimization',
        'description': '3 isolated microaneurysms and 1 dot hemorrhage along superior arcade.'
    },
    'progression': {
        'id': 'progression',
        'title': 'Scenario 3: Longitudinal Progression (Anita Rao #RG-1042)',
        'patient_code': 'RG-1042',
        'patient_name': 'Anita Rao',
        'age': 52,
        'ai_prediction': 'MODERATE_DR (Rapid Progression)',
        'confidence': 0.942,
        'optical_quality': 'GOOD',
        'findings_count': 7,
        'risk_level': 'HIGH',
        'risk_score': 88,
        'recommendation': 'Specialist Referral within 14 Days',
        'description': '+5 new microaneurysms, +3 flame hemorrhages, and early lipid exudates near macula perifovea.'
    },
    'poor_quality': {
        'id': 'poor_quality',
        'title': 'Scenario 4: Optical QC Failure (Motion Blur)',
        'patient_code': 'RG-1099',
        'patient_name': 'Test Retake Patient',
        'age': 60,
        'ai_prediction': None,
        'confidence': 0.0,
        'optical_quality': 'POOR',
        'issues': ['MOTION_BLUR', 'LOW_BRIGHTNESS'],
        'recommendation': 'RETAKE_IMAGE',
        'description': 'AI inference automatically prevented due to sub-optimal focus. Operator prompted to retake.'
    },
    'offline_sync': {
        'id': 'offline_sync',
        'title': 'Scenario 5: Offline Health Camp Sync Simulation',
        'device_id': 'CAMP-TAB-VISAKHA-04',
        'records_staged': 4,
        'idempotency_support': True,
        'description': 'Simulates synchronization of 4 offline records captured in remote rural village without cellular connection.'
    }
}

class DemoScenariosListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(summary="List available demo test scenarios for hackathon presentations")
    def get(self, request):
        return api_response(data=list(DEMO_SCENARIOS.values()))


class DemoScenarioDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(summary="Get specific demo test scenario payload")
    def get(self, request, scenario_id):
        scenario = DEMO_SCENARIOS.get(scenario_id.lower())
        if not scenario:
            return api_response(success=False, message='Scenario not found', status_code=404)
        return api_response(data=scenario)
