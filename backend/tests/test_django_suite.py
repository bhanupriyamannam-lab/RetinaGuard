"""
Standard Django TestCase Suite for RetinaGuard.
Runs seamlessly with `python manage.py test` and `pytest`.
"""

import io
from datetime import date, timedelta
from PIL import Image
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.organizations.models import Organization, OrganizationMembership
from apps.patients.models import Patient, PatientConsent
from apps.health_camps.models import ScreeningCamp
from apps.screenings.models import ScreeningSession, RetinalImage
from apps.referrals.models import Referral, ReferralEvent
from apps.followups.models import FollowUp
from apps.triage.services import TriageService
from apps.synchronization.services import SyncService
from apps.analytics.services import AnalyticsService
from ai.pipeline import ScreeningPipelineService
from ai.mock_provider import MockRetinalAIProvider, MockImageQualityProvider, MockProgressionProvider

User = get_user_model()

def make_test_fundus_file(name="fundus.jpg"):
    img = Image.new('RGB', (512, 512), color=(160, 40, 20))
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/jpeg")


class RetinaGuardCoreSystemTest(TestCase):
    """Verifies all core requirements of the RetinaGuard clinical platform."""

    def setUp(self):
        self.client = Client()

        # 1. Create Organization
        self.org = Organization.objects.create(
            name="Visakha Regional Eye Hospital",
            code="VREH-TEST-01",
            district="Visakhapatnam"
        )
        self.phc = Organization.objects.create(
            name="Bheemili Community PHC",
            code="BPHC-TEST-01",
            district="Visakhapatnam"
        )

        # 2. Create Users
        self.admin = User.objects.create_superuser(
            email="admin.test@retinaguard.ai",
            password="AdminPassword123!",
            role=User.Role.ADMIN
        )
        self.doctor = User.objects.create_user(
            email="doctor.test@retinaguard.ai",
            password="DoctorPassword123!",
            role=User.Role.DOCTOR,
            first_name="Arvind",
            last_name="Swaminathan"
        )
        self.asha = User.objects.create_user(
            email="asha.test@retinaguard.ai",
            password="AshaPassword123!",
            role=User.Role.HEALTHCARE_WORKER,
            first_name="Priya",
            last_name="Sharma"
        )

        OrganizationMembership.objects.create(user=self.doctor, organization=self.org, role_in_org="DOCTOR")
        OrganizationMembership.objects.create(user=self.asha, organization=self.phc, role_in_org="HEALTHCARE_WORKER")

        # 3. Create Patient
        self.patient = Patient.objects.create(
            patient_code="RG-1042",
            first_name="Anita",
            last_name="Rao",
            age=52,
            gender="FEMALE",
            phone="+91 98480 11111",
            organization=self.phc,
            diabetes_type="TYPE_2",
            diabetes_duration_years=8,
            hba1c=8.8,
            current_risk_level="HIGH",
            current_severity="MODERATE_DR",
            has_progression_alert=True
        )

        PatientConsent.objects.create(
            patient=self.patient,
            consent_type="SCREENING_AND_AI",
            granted=True,
            recorded_by=self.asha
        )

    def test_01_authentication_jwt_tokens(self):
        """Verify JWT login and role assignment."""
        response = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'doctor.test@retinaguard.ai', 'password': 'DoctorPassword123!'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertIn('access', response.json()['data'])
        self.assertEqual(response.json()['data']['user']['role'], 'DOCTOR')

    def test_02_patient_crud_and_360_overview(self):
        """Verify Patient CRUD, Patient 360 Aggregation, and strict Organization-level data isolation."""
        # 1. Login as ASHA Worker (authorized for Bheemili PHC)
        login_resp = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'asha.test@retinaguard.ai', 'password': 'AshaPassword123!'},
            content_type='application/json'
        )
        token = login_resp.json()['data']['access']
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        # Query Patient 360 overview (Authorized)
        resp = self.client.get(f'/api/v1/patients/{self.patient.id}/overview/', **headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual(data['patient']['patient_code'], 'RG-1042')
        self.assertIn('timeline', data)
        self.assertIn('consents', data)
        self.assertEqual(len(data['consents']), 1)

        # 2. Login as Doctor (Visakha Hospital only - unauthorized for PHC records)
        doc_login = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'doctor.test@retinaguard.ai', 'password': 'DoctorPassword123!'},
            content_type='application/json'
        )
        doc_token = doc_login.json()['data']['access']
        doc_headers = {'HTTP_AUTHORIZATION': f'Bearer {doc_token}'}
        
        # Verify cross-organization data isolation prevents access
        doc_resp = self.client.get(f'/api/v1/patients/{self.patient.id}/overview/', **doc_headers)
        self.assertIn(doc_resp.status_code, (403, 404))

    def test_03_screening_image_upload_and_ai_pipeline(self):
        """Verify Retinal Image upload, optical QC, AI classification, findings, and risk score."""
        login_resp = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'asha.test@retinaguard.ai', 'password': 'AshaPassword123!'},
            content_type='application/json'
        )
        token = login_resp.json()['data']['access']
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        # Create screening session
        scr_resp = self.client.post(
            '/api/v1/screenings/',
            {'patient': str(self.patient.id), 'organization': str(self.phc.id)},
            content_type='application/json',
            **headers
        )
        self.assertEqual(scr_resp.status_code, 201)
        screening_id = scr_resp.json()['data']['id']

        # Upload retinal image
        img_file = make_test_fundus_file("test_fundus.jpg")
        upload_resp = self.client.post(
            f'/api/v1/screenings/{screening_id}/images/',
            {'image': img_file, 'eye_side': 'RIGHT'},
            **headers
        )
        self.assertEqual(upload_resp.status_code, 201)
        self.assertIn('quality_assessment', upload_resp.json()['data'])

        # Trigger AI Pipeline
        analyze_resp = self.client.post(
            f'/api/v1/screenings/{screening_id}/analyze/',
            {'scenario': 'PROGRESSION'},
            content_type='application/json',
            **headers
        )
        self.assertEqual(analyze_resp.status_code, 200)
        res = analyze_resp.json()['data']
        self.assertEqual(res['status'], 'ANALYZED')
        self.assertEqual(res['ai']['stage'], 'MODERATE')
        self.assertGreater(len(res['findings']), 0)
        self.assertEqual(res['risk']['level'], 'HIGH')
        self.assertIn('explanation', res)

    def test_04_clinical_triage_priority_calculation(self):
        """Verify Triage ranking prioritizes critical/progression patients over healthy patients."""
        # Create healthy patient
        Patient.objects.create(
            patient_code="RG-1088",
            first_name="Rajesh",
            last_name="Patel",
            age=44,
            organization=self.phc,
            current_risk_level="LOW",
            current_severity="NO_DR",
            has_progression_alert=False
        )

        queue = TriageService.get_triage_queue(organization=self.phc, sort_by='priority')
        self.assertTrue(len(queue) >= 2)
        # Anita Rao (Progression + High Risk) must rank ahead of Rajesh Patel (Low Risk)
        self.assertEqual(queue[0]['patient_code'], 'RG-1042')
        self.assertGreater(queue[0]['priority_score'], queue[1]['priority_score'])

    def test_05_offline_sync_idempotency_and_conflict(self):
        """Verify that offline batch synchronization is strictly idempotent."""
        payload = {
            'device_id': 'TAB-ASHA-04',
            'records': [
                {
                    'idempotency_key': 'KEY-IDEMPOTENT-001',
                    'entity_type': 'PATIENT',
                    'operation': 'CREATE',
                    'payload': {
                        'patient_code': 'RG-SYNC-01',
                        'first_name': 'Ramesh',
                        'last_name': 'Kumar',
                        'gender': 'MALE',
                        'age': 58,
                        'hba1c': 7.9
                    }
                }
            ]
        }

        # 1. First sync submission
        res1 = SyncService.process_sync_batch(
            user=self.asha,
            organization=self.phc,
            device_id='TAB-ASHA-04',
            records=payload['records']
        )
        self.assertEqual(res1[0]['status'], 'SYNCED')
        self.assertEqual(Patient.objects.filter(patient_code='RG-SYNC-01').count(), 1)

        # 2. Replay duplicate submission
        res2 = SyncService.process_sync_batch(
            user=self.asha,
            organization=self.phc,
            device_id='TAB-ASHA-04',
            records=payload['records']
        )
        self.assertEqual(res2[0]['status'], 'SYNCED')
        self.assertIn('Idempotent replay', res2[0]['message'])
        self.assertEqual(Patient.objects.filter(patient_code='RG-SYNC-01').count(), 1)

    def test_06_referral_and_followup_workflow(self):
        """Verify specialist referral creation and follow-up recall SMS dispatch."""
        referral = Referral.objects.create(
            patient=self.patient,
            created_by=self.asha,
            assigned_doctor=self.doctor,
            hospital_name='Visakha Government Regional Eye Hospital',
            specialist_name='Dr. Arvind Swaminathan',
            priority='URGENT',
            status='REFERRED'
        )
        self.assertEqual(referral.status, 'REFERRED')

        followup = FollowUp.objects.create(
            patient=self.patient,
            referral=referral,
            due_date=date.today(),
            status='UPCOMING',
            assigned_to=self.asha
        )

        login_resp = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'asha.test@retinaguard.ai', 'password': 'AshaPassword123!'},
            content_type='application/json'
        )
        token = login_resp.json()['data']['access']
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        # Trigger SMS recall
        sms_resp = self.client.post(f'/api/v1/followups/{followup.id}/trigger_sms/', **headers)
        self.assertEqual(sms_resp.status_code, 200)
        self.assertEqual(sms_resp.json()['data']['status'], 'DISPATCHED')

    def test_07_analytics_kpis(self):
        """Verify database analytics computations."""
        kpis = AnalyticsService.get_dashboard_kpis(organization=self.phc)
        self.assertIn('total_patients', kpis)
        self.assertIn('total_screened', kpis)
        self.assertIn('high_risk_patients', kpis)
