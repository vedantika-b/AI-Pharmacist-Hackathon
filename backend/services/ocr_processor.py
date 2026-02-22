"""
OCR Service Integration - Process prescription images and extract medication data
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional
import tempfile
import base64
import os
import logging

logger = logging.getLogger(__name__)

# Add OCR module to path
ocr_path = Path(__file__).parent.parent.parent / "ocr"
if ocr_path.exists():
    sys.path.insert(0, str(ocr_path))

try:
    from ocr_service import process_prescription_image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logger.warning("OCR module not available - prescription image processing disabled")


class OCRProcessor:
    """Process prescription images using OCR"""
    
    @staticmethod
    def process_image(image_data: bytes, filename: str = "prescription.jpg") -> Dict:
        """
        Process prescription image from bytes
        
        Args:
            image_data: Binary image data
            filename: Original filename for format detection
            
        Returns:
            Dict with OCR results including medications, metadata, and confidence
        """
        if not OCR_AVAILABLE:
            return {
                "status": "error",
                "error": "OCR service not available",
                "medications": [],
                "metadata": {}
            }
        
        try:
            # Save image to temporary file
            with tempfile.NamedTemporaryFile(
                suffix=Path(filename).suffix or ".jpg",
                delete=False
            ) as temp_file:
                temp_file.write(image_data)
                temp_path = temp_file.name
            
            try:
                # Process image with OCR
                result = process_prescription_image(temp_path)
                
                # Enhance medication data
                if result.get("medications"):
                    result["medications"] = [
                        {
                            **med,
                            "id": f"med_{i}",
                            "extracted_from_ocr": True
                        }
                        for i, med in enumerate(result["medications"])
                    ]
                
                return result
            
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        except Exception as e:
            logger.error(f"OCR processing error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "medications": [],
                "metadata": {}
            }
    
    @staticmethod
    def process_base64_image(base64_data: str, filename: str = "prescription.jpg") -> Dict:
        """
        Process base64 encoded image
        
        Args:
            base64_data: Base64 encoded image string (may include data URL prefix)
            filename: Original filename for format detection
            
        Returns:
            Dict with OCR results
        """
        try:
            # Remove data URL prefix if present
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_data)
            
            return OCRProcessor.process_image(image_bytes, filename)
        
        except Exception as e:
            logger.error(f"Base64 decoding error: {e}")
            return {
                "status": "error",
                "error": "Invalid image format",
                "medications": [],
                "metadata": {}
            }


def extract_medications_from_ocr(ocr_result: Dict) -> List[Dict]:
    """
    Format OCR medications into standardized format
    
    Args:
        ocr_result: Result from OCR processing
        
    Returns:
        List of formatted medication dicts
    """
    medications = []
    
    for med in ocr_result.get("medications", []):
        medications.append({
            "name": med.get("name", ""),
            "dosage": med.get("dosage", ""),
            "frequency": med.get("frequency", ""),
            "duration": med.get("duration", ""),
            "confidence": med.get("confidence", 0.0),
            "extracted_from_ocr": True,
            "source": "prescription_scan"
        })
    
    return medications


def format_ocr_metadata(ocr_result: Dict) -> Dict:
    """Extract and format metadata from OCR result"""
    metadata = ocr_result.get("metadata", {})
    
    return {
        "prescription_date": metadata.get("prescription_date", ""),
        "doctor_name": metadata.get("doctor_name", ""),
        "image_quality": metadata.get("image_quality", "unknown"),
        "has_handwriting": metadata.get("has_handwriting", False),
        "ocr_confidence": ocr_result.get("confidence", 0.0)
    }
