# ocr_engine.py

import easyocr
import cv2
import numpy as np
from pdf2image import convert_from_path
import logging

logger = logging.getLogger(__name__)

# Initialize reader with multiple languages: English, Hindi, Marathi  
# This helps handle mixed-language prescriptions (common in India)
try:
    logger.info("Initializing EasyOCR with multi-language support (en, hi, mr)...")
    reader = easyocr.Reader(['en', 'hi', 'mr'], gpu=False)
    logger.info("✓ Multi-language OCR initialized successfully")
except Exception as e:
    logger.warning(f"Could not load Hindi/Marathi models: {e}")
    logger.info("Falling back to English-only OCR...")
    reader = easyocr.Reader(['en'], gpu=False)
    logger.info("✓ English-only OCR initialized")


def preprocess_image(image):
    """
    Enhance image quality for better OCR results
    
    Args:
        image: OpenCV image (numpy array)
        
    Returns:
        Preprocessed image
    """
    # Convert to grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    # Apply denoising
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    
    # Enhance contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    
    # Apply adaptive thresholding to handle uneven lighting
    binary = cv2.adaptiveThreshold(
        enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    # Morphological operations to remove noise
    kernel = np.ones((1, 1), np.uint8)
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
    
    return cleaned


def extract_text(image_path: str):
    """
    Extract text from image with multi-language support and preprocessing
    
    Args:
        image_path: Path to the image file
        
    Returns:
        tuple: (extracted_text, confidence, image_quality, has_handwriting)
    """
    # Load image
    if image_path.lower().endswith(".pdf"):
        pages = convert_from_path(image_path)
        image = np.array(pages[0])
    else:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Invalid image file")

    # Calculate original image quality
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()

    image_quality = "good"
    if variance < 50:
        image_quality = "poor"
    elif variance < 150:
        image_quality = "fair"

    # Preprocess image for better OCR
    processed_image = preprocess_image(image)
    
    # Try OCR on both original and preprocessed images
    results_original = reader.readtext(image)
    results_processed = reader.readtext(processed_image)
    
    # Use whichever gives better confidence
    confidence_original = float(np.mean([r[2] for r in results_original])) if results_original else 0.0
    confidence_processed = float(np.mean([r[2] for r in results_processed])) if results_processed else 0.0
    
    if confidence_processed > confidence_original:
        results = results_processed
        confidence = confidence_processed
    else:
        results = results_original
        confidence = confidence_original
    
    # Extract text, grouping by lines
    extracted_text = " ".join([r[1] for r in results])
    
    # Detect handwriting (lower confidence typically means handwriting)
    has_handwriting = confidence < 0.7

    return extracted_text, confidence, image_quality, has_handwriting