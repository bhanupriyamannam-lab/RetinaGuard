"""Custom exceptions and DRF global exception handler."""

import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException, ValidationError, AuthenticationFailed, NotAuthenticated, PermissionDenied, NotFound
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

class RetinaGuardBaseException(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'An unexpected clinical platform error occurred.'
    default_code = 'error'

    def __init__(self, detail=None, code=None, status_code=None):
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail=detail, code=code)

class ImageProcessingError(RetinaGuardBaseException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Failed to process retinal fundus image.'
    default_code = 'image_processing_error'

class AIProviderError(RetinaGuardBaseException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'The AI inference provider is temporarily unavailable.'
    default_code = 'ai_provider_error'

class SyncConflictError(RetinaGuardBaseException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Synchronization conflict: Server record has newer modifications.'
    default_code = 'sync_conflict'

class OrganizationAccessDenied(PermissionDenied):
    default_detail = 'Access to records from this healthcare organization is unauthorized.'
    default_code = 'organization_access_denied'

def custom_exception_handler(exc, context):
    """
    Standardized API response format for all errors:
    {
        "success": false,
        "data": null,
        "message": "Human readable error summary",
        "errors": { ... }
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        errors = {}
        message = 'Request processing failed.'

        if isinstance(exc, ValidationError):
            message = 'Validation error occurred.'
            errors = response.data
        elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
            message = getattr(exc, 'detail', 'Authentication credentials were not provided or are invalid.')
            errors = {'auth': [str(message)]}
        elif isinstance(exc, PermissionDenied):
            message = getattr(exc, 'detail', 'You do not have permission to perform this action.')
            errors = {'permission': [str(message)]}
        elif isinstance(exc, NotFound):
            message = getattr(exc, 'detail', 'Requested resource was not found.')
            errors = {'not_found': [str(message)]}
        elif isinstance(exc, RetinaGuardBaseException):
            message = str(exc.detail) if hasattr(exc, 'detail') else exc.default_detail
            errors = {'detail': [message]}
        else:
            if isinstance(response.data, dict):
                errors = response.data
                message = response.data.get('detail', str(message))
            else:
                errors = {'detail': response.data}

        response.data = {
            'success': False,
            'data': None,
            'message': str(message),
            'errors': errors
        }
        return response

    # Unhandled 500 error
    logger.exception('Unhandled exception in API request: %s', exc)
    return Response(
        {
            'success': False,
            'data': None,
            'message': 'An internal server error occurred. Please contact the clinical engineering team.',
            'errors': {'internal_error': [str(exc)]}
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
