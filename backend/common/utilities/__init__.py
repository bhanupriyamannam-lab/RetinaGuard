"""Utility functions and response formatters."""

from rest_framework.response import Response
from rest_framework import status

def api_response(data=None, message=None, success=True, status_code=status.HTTP_200_OK, errors=None):
    """
    Standardized RetinaGuard API envelope format:
    {
        "success": true/false,
        "data": { ... },
        "message": "Optional message",
        "errors": null or { ... }
    }
    """
    payload = {
        'success': success,
        'data': data,
        'message': message,
    }
    if not success and errors is not None:
        payload['errors'] = errors
    elif not success:
        payload['errors'] = {'detail': [message or 'An error occurred']}
    
    return Response(payload, status=status_code)
