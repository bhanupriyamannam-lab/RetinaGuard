"""Storage abstraction service for medical images and AI assets."""

import os
import uuid
from pathlib import Path
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

class StorageService:
    """
    Modular storage service supporting local filesystem in development
    and S3/Cloud storage backends in production.
    """

    @staticmethod
    def get_upload_path(instance, filename, subfolder='retinal_images'):
        ext = filename.split('.')[-1].lower() if '.' in filename else 'jpg'
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        return os.path.join(subfolder, unique_name)

    @staticmethod
    def save_bytes(content_bytes: bytes, filename: str, subfolder: str = 'assets') -> str:
        """Saves raw byte stream and returns stored relative path."""
        path = os.path.join(subfolder, filename)
        saved_path = default_storage.save(path, ContentFile(content_bytes))
        return saved_path

    @staticmethod
    def get_absolute_url(relative_path: str, request=None) -> str:
        """Constructs full absolute URL for a media asset."""
        if not relative_path:
            return ''
        if relative_path.startswith(('http://', 'https://')):
            return relative_path
        
        media_url = settings.MEDIA_URL
        if not media_url.endswith('/'):
            media_url += '/'
        clean_path = relative_path.lstrip('/')
        url = f"{media_url}{clean_path}"
        
        if request is not None:
            return request.build_absolute_uri(url)
        return url
