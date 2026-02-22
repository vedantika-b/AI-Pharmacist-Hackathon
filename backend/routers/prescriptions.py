"""
Prescription OCR router - Process prescription images and extract medications
"""

from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import logging
import base64

from services.ocr_processor import (
    OCRProcessor,
    extract_medications_from_ocr,
    format_ocr_metadata
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


class PrescriptionOCRRequest(BaseModel):
    """Request for OCR processing"""
    image_base64: str
    filename: Optional[str] = "prescription.jpg"


class MedicationFromOCR(BaseModel):
    """Medication extracted from OCR"""
    name: str
    dosage: str
    frequency: str
    duration: str
    confidence: float
    extracted_from_ocr: bool = True


class PrescriptionOCRResponse(BaseModel):
    """OCR processing response"""
    status: str
    medications: List[MedicationFromOCR]
    metadata: dict
    confidence: float
    extracted_text: Optional[str] = None
    errors: Optional[List[str]] = None


@router.post("/upload", response_model=PrescriptionOCRResponse)
async def upload_prescription(
    image: str = Form(..., description="Base64 encoded image data"),
    filename: str = Form(default="prescription.jpg")
):
    """
    Upload and process a prescription image.
    
    The image should be base64 encoded. Returns extracted medications and metadata.
    """
    try:
        # Process image with OCR
        ocr_result = OCRProcessor.process_base64_image(image, filename)
        
        if ocr_result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ocr_result.get("error", "Failed to process image")
            )
        
        # Format response
        medications = extract_medications_from_ocr(ocr_result)
        metadata = format_ocr_metadata(ocr_result)
        
        return PrescriptionOCRResponse(
            status=ocr_result.get("status", "partial"),
            medications=medications,
            metadata=metadata,
            confidence=ocr_result.get("confidence", 0.0),
            extracted_text=ocr_result.get("extracted_text", ""),
            errors=ocr_result.get("errors", None)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prescription processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process prescription: {str(e)}"
        )


@router.post("/analyze", response_model=PrescriptionOCRResponse)
async def analyze_prescription(request: PrescriptionOCRRequest):
    """
    Analyze a prescription image provided as base64.
    
    Returns extracted medications, metadata, and confidence score.
    """
    try:
        # Process image with OCR
        ocr_result = OCRProcessor.process_base64_image(
            request.image_base64,
            request.filename
        )
        
        if ocr_result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ocr_result.get("error", "Failed to process image")
            )
        
        # Format response
        medications = extract_medications_from_ocr(ocr_result)
        metadata = format_ocr_metadata(ocr_result)
        
        return PrescriptionOCRResponse(
            status=ocr_result.get("status", "partial"),
            medications=medications,
            metadata=metadata,
            confidence=ocr_result.get("confidence", 0.0),
            extracted_text=ocr_result.get("extracted_text", ""),
            errors=ocr_result.get("errors", None)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prescription analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze prescription: {str(e)}"
        )


# Mock endpoint while testing without real OCR
@router.post("/demo/analyze", response_model=PrescriptionOCRResponse)
async def demo_analyze_prescription():
    """
    Demo endpoint that returns sample OCR results
    """
    return PrescriptionOCRResponse(
        status="success",
        medications=[
            MedicationFromOCR(
                name="Amoxicillin",
                dosage="500mg",
                frequency="3 times daily",
                duration="7 days",
                confidence=0.92
            ),
            MedicationFromOCR(
                name="Metformin",
                dosage="500mg",
                frequency="2 times daily",
                duration="30 days",
                confidence=0.88
            )
        ],
        metadata={
            "prescription_date": "2026-02-22",
            "doctor_name": "Dr. Smith",
            "image_quality": "good",
            "has_handwriting": False,
            "ocr_confidence": 0.9
        },
        confidence=0.9,
        extracted_text="Rx: Amoxicillin 500mg 3 times daily for 7 days. Metformin 500mg 2 times daily for 30 days."
    )
