"""Tests for Referrals, Follow-ups, and Analytics."""

import pytest
from datetime import date, timedelta
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization, OrganizationMembership
from apps.patients.models import Patient
from apps.referrals.models import Referral
from apps.followups.models import FollowUp

User = get_user_model()

@pytest.fixture
def clinical_env():
    user = User.objects.create_user(email='dr.clinic@retinaguard.ai', password='Password123!', role='DOCTOR')
    org = Organization.objects.create(name='District Eye Hospital', code='DEH-01')
    OrganizationMembership.objects.create(user=user, organization=org, role_in_org='DOCTOR')
    patient = Patient.objects.create(patient_code='RG-REF-1', first_name='Sita', last_name='Kumari', organization=org)
    client = APIClient()
    client.force_authenticate(user=user)
    return client, user, org, patient

@pytest.mark.django_db
def test_referral_lifecycle_and_transition(clinical_env):
    client, user, org, patient = clinical_env
    
    # 1. Create referral
    create_resp = client.post('/api/v1/referrals/', {
        'patient': str(patient.id),
        'hospital_name': 'Visakha Regional Eye Hospital',
        'specialist_name': 'Dr. Arvind Swaminathan',
        'priority': 'URGENT',
        'status': 'REFERRED'
    }, format='json')
    assert create_resp.status_code == 201
    assert create_resp.data['success'] is True
    ref_id = create_resp.data['data']['id']

    # 2. Advance status
    patch_resp = client.patch(f'/api/v1/referrals/{ref_id}/', {
        'status': 'APPOINTMENT_BOOKED',
        'notes': 'Appointment scheduled for Friday'
    }, format='json')
    assert patch_resp.status_code == 200
    assert patch_resp.data['data']['status'] == 'APPOINTMENT_BOOKED'

@pytest.mark.django_db
def test_followup_sms_trigger(clinical_env):
    client, user, org, patient = clinical_env
    followup = FollowUp.objects.create(
        patient=patient,
        due_date=date.today(),
        status='UPCOMING',
        assigned_to=user
    )
    sms_resp = client.post(f'/api/v1/followups/{followup.id}/trigger_sms/')
    assert sms_resp.status_code == 200
    assert sms_resp.data['success'] is True
    assert sms_resp.data['data']['status'] == 'DISPATCHED'

@pytest.mark.django_db
def test_analytics_endpoints(clinical_env):
    client, user, org, patient = clinical_env
    
    # Dashboard KPIs
    kpi_resp = client.get('/api/v1/analytics/dashboard/')
    assert kpi_resp.status_code == 200
    assert kpi_resp.data['success'] is True
    assert 'total_screened' in kpi_resp.data['data']

    # Severity distribution
    sev_resp = client.get('/api/v1/analytics/severity/')
    assert sev_resp.status_code == 200
    assert len(sev_resp.data['data']) > 0
