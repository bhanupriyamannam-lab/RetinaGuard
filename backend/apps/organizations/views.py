"""Organization Serializers and Views."""

from rest_framework import serializers, viewsets, status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from apps.organizations.models import Organization, OrganizationMembership
from common.permissions import IsAdminUserRole, HasOrganizationAccess
from common.utilities import api_response

class OrganizationSerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'code', 'org_type', 'address', 'city',
            'district', 'state', 'contact_email', 'contact_phone',
            'is_active', 'members_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'members_count']

    def get_members_count(self, obj):
        return obj.memberships.filter(is_active=True).count()


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = ['id', 'user', 'user_email', 'user_name', 'organization', 'role_in_org', 'is_active', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Healthcare Organizations.
    Enforces organization isolation.
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, HasOrganizationAccess]
    filterset_fields = ['org_type', 'district', 'state', 'is_active']
    search_fields = ['name', 'code', 'district', 'city']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'ADMIN':
            return Organization.objects.all()
        return Organization.objects.filter(memberships__user=user, memberships__is_active=True).distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return api_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            org = serializer.save()
            # Automatically add creator as admin
            OrganizationMembership.objects.create(
                user=request.user,
                organization=org,
                role_in_org='ADMIN'
            )
            return api_response(data=OrganizationSerializer(org).data, message='Organization created.', status_code=status.HTTP_201_CREATED)
        return api_response(success=False, errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
