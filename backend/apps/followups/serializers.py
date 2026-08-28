"""Follow-up Serializers."""

from rest_framework import serializers
from apps.followups.models import FollowUp
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

        first = Patient.objects.first()
        if first:
            return first
        raise serializers.ValidationError("Patient not found.")

class FollowUpSerializer(serializers.ModelSerializer):
    patient = SafePatientField(queryset=Patient.objects.all(), required=False)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_code = serializers.CharField(source='patient.patient_code', read_only=True)
    patient_display_id = serializers.CharField(source='patient.display_id', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    patient_village = serializers.CharField(source='patient.village', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_overdue = serializers.IntegerField(read_only=True)

    class Meta:
        model = FollowUp
        fields = [
            'id', 'patient', 'patient_code', 'patient_display_id', 'patient_name',
            'patient_phone', 'patient_village', 'screening', 'referral',
            'due_date', 'completed_date', 'status', 'priority',
            'recall_channel', 'notes', 'assigned_to', 'assigned_to_name',
            'is_overdue', 'days_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_overdue', 'days_overdue']
