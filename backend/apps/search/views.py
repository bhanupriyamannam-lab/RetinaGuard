"""Global Multi-Entity Search API."""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter
from apps.patients.models import Patient
from apps.screenings.models import ScreeningSession
from apps.referrals.models import Referral
from common.utilities import api_response

class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Global multi-entity search across Patients, Screenings, and Referrals",
        parameters=[OpenApiParameter('q', str, description='Search keyword (e.g. Anita, RG-1042, SCR-2026, Visakha)')]
    )
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return api_response(data={'patients': [], 'screenings': [], 'referrals': []})

        # 1. Search Patients
        patients = Patient.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(patient_code__icontains=query) |
            Q(phone__icontains=query) |
            Q(village__icontains=query)
        )[:10]

        patient_results = [
            {
                'id': str(p.id),
                'patient_code': p.patient_code,
                'display_id': p.display_id,
                'full_name': p.full_name,
                'age': p.age,
                'gender': p.gender,
                'risk_level': p.current_risk_level,
                'severity': p.current_severity,
                'village': p.village
            }
            for p in patients
        ]

        # 2. Search Screenings
        screenings = ScreeningSession.objects.filter(
            Q(screening_code__icontains=query) |
            Q(patient__first_name__icontains=query) |
            Q(patient__last_name__icontains=query) |
            Q(patient__patient_code__icontains=query)
        ).select_related('patient')[:10]

        screening_results = [
            {
                'id': str(s.id),
                'screening_code': s.screening_code,
                'patient_name': s.patient.full_name,
                'patient_code': s.patient.patient_code,
                'status': s.status,
                'screening_date': str(s.screening_date)
            }
            for s in screenings
        ]

        # 3. Search Referrals
        referrals = Referral.objects.filter(
            Q(patient__first_name__icontains=query) |
            Q(patient__last_name__icontains=query) |
            Q(hospital_name__icontains=query) |
            Q(specialist_name__icontains=query)
        ).select_related('patient')[:10]

        referral_results = [
            {
                'id': str(r.id),
                'patient_name': r.patient.full_name,
                'hospital_name': r.hospital_name,
                'specialist_name': r.specialist_name,
                'priority': r.priority,
                'status': r.status,
                'target_date': str(r.target_date)
            }
            for r in referrals
        ]

        return api_response(data={
            'query': query,
            'patients': patient_results,
            'screenings': screening_results,
            'referrals': referral_results,
            'total_matches': len(patient_results) + len(screening_results) + len(referral_results)
        })
