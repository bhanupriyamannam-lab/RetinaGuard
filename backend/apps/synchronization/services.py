"""
Offline Synchronization Engine.
Provides strict idempotency, conflict detection, and batch data reconciliation.
"""

import logging
from typing import List, Dict, Any
from django.db import transaction
from django.utils import timezone
from apps.synchronization.models import SyncRecord
from apps.patients.models import Patient
from apps.screenings.models import ScreeningSession
from apps.referrals.models import Referral
from apps.followups.models import FollowUp

logger = logging.getLogger(__name__)

class SyncService:
    """Processes batch synchronization payloads from offline ASHA mobile clients."""

    @classmethod
    @transaction.atomic
    def process_sync_batch(
        cls,
        user,
        organization,
        device_id: str,
        records: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []

        for item in records:
            idempotency_key = item.get('idempotency_key')
            entity_type = item.get('entity_type')
            operation = item.get('operation', 'CREATE')
            client_timestamp_str = item.get('client_timestamp')
            payload = item.get('payload', {})

            if not idempotency_key:
                results.append({
                    'idempotency_key': None,
                    'status': 'FAILED',
                    'error': 'Missing required field: idempotency_key'
                })
                continue

            # Check Idempotency: Has this exact transaction been processed before?
            existing_sync = SyncRecord.objects.filter(idempotency_key=idempotency_key).first()
            if existing_sync:
                results.append({
                    'idempotency_key': idempotency_key,
                    'entity_type': existing_sync.entity_type,
                    'entity_id': existing_sync.entity_id,
                    'status': existing_sync.sync_status,
                    'server_timestamp': existing_sync.server_timestamp.isoformat(),
                    'data': existing_sync.server_response_data,
                    'message': 'Idempotent replay: record already synchronized.'
                })
                continue

            # Process entity synchronization
            try:
                entity_id = None
                server_data = {}
                sync_status = SyncRecord.SyncStatus.SYNCED
                error_msg = None

                client_ts = timezone.now()
                if client_timestamp_str:
                    try:
                        client_ts = timezone.datetime.fromisoformat(client_timestamp_str.replace('Z', '+00:00'))
                    except Exception:
                        pass

                if entity_type == 'PATIENT':
                    patient_code = payload.get('patient_code')
                    first_name = payload.get('first_name', 'Unnamed')
                    last_name = payload.get('last_name', 'Patient')
                    
                    existing_patient = Patient.objects.filter(patient_code=patient_code).first()

                    # Conflict detection: If server record is newer than offline client edit, protect server state
                    if existing_patient and operation == 'UPDATE' and existing_patient.updated_at > client_ts:
                        sync_status = SyncRecord.SyncStatus.CONFLICT
                        entity_id = str(existing_patient.id)
                        server_data = {
                            'patient_id': str(existing_patient.id),
                            'patient_code': existing_patient.patient_code,
                            'display_id': existing_patient.display_id,
                            'conflict': True,
                            'server_updated_at': existing_patient.updated_at.isoformat(),
                            'client_timestamp': client_ts.isoformat(),
                        }
                    else:
                        patient, created = Patient.objects.update_or_create(
                            patient_code=patient_code,
                            defaults={
                                'first_name': first_name,
                                'last_name': last_name,
                                'gender': payload.get('gender', 'FEMALE'),
                                'age': payload.get('age', 45),
                                'phone': payload.get('phone', ''),
                                'village': payload.get('village', 'Rural Camp'),
                                'organization': organization,
                                'diabetes_type': payload.get('diabetes_type', 'TYPE_2'),
                                'diabetes_duration_years': payload.get('diabetes_duration_years', 5),
                                'hba1c': payload.get('hba1c', 7.5),
                                'created_by': user
                            }
                        )
                        entity_id = str(patient.id)
                        server_data = {
                            'patient_id': str(patient.id),
                            'patient_code': patient.patient_code,
                            'display_id': patient.display_id
                        }

                elif entity_type == 'REFERRAL':
                    patient_id = payload.get('patient_id')
                    patient = Patient.objects.filter(id=patient_id).first() or Patient.objects.filter(patient_code=patient_id).first()
                    if not patient:
                        raise ValueError(f"Patient {patient_id} not found for referral sync")

                    referral = Referral.objects.create(
                        patient=patient,
                        created_by=user,
                        hospital_name=payload.get('hospital_name', 'Visakha Government Regional Eye Hospital'),
                        specialist_name=payload.get('specialist_name', 'Dr. Arvind Swaminathan'),
                        priority=payload.get('priority', 'URGENT'),
                        status=payload.get('status', 'REFERRED'),
                        primary_diagnosis=payload.get('primary_diagnosis', 'Moderate NPDR Progression'),
                        transport_assistance_required=payload.get('transport_assistance_required', True),
                        clinical_notes=payload.get('clinical_notes', 'Synced from offline ASHA health camp')
                    )
                    entity_id = str(referral.id)
                    server_data = {
                        'referral_id': str(referral.id),
                        'status': referral.status
                    }

                elif entity_type == 'FOLLOWUP':
                    patient_id = payload.get('patient_id')
                    patient = Patient.objects.filter(id=patient_id).first() or Patient.objects.filter(patient_code=patient_id).first()
                    if not patient:
                        raise ValueError(f"Patient {patient_id} not found for follow-up sync")

                    followup = FollowUp.objects.create(
                        patient=patient,
                        due_date=payload.get('due_date', timezone.now().date()),
                        status=payload.get('status', 'UPCOMING'),
                        priority=payload.get('priority', 'ROUTINE'),
                        recall_channel=payload.get('recall_channel', 'SMS'),
                        notes=payload.get('notes', 'Synced from offline camp device')
                    )
                    entity_id = str(followup.id)
                    server_data = {
                        'followup_id': str(followup.id),
                        'status': followup.status
                    }
                else:
                    raise ValueError(f"Unsupported sync entity type: {entity_type}")

                # Save SyncRecord
                sync_record = SyncRecord.objects.create(
                    idempotency_key=idempotency_key,
                    device_id=device_id,
                    user=user,
                    organization=organization,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    operation=operation,
                    client_timestamp=client_ts,
                    sync_status=sync_status,
                    payload=payload,
                    server_response_data=server_data,
                    error_message=error_msg
                )

                results.append({
                    'idempotency_key': idempotency_key,
                    'entity_type': entity_type,
                    'entity_id': entity_id,
                    'status': sync_status,
                    'server_timestamp': sync_record.server_timestamp.isoformat(),
                    'data': server_data,
                    'message': 'Record successfully synchronized to central hospital cloud.'
                })

            except Exception as e:
                logger.error(f"Sync error for key {idempotency_key}: {e}")
                SyncRecord.objects.create(
                    idempotency_key=idempotency_key,
                    device_id=device_id,
                    user=user,
                    organization=organization,
                    entity_type=entity_type or 'PATIENT',
                    entity_id=None,
                    operation=operation,
                    client_timestamp=timezone.now(),
                    sync_status=SyncRecord.SyncStatus.FAILED,
                    payload=payload,
                    error_message=str(e)
                )
                results.append({
                    'idempotency_key': idempotency_key,
                    'status': 'FAILED',
                    'error': str(e)
                })

        return results
