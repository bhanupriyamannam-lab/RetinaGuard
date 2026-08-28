"""Tests for Clinical Triage Priority and Offline Synchronization."""

import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization, OrganizationMembership
from apps.patients.models import Patient
from apps.synchronization.services import SyncService

User = get_user_model()

@pytest.fixture
def test_env():
    user = User.objects.create_user(email='asha.sync@retinaguard.ai', password='Password123!', role='HEALTHCARE_WORKER')
    org = Organization.objects.create(name='Sync PHC', code='SPHC-01')
    OrganizationMembership.objects.create(user=user, organization=org, role_in_org='HEALTHCARE_WORKER')
    client = APIClient()
    client.force_authenticate(user=user)
    return client, user, org

@pytest.mark.django_db
def test_triage_queue_endpoint(test_env):
    client, user, org = test_env
    Patient.objects.create(patient_code='RG-T1', first_name='Triage1', last_name='User', organization=org, current_risk_level='URGENT', current_severity='PROLIFERATIVE_DR')
    Patient.objects.create(patient_code='RG-T2', first_name='Triage2', last_name='User', organization=org, current_risk_level='LOW', current_severity='NO_DR')

    response = client.get('/api/v1/triage/?sort_by=priority')
    assert response.status_code == 200
    assert response.data['success'] is True
    queue = response.data['data']
    assert len(queue) >= 2
    # Critical item should be first
    assert queue[0]['priority_score'] > queue[-1]['priority_score']

@pytest.mark.django_db
def test_offline_batch_sync_idempotency(test_env):
    client, user, org = test_env
    sync_payload = {
        'device_id': 'TABLET-ASHA-01',
        'records': [
            {
                'idempotency_key': 'KEY-UNIQUE-101',
                'entity_type': 'PATIENT',
                'operation': 'CREATE',
                'payload': {
                    'patient_code': 'RG-OFFLINE-1',
                    'first_name': 'Ravi',
                    'last_name': 'Verma',
                    'gender': 'MALE',
                    'age': 55
                }
            }
        ]
    }

    # 1. First sync submission
    resp1 = client.post('/api/v1/sync/', sync_payload, format='json')
    assert resp1.status_code == 200
    assert resp1.data['data']['successful'] == 1
    assert resp1.data['data']['results'][0]['status'] == 'SYNCED'

    # 2. Second identical sync submission (Idempotency replay)
    resp2 = client.post('/api/v1/sync/', sync_payload, format='json')
    assert resp2.status_code == 200
    assert 'Idempotent replay' in resp2.data['data']['results'][0]['message']

    # 3. Verify exactly 1 patient was created in database
    assert Patient.objects.filter(patient_code='RG-OFFLINE-1').count() == 1
