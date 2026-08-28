"""
Image preprocessing pipelines for retinal fundus photography.
Provides illumination normalization, CLAHE contrast equalization, and circular mask extraction.
"""

import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

class RetinalPreprocessor:
    """Standard pre-processing pipeline for retinal fundus images."""

    @staticmethod
    def load_image(image_path: str) -> np.ndarray:
        """Loads image via OpenCV in BGR format."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to load retinal image from path: {image_path}")
        return img

    @staticmethod
    def enhance_contrast(bgr_img: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple = (8, 8)) -> np.ndarray:
        """
        Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)
        to the L-channel of LAB color space to enhance microaneurysms without color distortion.
        """
        lab = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
        cl = clahe.apply(l)
        
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        return enhanced

    @staticmethod
    def crop_circular_mask(bgr_img: np.ndarray, tolerance: int = 7) -> np.ndarray:
        """
        Detects circular boundary of 45° macular field and crops background noise.
        """
        gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
        mask = gray > tolerance
        
        # Check if mask is non-empty
        if not np.any(mask):
            return bgr_img
            
        # Find bounding box of foreground
        coords = np.argwhere(mask)
        x0, y0 = coords.min(axis=0)
        x1, y1 = coords.max(axis=0) + 1
        
        cropped = bgr_img[x0:x1, y0:y1]
        return cropped

    @staticmethod
    def normalize_for_model(bgr_img: np.ndarray, target_size: tuple = (512, 512)) -> np.ndarray:
        """
        Resizes to target resolution and normalizes pixel values to [0.0, 1.0].
        """
        resized = cv2.resize(bgr_img, target_size, interpolation=cv2.INTER_AREA)
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        normalized = rgb.astype(np.float32) / 255.0
        return normalized
