"""Tests for Patient CRUD, Patient 360 Aggregation, and Consents."""

import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization, OrganizationMembership
from apps.patients.models import Patient

User = get_user_model()

@pytest.fixture
def auth_client():
    user = User.objects.create_user(email='doctor.pat@retinaguard.ai', password='Password123!', role='DOCTOR')
    org = Organization.objects.create(name='Test Eye Hospital', code='TEH-01')
    OrganizationMembership.objects.create(user=user, organization=org, role_in_org='DOCTOR')
    client = APIClient()
    client.force_authenticate(user=user)
    return client, user, org

@pytest.mark.django_db
def test_create_and_list_patients(auth_client):
    client, user, org = auth_client
    payload = {
        'patient_code': 'RG-9999',
        'first_name': 'Suresh',
        'last_name': 'Rao',
        'age': 50,
        'gender': 'MALE',
        'phone': '+91 98480 99999',
        'organization': str(org.id),
        'diabetes_type': 'TYPE_2',
        'diabetes_duration_years': 6,
        'hba1c': 8.2
    }
    response = client.post('/api/v1/patients/', payload, format='json')
    assert response.status_code == 201
    assert response.data['success'] is True
    assert response.data['data']['patient_code'] == 'RG-9999'

    # List
    list_resp = client.get('/api/v1/patients/')
    assert list_resp.status_code == 200
    assert list_resp.data['success'] is True

@pytest.mark.django_db
def test_patient_360_overview(auth_client):
    client, user, org = auth_client
    patient = Patient.objects.create(
        patient_code='RG-7777',
        first_name='Kavita',
        last_name='Reddy',
        age=48,
        organization=org,
        hba1c=7.8
    )
    response = client.get(f'/api/v1/patients/{patient.id}/overview/')
    assert response.status_code == 200
    assert response.data['success'] is True
    data = response.data['data']
    assert 'patient' in data
    assert 'timeline' in data
    assert 'consents' in data
    assert data['patient']['first_name'] == 'Kavita'
