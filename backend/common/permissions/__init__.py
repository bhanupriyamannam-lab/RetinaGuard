"""Role-based and organization-scoped permission classes."""

from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminUserRole(BasePermission):
    """Allows access only to users with ADMIN role or staff status."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )

class IsDoctor(BasePermission):
    """Allows access to Doctors and Administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ('DOCTOR', 'ADMIN') or request.user.is_staff)
        )

class IsHealthcareWorker(BasePermission):
    """Allows access to Healthcare Workers, Doctors, and Administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ('HEALTHCARE_WORKER', 'DOCTOR', 'ADMIN', 'SCREENING_OPERATOR') or request.user.is_staff)
        )

class IsScreeningOperator(BasePermission):
    """Allows access to Screening Operators, HCWs, Doctors, Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ('SCREENING_OPERATOR', 'HEALTHCARE_WORKER', 'DOCTOR', 'ADMIN') or request.user.is_staff)
        )

class IsPatient(BasePermission):
    """Allows access to Patients viewing their own profile."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'PATIENT'
        )

class HasOrganizationAccess(BasePermission):
    """
    Ensures that a user can only access records belonging to their authorized organization(s),
    unless they have global administrator privileges.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or user.role == 'ADMIN':
            return True

        # Check if the object is an organization
        if hasattr(obj, 'memberships'):
            return obj.memberships.filter(user=user, is_active=True).exists()

        # Check if object has direct organization attribute
        obj_org = getattr(obj, 'organization', None)
        if obj_org is None and hasattr(obj, 'patient'):
            obj_org = getattr(obj.patient, 'organization', None)
        elif obj_org is None and hasattr(obj, 'screening'):
            obj_org = getattr(obj.screening, 'organization', None)

        if obj_org is None:
            return True  # Object is not organization-scoped

        # Verify user has active membership in obj_org
        return user.organization_memberships.filter(organization=obj_org, is_active=True).exists()
