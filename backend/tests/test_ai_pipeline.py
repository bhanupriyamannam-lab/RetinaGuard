"""Tests for AI Screening Pipeline, Optical QC, and Progression Analysis."""

import pytest
import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization, OrganizationMembership
from apps.patients.models import Patient
from apps.screenings.models import ScreeningSession, RetinalImage
from ai.pipeline import ScreeningPipelineService

User = get_user_model()

def generate_test_image_file():
    img = Image.new('RGB', (512, 512), color=(180, 50, 20))
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    return SimpleUploadedFile("test_fundus.jpg", buffer.getvalue(), content_type="image/jpeg")

@pytest.fixture
def screening_setup():
    user = User.objects.create_user(email='tech.test@retinaguard.ai', password='Password123!', role='HEALTHCARE_WORKER')
    org = Organization.objects.create(name='Test PHC', code='TPHC-01')
    OrganizationMembership.objects.create(user=user, organization=org, role_in_org='HEALTHCARE_WORKER')
    patient = Patient.objects.create(
        patient_code='RG-8888',
        first_name='Anand',
        last_name='Kumar',
        age=52,
        organization=org
    )
    screening = ScreeningSession.objects.create(
        screening_code='SCR-TEST-01',
        patient=patient,
        organization=org,
        performed_by=user
    )
    retinal_img = RetinalImage.objects.create(
        screening=screening,
        image=generate_test_image_file(),
        eye_side='RIGHT'
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client, screening, retinal_img

@pytest.mark.django_db
def test_screening_pipeline_execution(screening_setup):
    client, screening, retinal_img = screening_setup
    result = ScreeningPipelineService.process_screening(
        screening_id=str(screening.id),
        scenario_override='MODERATE'
    )

    assert result['status'] == 'ANALYZED'
    assert result['ai']['stage'] == 'MODERATE'
    assert result['ai']['confidence'] > 0.8
    assert len(result['findings']) > 0
    assert result['risk']['level'] in ('MODERATE', 'HIGH', 'URGENT')
    assert 'explanation' in result
    assert result['explanation']['method'] == 'GRAD_CAM'

@pytest.mark.django_db
def test_analyze_endpoint(screening_setup):
    client, screening, retinal_img = screening_setup
    response = client.post(f'/api/v1/screenings/{screening.id}/analyze/', {'scenario': 'HEALTHY'}, format='json')
    assert response.status_code == 200
    assert response.data['success'] is True
    assert response.data['data']['ai']['stage'] == 'NO_DR'
