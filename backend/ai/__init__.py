"""
RetinaGuard AI Platform Factory.
Dynamically resolves AI and quality assessment providers based on settings.
"""

from django.conf import settings
from ai.base import (
    BaseRetinalAIProvider,
    BaseImageQualityProvider,
    BaseProgressionProvider
)
from ai.mock_provider import (
    MockRetinalAIProvider,
    MockImageQualityProvider,
    MockProgressionProvider
)
from ai.model_provider import (
    LocalModelRetinalAIProvider,
    OpenCVImageQualityProvider
)

def get_retinal_ai_provider() -> BaseRetinalAIProvider:
    """Returns active DR classification & lesion detection provider."""
    provider_name = getattr(settings, 'AI_PROVIDER', 'mock').lower()
    if provider_name == 'local':
        return LocalModelRetinalAIProvider(model_path=getattr(settings, 'AI_MODEL_PATH', None))
    return MockRetinalAIProvider()

def get_image_quality_provider() -> BaseImageQualityProvider:
    """Returns active optical image quality assessment provider."""
    provider_name = getattr(settings, 'AI_PROVIDER', 'mock').lower()
    if provider_name == 'local':
        return OpenCVImageQualityProvider()
    return MockImageQualityProvider()

def get_progression_provider() -> BaseProgressionProvider:
    """Returns active longitudinal comparison provider."""
    return MockProgressionProvider()
