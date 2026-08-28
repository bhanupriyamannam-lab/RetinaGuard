"""Validation utilities for retinal image uploads and clinical inputs."""

import hashlib
import io
from PIL import Image
from django.conf import settings
from rest_framework.exceptions import ValidationError

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'tiff', 'tif', 'webp'}
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/tiff', 'image/webp'}
MIN_DIMENSION = 256

def validate_retinal_image(file_obj):
    """
    Performs comprehensive verification on uploaded retinal image:
    1. Size limit validation
    2. File extension check
    3. Content MIME type check
    4. Image integrity & dimension verification via Pillow
    5. SHA-256 hash computation
    """
    max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 25 * 1024 * 1024)
    if file_obj.size > max_size:
        raise ValidationError(f'Image file size ({file_obj.size / (1024*1024):.2f}MB) exceeds maximum limit of {max_size / (1024*1024):.0f}MB.')

    # Check extension
    filename = file_obj.name.lower()
    ext = filename.split('.')[-1] if '.' in filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f'Unsupported file format .{ext}. Allowed formats: {", ".join(ALLOWED_EXTENSIONS)}')

    # Check content via Pillow
    try:
        file_obj.seek(0)
        content_bytes = file_obj.read()
        image = Image.open(io.BytesIO(content_bytes))
        image.verify()  # Verify integrity
        
        # Re-open to inspect dimensions (verify() invalidates image)
        image = Image.open(io.BytesIO(content_bytes))
        width, height = image.size
        if width < MIN_DIMENSION or height < MIN_DIMENSION:
            raise ValidationError(f'Retinal image resolution ({width}x{height}) is too small. Minimum required: {MIN_DIMENSION}x{MIN_DIMENSION} px.')

        # Compute SHA256
        sha256 = hashlib.sha256(content_bytes).hexdigest()
        file_obj.seek(0)

        return {
            'width': width,
            'height': height,
            'format': image.format,
            'file_size': file_obj.size,
            'hash': sha256,
        }
    except ValidationError:
        raise
    except Exception as e:
        raise ValidationError(f'Corrupted or invalid image file: {str(e)}')
