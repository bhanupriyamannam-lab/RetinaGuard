"""
RetinaGuard Demo Data Seeder Command.
Populates the database with realistic clinical demonstration data for live presentations.
Usage: python manage.py seed_demo_data
"""

import os
from datetime import date, timedelta
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import cv2

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone

from apps.organizations.models import Organization, OrganizationMembership
from apps.health_camps.models import ScreeningCamp
from apps.patients.models import Patient, PatientConsent
from apps.screenings.models import ScreeningSession, RetinalImage
from apps.retinal_analysis.models import (
    ImageQualityAssessment,
    AIAnalysis,
    RetinalFinding,
    ExplainabilityResult
)
from apps.risk.models import RiskAssessment
from apps.progression.models import ProgressionAssessment, ScreeningEvent
from apps.referrals.models import Referral, ReferralEvent
from apps.followups.models import FollowUp
from apps.notifications.models import Notification
from apps.synchronization.models import SyncRecord
from ai.explainability import GradCAMService
from ai.base import FindingData, FindingLocation

User = get_user_model()

def create_sample_fundus_image(file_path: Path, style: str = 'pathology'):
    """Generates a synthetic realistic 512x512 fundus image asset."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Create base dark orange-red fundus circle
    img = np.zeros((512, 512, 3), dtype=np.uint8)
    center = (256, 256)
    radius = 230
    cv2.circle(img, center, radius, (15, 60, 160), -1)  # BGR orange-red
    
    # Darker foveal area
    cv2.circle(img, (290, 256), 40, (10, 40, 110), -1)
    # Bright optic disc
    cv2.circle(img, (150, 256), 32, (100, 210, 250), -1)

    # Vascular arcades
    cv2.ellipse(img, (230, 256), (150, 100), 0, 190, 350, (20, 20, 110), 3)
    cv2.ellipse(img, (230, 256), (150, 100), 0, 10, 170, (20, 20, 110), 3)

    if style == 'pathology':
        # Add microaneurysms and hemorrhages
        for pt in [(220, 310), (250, 330), (280, 340), (235, 300), (265, 315)]:
            cv2.circle(img, pt, 3, (10, 10, 80), -1)
        # Flame hemorrhages
        cv2.ellipse(img, (240, 335), (14, 6), 30, 0, 360, (10, 10, 70), -1)
        cv2.ellipse(img, (290, 285), (10, 5), -20, 0, 360, (10, 10, 70), -1)
        # Hard exudates (yellow spots)
        cv2.circle(img, (310, 240), 4, (120, 240, 250), -1)
        cv2.circle(img, (325, 248), 3, (120, 240, 250), -1)

    img = cv2.GaussianBlur(img, (3, 3), 1)
    cv2.imwrite(str(file_path), img)


class Command(BaseCommand):
    help = 'Seeds realistic diabetic retinopathy clinical test data for hackathon demonstrations'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Beginning RetinaGuard database seeding...'))

        media_root = Path(settings.MEDIA_ROOT)
        images_dir = media_root / 'retinal_images'
        images_dir.mkdir(parents=True, exist_ok=True)

        # 1. Organizations
        hosp, _ = Organization.objects.get_or_create(
            code='VREH-01',
            defaults={
                'name': 'Visakha Government Regional Eye Hospital',
                'org_type': Organization.OrgType.HOSPITAL,
                'city': 'Visakhapatnam',
                'district': 'Visakhapatnam',
                'state': 'Andhra Pradesh',
                'contact_email': 'telemed@vreh.org.in',
                'contact_phone': '+91 891 2548900'
            }
        )

        phc, _ = Organization.objects.get_or_create(
            code='BPHC-04',
            defaults={
                'name': 'Bheemili Primary Health Centre',
                'org_type': Organization.OrgType.PHC,
                'city': 'Bheemunipatnam',
                'district': 'Visakhapatnam',
                'state': 'Andhra Pradesh',
                'contact_email': 'bheemili.phc@gov.in',
                'contact_phone': '+91 8933 224100'
            }
        )

        self.stdout.write(self.style.SUCCESS(f'Created Organizations: {hosp.name}, {phc.name}'))

        # 2. Users & Roles
        admin_user, _ = User.objects.get_or_create(
            email='admin@retinaguard.ai',
            defaults={
                'username': 'admin',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('admin12345')
        admin_user.save()

        doctor, _ = User.objects.get_or_create(
            email='doctor.swaminathan@retinaguard.ai',
            defaults={
                'username': 'dr_swaminathan',
                'first_name': 'Arvind',
                'last_name': 'Swaminathan',
                'role': User.Role.DOCTOR,
                'license_number': 'APMC-VR-58921',
                'phone': '+91 98480 12345'
            }
        )
        doctor.set_password('doctor12345')
        doctor.save()

        asha_worker, _ = User.objects.get_or_create(
            email='asha.priya@retinaguard.ai',
            defaults={
                'username': 'asha_priya',
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'role': User.Role.HEALTHCARE_WORKER,
                'phone': '+91 94401 67890'
            }
        )
        asha_worker.set_password('worker12345')
        asha_worker.save()

        # Memberships
        OrganizationMembership.objects.get_or_create(user=doctor, organization=hosp, defaults={'role_in_org': 'DOCTOR'})
        OrganizationMembership.objects.get_or_create(user=asha_worker, organization=phc, defaults={'role_in_org': 'HEALTHCARE_WORKER'})
        OrganizationMembership.objects.get_or_create(user=admin_user, organization=hosp, defaults={'role_in_org': 'ADMIN'})

        self.stdout.write(self.style.SUCCESS('Created Platform Users (Admin, Doctor Swaminathan, ASHA Priya)'))

        # 3. Screening Camp
        camp, _ = ScreeningCamp.objects.get_or_create(
            name='Bheemili Community Diabetic Retinopathy Camp 2026',
            organization=phc,
            defaults={
                'location': 'Bheemili Village Community Center, Main Road',
                'district': 'Visakhapatnam',
                'state': 'Andhra Pradesh',
                'start_date': date.today() - timedelta(days=2),
                'end_date': date.today() + timedelta(days=5),
                'target_capacity': 120,
                'status': ScreeningCamp.Status.ACTIVE,
                'coordinator': asha_worker
            }
        )

        # 4. Primary Test Patient: Anita Rao (#RG-1042)
        patient_anita, _ = Patient.objects.get_or_create(
            patient_code='RG-1042',
            defaults={
                'first_name': 'Anita',
                'last_name': 'Rao',
                'date_of_birth': date(1974, 5, 12),
                'age': 52,
                'gender': Patient.Gender.FEMALE,
                'phone': '+91 98492 44102',
                'preferred_language': 'te',
                'village': 'Bheemili Ward 4',
                'district': 'Visakhapatnam',
                'organization': phc,
                'diabetes_type': Patient.DiabetesType.TYPE_2,
                'diabetes_duration_years': 8,
                'hba1c': 8.8,
                'current_risk_level': Patient.RiskLevel.HIGH,
                'current_severity': Patient.Severity.MODERATE_DR,
                'has_progression_alert': True,
                'last_screening_date': date.today(),
                'created_by': asha_worker
            }
        )

        PatientConsent.objects.get_or_create(
            patient=patient_anita,
            consent_type=PatientConsent.ConsentType.SCREENING_AND_AI,
            defaults={'granted': True, 'recorded_by': asha_worker}
        )
        PatientConsent.objects.get_or_create(
            patient=patient_anita,
            consent_type=PatientConsent.ConsentType.DATA_SHARING_SPECIALIST,
            defaults={'granted': True, 'recorded_by': asha_worker}
        )

        # Baseline Screening (6 Months Ago)
        scr_baseline, _ = ScreeningSession.objects.get_or_create(
            screening_code='SCR-2025-0891',
            defaults={
                'patient': patient_anita,
                'organization': phc,
                'status': ScreeningSession.Status.ANALYZED,
                'screening_date': date.today() - timedelta(days=180),
                'performed_by': asha_worker,
                'notes': 'Baseline routine screening at PHC'
            }
        )
        img_baseline_path = images_dir / 'anita_baseline_od.jpg'
        create_sample_fundus_image(img_baseline_path, style='pathology')
        img_baseline, _ = RetinalImage.objects.get_or_create(
            screening=scr_baseline,
            eye_side=RetinalImage.EyeSide.RIGHT,
            defaults={
                'image': f'retinal_images/{img_baseline_path.name}',
                'original_filename': 'anita_baseline_od.jpg',
                'status': RetinalImage.ImageStatus.PROCESSED
            }
        )
        analysis_baseline, _ = AIAnalysis.objects.get_or_create(
            screening=scr_baseline,
            defaults={
                'retinal_image': img_baseline,
                'predicted_stage': 'MODERATE',
                'confidence': 0.9180,
                'processing_time_ms': 195,
                'status': AIAnalysis.Status.COMPLETED,
                'is_simulation': True
            }
        )
        # 3 Microaneurysms baseline
        for i, (x, y) in enumerate([(0.35, 0.54), (0.42, 0.60), (0.48, 0.57)]):
            RetinalFinding.objects.get_or_create(
                ai_analysis=analysis_baseline,
                finding_type='MICROANEURYSM',
                x=x, y=y,
                defaults={'confidence': 0.90, 'severity': 'MILD'}
            )
        # 1 Hemorrhage baseline
        RetinalFinding.objects.get_or_create(
            ai_analysis=analysis_baseline,
            finding_type='HEMORRHAGE',
            x=0.39, y=0.65,
            defaults={'confidence': 0.91, 'severity': 'MODERATE'}
        )

        # Current Screening (Today - Showing Progression)
        scr_current, _ = ScreeningSession.objects.get_or_create(
            screening_code='SCR-2026-1042',
            defaults={
                'patient': patient_anita,
                'screening_camp': camp,
                'organization': phc,
                'status': ScreeningSession.Status.ANALYZED,
                'screening_date': date.today(),
                'performed_by': asha_worker,
                'notes': 'Repeat annual screening at Bheemili health camp'
            }
        )
        img_current_path = images_dir / 'anita_current_od.jpg'
        create_sample_fundus_image(img_current_path, style='pathology')
        img_current, _ = RetinalImage.objects.get_or_create(
            screening=scr_current,
            eye_side=RetinalImage.EyeSide.RIGHT,
            defaults={
                'image': f'retinal_images/{img_current_path.name}',
                'original_filename': 'anita_current_od.jpg',
                'status': RetinalImage.ImageStatus.PROCESSED
            }
        )

        ImageQualityAssessment.objects.get_or_create(
            retinal_image=img_current,
            defaults={
                'overall_quality': 'GOOD',
                'sharpness': 94,
                'brightness': 92,
                'contrast': 90,
                'retinal_visibility': 96,
                'field_of_view': 45,
                'issues': [],
                'recommendation': 'ACCEPT'
            }
        )

        analysis_current, _ = AIAnalysis.objects.get_or_create(
            screening=scr_current,
            defaults={
                'retinal_image': img_current,
                'predicted_stage': 'MODERATE',
                'confidence': 0.9420,
                'processing_time_ms': 182,
                'status': AIAnalysis.Status.COMPLETED,
                'is_simulation': True
            }
        )

        # 8 Microaneurysms, 4 Hemorrhages, 2 Exudates
        curr_findings_data = [
            FindingData(finding_type='MICROANEURYSM', confidence=0.94, severity='MODERATE', location=FindingLocation(x=0.34, y=0.55, width=0.04, height=0.04, area=20)),
            FindingData(finding_type='MICROANEURYSM', confidence=0.91, severity='MODERATE', location=FindingLocation(x=0.39, y=0.59, width=0.04, height=0.04, area=18)),
            FindingData(finding_type='MICROANEURYSM', confidence=0.89, severity='MILD', location=FindingLocation(x=0.45, y=0.63, width=0.03, height=0.03, area=12)),
            FindingData(finding_type='HEMORRHAGE', confidence=0.93, severity='MODERATE', location=FindingLocation(x=0.37, y=0.66, width=0.06, height=0.05, area=30)),
            FindingData(finding_type='HEMORRHAGE', confidence=0.90, severity='MODERATE', location=FindingLocation(x=0.48, y=0.52, width=0.05, height=0.05, area=24)),
            FindingData(finding_type='EXUDATE', confidence=0.91, severity='MILD', location=FindingLocation(x=0.52, y=0.47, width=0.05, height=0.05, area=22)),
            FindingData(finding_type='EXUDATE', confidence=0.88, severity='MILD', location=FindingLocation(x=0.55, y=0.49, width=0.04, height=0.04, area=16)),
        ]
        for f in curr_findings_data:
            RetinalFinding.objects.get_or_create(
                ai_analysis=analysis_current,
                finding_type=f.finding_type,
                x=f.location.x,
                y=f.location.y,
                defaults={
                    'confidence': f.confidence,
                    'severity': f.severity,
                    'width': f.location.width,
                    'height': f.location.height,
                    'area': f.location.area
                }
            )

        # Grad-CAM Explainability
        exp_data = GradCAMService.save_explainability_assets(str(img_current_path), curr_findings_data, 'MODERATE')
        ExplainabilityResult.objects.get_or_create(
            ai_analysis=analysis_current,
            defaults={
                'method': 'GRAD_CAM',
                'heatmap_path': exp_data.heatmap_path,
                'overlay_path': exp_data.overlay_path,
                'regions': [
                    {
                        'id': r.id,
                        'name': r.name,
                        'contribution': r.contribution,
                        'contribution_percentage': r.contribution_percentage,
                        'description': r.description,
                        'coordinates': r.coordinates,
                        'findings_nearby': r.findings_nearby
                    }
                    for r in exp_data.regions
                ],
                'metadata': exp_data.metadata
            }
        )

        # Progression Assessment Record
        ProgressionAssessment.objects.get_or_create(
            current_screening=scr_current,
            defaults={
                'patient': patient_anita,
                'previous_screening': scr_baseline,
                'status': 'POSSIBLE_PROGRESSION',
                'confidence': 0.9420,
                'velocity_assessment': 'HIGH',
                'changes': [
                    {'finding_type': 'MICROANEURYSM', 'previous_count': 3, 'current_count': 8, 'delta': 5, 'change_percentage': 166.7, 'description': '+5 new microaneurysms along inferior temporal arcade.'},
                    {'finding_type': 'HEMORRHAGE', 'previous_count': 1, 'current_count': 4, 'delta': 3, 'change_percentage': 300.0, 'description': '+3 new flame hemorrhages.'},
                    {'finding_type': 'EXUDATE', 'previous_count': 0, 'current_count': 2, 'delta': 2, 'change_percentage': 100.0, 'description': 'New lipid ring emergence near macular perifovea.'}
                ],
                'summary': 'Comparison with baseline scan (6 months prior) indicates accelerated microvascular progression (+10 total lesions). Urgent specialist referral recommended.'
            }
        )

        # Risk Assessment
        RiskAssessment.objects.get_or_create(
            screening=scr_current,
            defaults={
                'patient': patient_anita,
                'risk_level': 'HIGH',
                'risk_score': 88,
                'risk_factors': [
                    'AI Retinopathy Classification: Moderate NPDR',
                    'Active retinal hemorrhages present (4 lesions)',
                    'Lipid exudate deposits observed near macular perifovea',
                    'Longitudinal Progression: Accelerated lesion velocity noted (+10 lesions)',
                    'Elevated HbA1c: 8.8%',
                    'Long diabetes duration (8 years)'
                ],
                'recommendation': {
                    'action': 'SPECIALIST_REFERRAL',
                    'timeframe_days': 14,
                    'target_facility': 'Visakha Government Regional Eye Hospital',
                    'transport_assistance': True,
                    'clinical_guidance': 'Referral for dilated clinical biomicroscopy and optical coherence tomography (OCT).'
                },
                'is_prototype_score': True
            }
        )

        # Referral Record
        referral_anita, _ = Referral.objects.get_or_create(
            patient=patient_anita,
            defaults={
                'screening': scr_current,
                'created_by': asha_worker,
                'assigned_doctor': doctor,
                'specialist_name': 'Dr. Arvind Swaminathan (Vitreoretinal Surgeon)',
                'hospital_name': 'Visakha Government Regional Eye Hospital',
                'facility_type': Referral.FacilityType.TERTIARY_APEX,
                'priority': Referral.Priority.URGENT,
                'status': Referral.Status.REFERRED,
                'target_date': date.today() + timedelta(days=14),
                'primary_diagnosis': 'Moderate NPDR with Rapid Longitudinal Progression & Early DME Threat',
                'transport_assistance_required': True,
                'clinical_notes': 'Patient referred following automated AI progression detection (+5 MA, +3 Hemorrhages, +2 Exudates).'
            }
        )
        ReferralEvent.objects.get_or_create(
            referral=referral_anita,
            from_status='NONE',
            to_status='REFERRED',
            defaults={'changed_by': asha_worker, 'notes': 'Referral initiated via RetinaGuard clinical assessment'}
        )

        # Follow-up Record
        FollowUp.objects.get_or_create(
            patient=patient_anita,
            defaults={
                'screening': scr_current,
                'referral': referral_anita,
                'due_date': date.today() + timedelta(days=14),
                'status': FollowUp.Status.UPCOMING,
                'priority': FollowUp.Priority.URGENT,
                'recall_channel': FollowUp.RecallChannel.SMS,
                'assigned_to': asha_worker,
                'notes': 'Recall scheduled for specialist visit confirmation at Visakha Regional Hospital.'
            }
        )

        # Timeline Events for Anita Rao
        ScreeningEvent.objects.get_or_create(
            patient=patient_anita,
            event_type='SCREENED',
            event_date=date.today() - timedelta(days=180),
            defaults={
                'stage_title': 'Baseline Screening (PHC)',
                'severity': 'MODERATE_DR',
                'risk_level': 'MODERATE',
                'risk_score': 54,
                'summary': 'Initial rural screening. 3 microaneurysms, 1 hemorrhage observed.'
            }
        )
        ScreeningEvent.objects.get_or_create(
            patient=patient_anita,
            event_type='AI_ANALYZED',
            event_date=date.today(),
            defaults={
                'stage_title': 'Possible Longitudinal Progression Detected',
                'severity': 'MODERATE_DR',
                'risk_level': 'HIGH',
                'risk_score': 88,
                'summary': 'AI progression engine identified +10 lesion increase over 6 months.'
            }
        )
        ScreeningEvent.objects.get_or_create(
            patient=patient_anita,
            event_type='REFERRED',
            event_date=date.today(),
            defaults={
                'stage_title': 'Specialist Referral Dispatched',
                'severity': 'MODERATE_DR',
                'risk_level': 'URGENT',
                'risk_score': 88,
                'summary': 'Dispatched referral to Dr. Arvind Swaminathan at Visakha Regional Hospital.'
            }
        )

        # Notification for Anita Rao
        Notification.objects.get_or_create(
            user=asha_worker,
            title='Progression Alert: Anita Rao (#RG-1042)',
            defaults={
                'notification_type': Notification.NotificationType.PROGRESSION_ALERT,
                'message': 'Screening #SCR-2026-1042 classified with Accelerated Progression (Risk Score: 88). Action required within 14 days.',
                'related_entity_type': 'Patient',
                'related_entity_id': str(patient_anita.id)
            }
        )

        # 5. Additional Realistic Test Patients
        patients_meta = [
            ('RG-1051', 'Ramesh', 'Kumar', 58, 'MALE', 7.9, 'MODERATE_DR', 'MODERATE', 54, 'Tagarapuvalasa', False, 'te'),
            ('RG-1088', 'Rajesh', 'Patel', 44, 'MALE', 6.5, 'NO_DR', 'LOW', 12, 'Anandapuram', False, 'hi'),
            ('RG-1031', 'Sunita', 'Verma', 49, 'FEMALE', 9.2, 'SEVERE_DR', 'HIGH', 78, 'Padmanabham', False, 'hi'),
            ('RG-1029', 'Lakshmi', 'Devi', 63, 'FEMALE', 10.4, 'PROLIFERATIVE_DR', 'URGENT', 96, 'Bheemili Ward 2', False, 'te'),
            ('RG-1014', 'Venkata', 'Reddy', 61, 'MALE', 8.1, 'MODERATE_DR', 'MODERATE', 62, 'Chittivalasa', False, 'te'),
            ('RG-1065', 'Kavitha', 'Menon', 47, 'FEMALE', 7.2, 'MILD_DR', 'LOW', 32, 'Kapuluppada', False, 'en'),
            ('RG-1072', 'Manoj', 'Gupta', 55, 'MALE', 8.5, 'MODERATE_DR', 'HIGH', 72, 'Gambheeram', True, 'hi'),
            ('RG-1081', 'Saraswathi', 'Amma', 67, 'FEMALE', 9.8, 'SEVERE_DR', 'HIGH', 84, 'Kothavalasa', False, 'te'),
            ('RG-1090', 'Deepak', 'Joshi', 42, 'MALE', 6.8, 'NO_DR', 'LOW', 15, 'Bheemili Ward 6', False, 'en'),
            ('RG-1095', 'Padma', 'Kumari', 51, 'FEMALE', 8.0, 'MILD_DR', 'MODERATE', 45, 'Endada', False, 'te'),
        ]

        for pcode, fname, lname, age, gender, hba1c, sev, risk, rscore, village, prog_alert, lang in patients_meta:
            pat, _ = Patient.objects.get_or_create(
                patient_code=pcode,
                defaults={
                    'first_name': fname,
                    'last_name': lname,
                    'age': age,
                    'gender': gender,
                    'phone': f'+91 9849{age}{hba1c:.0f}10',
                    'preferred_language': lang,
                    'village': village,
                    'district': 'Visakhapatnam',
                    'organization': phc,
                    'diabetes_type': Patient.DiabetesType.TYPE_2,
                    'diabetes_duration_years': max(3, age - 45),
                    'hba1c': hba1c,
                    'current_risk_level': risk,
                    'current_severity': sev,
                    'has_progression_alert': prog_alert,
                    'last_screening_date': date.today() - timedelta(days=(age % 10)),
                    'created_by': asha_worker
                }
            )

            # Create Overdue Follow-up for test scenario (e.g. Ramesh Kumar)
            if pcode == 'RG-1051':
                FollowUp.objects.get_or_create(
                    patient=pat,
                    defaults={
                        'due_date': date.today() - timedelta(days=12),
                        'status': FollowUp.Status.OVERDUE,
                        'priority': FollowUp.Priority.ROUTINE,
                        'recall_channel': FollowUp.RecallChannel.SMS,
                        'assigned_to': asha_worker,
                        'notes': 'Overdue by 12 days. Automated Telugu recall SMS queued.'
                    }
                )

        # 6. Sample Offline Sync Record
        SyncRecord.objects.get_or_create(
            idempotency_key='SYNC-CAMP-TAB-2026-001',
            defaults={
                'device_id': 'CAMP-TAB-VISAKHA-04',
                'user': asha_worker,
                'organization': phc,
                'entity_type': SyncRecord.EntityType.PATIENT,
                'entity_id': str(patient_anita.id),
                'operation': SyncRecord.Operation.UPDATE,
                'client_timestamp': timezone.now() - timedelta(hours=2),
                'sync_status': SyncRecord.SyncStatus.SYNCED,
                'payload': {'patient_code': 'RG-1042', 'status': 'SCREENED_CAMP'},
                'server_response_data': {'patient_code': 'RG-1042', 'status': 'CONFIRMED'}
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded complete RetinaGuard clinical demo data!'))
        self.stdout.write(self.style.NOTICE('Demonstration Credentials:'))
        self.stdout.write('  - Administrator: admin@retinaguard.ai (password: admin12345)')
        self.stdout.write('  - Ophthalmologist: doctor.swaminathan@retinaguard.ai (password: doctor12345)')
        self.stdout.write('  - Healthcare Worker: asha.priya@retinaguard.ai (password: worker12345)')
        self.stdout.write('  - Test Patient: Anita Rao (#RG-1042)')
