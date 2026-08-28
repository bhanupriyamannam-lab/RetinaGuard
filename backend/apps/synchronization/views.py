"""Synchronization Serializers and Batch API View."""

from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from apps.synchronization.models import SyncRecord
from apps.synchronization.services import SyncService
from common.utilities import api_response

class SyncItemSerializer(serializers.Serializer):
    idempotency_key = serializers.CharField(max_length=100)
    entity_type = serializers.ChoiceField(choices=['PATIENT', 'SCREENING', 'IMAGE', 'REFERRAL', 'FOLLOWUP'])
    operation = serializers.ChoiceField(choices=['CREATE', 'UPDATE'], default='CREATE')
    client_timestamp = serializers.CharField(required=False)
    payload = serializers.DictField()


class BatchSyncRequestSerializer(serializers.Serializer):
    device_id = serializers.CharField(max_length=100)
    records = SyncItemSerializer(many=True)


class SyncRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncRecord
        fields = [
            'id', 'idempotency_key', 'device_id', 'entity_type', 'entity_id',
            'operation', 'client_timestamp', 'server_timestamp', 'sync_status',
            'payload', 'server_response_data', 'error_message'
        ]
        read_only_fields = ['id', 'server_timestamp']


class BatchSyncView(APIView):
    """
    Idempotent Offline-First Synchronization Endpoint.
    Accepts batch changes recorded during rural camps and securely reconciles with central database.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Synchronize offline field records with guaranteed idempotency and conflict resolution",
        request=BatchSyncRequestSerializer,
        responses={200: serializers.DictField}
    )
    def post(self, request):
        serializer = BatchSyncRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(success=False, errors=serializer.errors, status_code=400)

        device_id = serializer.validated_data['device_id']
        records = serializer.validated_data['records']

        # Determine user organization
        org = None
        membership = request.user.organization_memberships.filter(is_active=True).first()
        if membership:
            org = membership.organization
        elif hasattr(request.user, 'registered_patients') and request.user.registered_patients.exists():
            org = request.user.registered_patients.first().organization

        if not org:
            from apps.organizations.models import Organization
            org = Organization.objects.first()

        results = SyncService.process_sync_batch(
            user=request.user,
            organization=org,
            device_id=device_id,
            records=records
        )

        successful_count = sum(1 for r in results if r.get('status') == 'SYNCED')
        failed_count = sum(1 for r in results if r.get('status') == 'FAILED')

        return api_response(
            data={
                'total_submitted': len(records),
                'successful': successful_count,
                'failed': failed_count,
                'results': results
            },
            message=f"Sync batch processed. {successful_count}/{len(records)} records synced."
        )
