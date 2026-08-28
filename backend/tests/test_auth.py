"""Tests for JWT Authentication, Registration, and Roles."""

import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_user_registration():
    client = APIClient()
    payload = {
        'email': 'nurse.test@retinaguard.ai',
        'password': 'Password123!',
        'password_confirm': 'Password123!',
        'first_name': 'Test',
        'last_name': 'Nurse',
        'role': 'HEALTHCARE_WORKER',
        'phone': '+91 99999 88888'
    }
    response = client.post('/api/v1/auth/register/', payload, format='json')
    assert response.status_code == 201
    assert response.data['success'] is True
    assert 'access' in response.data['data']
    assert 'refresh' in response.data['data']
    assert response.data['data']['user']['email'] == 'nurse.test@retinaguard.ai'

@pytest.mark.django_db
def test_user_login():
    User.objects.create_user(email='doctor.test@retinaguard.ai', password='DocPassword123!', role='DOCTOR')
    client = APIClient()
    response = client.post('/api/v1/auth/login/', {
        'email': 'doctor.test@retinaguard.ai',
        'password': 'DocPassword123!'
    }, format='json')
    assert response.status_code == 200
    assert response.data['success'] is True
    assert 'access' in response.data['data']

@pytest.mark.django_db
def test_me_endpoint_requires_auth():
    client = APIClient()
    response = client.get('/api/v1/auth/me/')
    assert response.status_code == 401
    assert response.data['success'] is False
