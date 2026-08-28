import uuid
from rest_framework import serializers
from .models import Patient
try:
    from apps.organizations.models import Organization
except ImportError:
    from organizations.models import Organization

class SafeOrganizationField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        try:
            return super().to_internal_value(data)
        except Exception:
            org = Organization.objects.first()
            if not org:
                org = Organization.objects.create(
                    name="RetinaGuard Clinical Center",
                    code="RG-MAIN",
                    district="Visakhapatnam"
                )
            return org

class PatientSerializer(serializers.ModelSerializer):
    patient_code = serializers.CharField(required=False, allow_blank=True, default="")
    organization = SafeOrganizationField(
        queryset=Organization.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        from datetime import date

        # 1. Auto-generate patient_code in YYYY/DD/MM/number format (starting with 0)
        if not validated_data.get('patient_code'):
            today = date.today()
            count = Patient.objects.count()
            validated_data['patient_code'] = f"{today.year:04d}/{today.day:02d}/{today.month:02d}/{count}"

        # 2. Auto-assign default organization if missing
        if not validated_data.get('organization'):
            default_org = Organization.objects.first()
            if not default_org:
                default_org = Organization.objects.create(
                    name="RetinaGuard Clinical Center",
                    code="RG-MAIN",
                    district="Visakhapatnam"
                )
            validated_data['organization'] = default_org

        # 3. Default or derive screening date & risk
        if not validated_data.get('last_screening_date'):
            validated_data['last_screening_date'] = date.today()

        if validated_data.get('current_severity') == 'PROGRESSION':
            validated_data['has_progression_alert'] = True

        hba1c = validated_data.get('hba1c')
        risk = validated_data.get('current_risk_level')
        if not risk or risk == 'LOW':
            if hba1c and float(hba1c) >= 10.0:
                validated_data['current_risk_level'] = 'URGENT'
            elif hba1c and float(hba1c) >= 8.5:
                validated_data['current_risk_level'] = 'HIGH'

        return super().create(validated_data)


class PatientListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or f"Patient {obj.patient_code}"

    class Meta:
        model = Patient
        fields = '__all__'

    def get_full_name(self, obj):
        first = getattr(obj, 'first_name', '') or ''
        last = getattr(obj, 'last_name', '') or ''
        return f"{first} {last}".strip()