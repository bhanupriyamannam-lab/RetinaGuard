"""Authentication and Profile Endpoints."""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import authenticate, get_user_model
from drf_spectacular.utils import extend_schema, OpenApiResponse
from apps.accounts.serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    TokenResponseSerializer
)
from common.utilities import api_response
from apps.audit.middleware import AuditLoggingMiddleware

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Register a new healthcare user or patient",
        request=RegisterSerializer,
        responses={201: TokenResponseSerializer}
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)

            AuditLoggingMiddleware.log_action(
                request,
                action='CREATE',
                entity_type='User',
                entity_id=str(user.id),
                metadata={'role': user.role, 'email': user.email}
            )

            data = {
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
            return api_response(data=data, message='User registration successful.', status_code=status.HTTP_201_CREATED)
        return api_response(success=False, message='Registration failed', errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Authenticate with email & password, returns JWT tokens",
        request=LoginSerializer,
        responses={200: TokenResponseSerializer}
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return api_response(success=False, message='Invalid login payload.', errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(request, username=email, password=password)
        if not user:
            # Also attempt lookup by email directly
            user_obj = User.objects.filter(email__iexact=email).first()
            if user_obj and user_obj.check_password(password):
                user = user_obj

        if not user:
            return api_response(
                success=False,
                message='Invalid email or password.',
                errors={'auth': ['Invalid credentials provided.']},
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return api_response(
                success=False,
                message='User account is disabled.',
                errors={'auth': ['Account deactivated. Contact administrator.']},
                status_code=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        AuditLoggingMiddleware.log_action(
            request,
            action='LOGIN',
            entity_type='User',
            entity_id=str(user.id),
            metadata={'email': user.email}
        )

        data = {
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
        return api_response(data=data, message='Authentication successful.')


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get current authenticated user profile",
        responses={200: UserSerializer}
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return api_response(data=serializer.data)

    @extend_schema(
        summary="Update current authenticated user profile",
        request=UserSerializer,
        responses={200: UserSerializer}
    )
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return api_response(data=UserSerializer(user).data, message='Profile updated successfully.')
        return api_response(success=False, errors=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Blacklist refresh token to invalidate session"
    )
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            AuditLoggingMiddleware.log_action(
                request,
                action='LOGOUT',
                entity_type='User',
                entity_id=str(request.user.id)
            )

            return api_response(message='Logout successful.')
        except Exception:
            return api_response(message='Logout completed.')
