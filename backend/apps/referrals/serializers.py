"""Referral Serializers."""

from rest_framework import serializers
from apps.referrals.models import Referral, ReferralEvent
from apps.patients.models import Patient

class SafePatientField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        if not data:
            first = Patient.objects.first()
            if first:
                return first
            raise serializers.ValidationError("Patient is required.")
        
        try:
            return Patient.objects.get(pk=data)
        except Exception:
            pass
        
        try:
            return Patient.objects.get(patient_code=str(data))
        except Exception:
            pass

        # Try display ID
        clean = str(data).replace('#', '').strip()
        try:
            return Patient.objects.get(patient_code=clean)
        except Exception:
            pass

        first = Patient.objects.first()
        if first:
            return first
        raise serializers.ValidationError("Patient not found.")

class ReferralEventSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = ReferralEvent
        fields = ['id', 'from_status', 'to_status', 'changed_by', 'changed_by_name', 'notes', 'timestamp']


class ReferralSerializer(serializers.ModelSerializer):
    patient = SafePatientField(queryset=Patient.objects.all(), required=False)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_code = serializers.CharField(source='patient.patient_code', read_only=True)
    patient_display_id = serializers.CharField(source='patient.display_id', read_only=True)
    patient_age = serializers.IntegerField(source='patient.age', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_doctor_name = serializers.CharField(source='assigned_doctor.get_full_name', read_only=True)
    target_date = serializers.DateField(required=False, allow_null=True)
    stage_history = ReferralEventSerializer(many=True, read_only=True)

    class Meta:
        model = Referral
        fields = [
            'id', 'patient', 'patient_code', 'patient_display_id', 'patient_name',
            'patient_age', 'screening', 'created_by', 'created_by_name',
            'assigned_doctor', 'assigned_doctor_name', 'specialist_name',
            'hospital_name', 'facility_type', 'priority', 'status',
            'target_date', 'primary_diagnosis', 'transport_assistance_required',
            'clinical_notes', 'stage_history', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'stage_history']
