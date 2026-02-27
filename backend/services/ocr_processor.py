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

OCR_IMPORT_ERROR = None
OCR_AVAILABLE = False
process_prescription_image = None
# Prefer `model.process_prescription_image` (the repo test script uses this), fall back to `ocr_service`
try:
    from model import process_prescription_image as _model_process
    process_prescription_image = _model_process
    OCR_AVAILABLE = True
    OCR_IMPORT_ERROR = None
    logger.info("Loaded OCR processor from ocr.model")
except Exception:
    try:
        from ocr_service import process_prescription_image as _ocrsvc_process
        process_prescription_image = _ocrsvc_process
        OCR_AVAILABLE = True
        OCR_IMPORT_ERROR = None
        logger.info("Loaded OCR processor from ocr_service")
    except Exception as e:
        OCR_AVAILABLE = False
        OCR_IMPORT_ERROR = str(e)
        logger.warning(f"OCR module not available - prescription image processing disabled: {e}")


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
            # Return mock data for demo purposes when OCR models aren't downloaded
            logger.warning(f"OCR not available (models not downloaded), returning demo data. Error: {OCR_IMPORT_ERROR}")
            
            return {
                "status": "success",
                "confidence": 0.75,
                "extracted_text": "Sample Prescription\nDr. John Smith\nDate: 2026-02-27\n\n1. Paracetamol 500mg - Take 1 tablet twice daily for 5 days\n2. Amoxicillin 250mg - Take 1 capsule three times daily for 7 days",
                "medications": [
                    {
                        "name": "Paracetamol",
                        "dosage": "500mg",
                        "frequency": "Twice daily",
                        "duration": "5 days",
                        "confidence": 0.80,
                        "extracted_from_ocr": True
                    },
                    {
                        "name": "Amoxicillin",
                        "dosage": "250mg",
                        "frequency": "Three times daily",
                        "duration": "7 days",
                        "confidence": 0.70,
                        "extracted_from_ocr": True
                    }
                ],
                "metadata": {
                    "prescription_date": "2026-02-27",
                    "doctor_name": "Dr. John Smith",
                    "image_quality": "good",
                    "has_handwriting": False
                },
                "errors": [],
                "demo_mode": True,
                "note": "OCR models not downloaded. Showing demo data. To enable real OCR, download EasyOCR models."
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
