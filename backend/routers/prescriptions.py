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
            # Prefer single-string `error`, otherwise join `errors` list for a clearer message
            detail_msg = ocr_result.get("error") or (", ".join(ocr_result.get("errors", [])) if ocr_result.get("errors") else None)
            if not detail_msg:
                detail_msg = "Failed to process image"
            logger.error(f"OCR processing returned error: {ocr_result}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail_msg
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


@router.post("/analyze")
async def analyze_prescription(request: PrescriptionOCRRequest):
    """
    Analyze a prescription image provided as base64.
    
    Returns extracted medications, metadata, and confidence score.
    Uses LLM to enhance medication extraction from raw OCR text.
    """
    from services.ocr_processor import OCR_AVAILABLE, OCR_IMPORT_ERROR
    from services.prescription_llm_parser import enhance_ocr_with_llm
    
    logger.info(f"[OCR] Starting analysis. OCR_AVAILABLE={OCR_AVAILABLE}, filename={request.filename}")
    
    if not OCR_AVAILABLE:
        logger.error(f"[OCR] OCR not available: {OCR_IMPORT_ERROR}")
        return {
            "status": "error",
            "error": f"OCR service unavailable: {OCR_IMPORT_ERROR}",
            "medications": [],
            "metadata": {},
            "confidence": 0.0
        }
    
    try:
        logger.info("[OCR] Step 1: Calling OCRProcessor.process_base64_image...")
        ocr_result = OCRProcessor.process_base64_image(
            request.image_base64,
            request.filename
        )
        logger.info(f"[OCR] Step 2: OCR completed. Status={ocr_result.get('status')}, meds={len(ocr_result.get('medications', []))}")
        
        if ocr_result.get("status") == "error":
            detail_msg = ocr_result.get("error") or (", ".join(ocr_result.get("errors", [])) if ocr_result.get("errors") else None)
            if not detail_msg:
                detail_msg = "Failed to process image"
            logger.error(f"[OCR] OCR returned error: {detail_msg}")
            return {
                "status": "error",
                "error": detail_msg,
                "medications": [],
                "metadata": {},
                "confidence": 0.0
            }
        
        # Step 3: Enhance with LLM parsing for better extraction
        logger.info("[OCR] Step 3: Enhancing with LLM parser...")
        try:
            ocr_result = await enhance_ocr_with_llm(ocr_result)
            logger.info(f"[OCR] LLM enhancement complete. Enhanced={ocr_result.get('llm_enhanced', False)}")
        except Exception as llm_err:
            logger.warning(f"[OCR] LLM enhancement failed, using basic OCR: {llm_err}")
        
        logger.info("[OCR] Step 4: Formatting medications...")
        medications = extract_medications_from_ocr(ocr_result)
        
        logger.info("[OCR] Step 5: Formatting metadata...")
        metadata = format_ocr_metadata(ocr_result)
        
        logger.info("[OCR] Step 6: Building response...")
        response = {
            "status": ocr_result.get("status", "partial"),
            "medications": medications,
            "metadata": metadata,
            "confidence": ocr_result.get("confidence", 0.0),
            "extracted_text": ocr_result.get("extracted_text", ""),
            "llm_enhanced": ocr_result.get("llm_enhanced", False),
            "errors": ocr_result.get("errors", [])
        }
        
        logger.info(f"[OCR] SUCCESS! Returning {len(medications)} medications (LLM enhanced: {response['llm_enhanced']})")
        return response
    
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"[OCR] EXCEPTION: {e}\n{tb}")
        return {
            "status": "error",
            "error": str(e),
            "detail": tb,
            "medications": [],
            "metadata": {},
            "confidence": 0.0
        }


class SavePrescriptionScanRequest(BaseModel):
    """Request to save OCR scan results to database"""
    user_id: Optional[str] = None
    image_url: Optional[str] = None
    image_filename: Optional[str] = None
    extracted_text: str
    medications: List[dict]  # List of medication dicts from OCR
    metadata: dict = {}
    confidence: float = 0.0
    image_quality: str = "unknown"
    has_handwriting: bool = False
    prescription_date: Optional[str] = None
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None
    processing_time_ms: Optional[int] = None
    notes: Optional[str] = None


@router.post("/save")
async def save_prescription_scan(request: SavePrescriptionScanRequest):
    """
    Save OCR scan results to database.
    
    This endpoint stores the prescription OCR results for later retrieval.
    """
    from core.database import get_supabase_client
    from repositories.prescription_scan_repository import PrescriptionScanRepository
    from models.schemas import PrescriptionScanCreate, MedicationItem
    from uuid import UUID
    from datetime import date
    
    logger.info(f"[SAVE] Saving prescription scan with {len(request.medications)} medications")
    
    try:
        # Get database client
        supabase = get_supabase_client()
        if not supabase:
            logger.error("[SAVE] Database connection not available")
            return {
                "status": "error",
                "error": "Database connection not available",
                "id": None
            }
        
        # Parse medications
        medications = []
        for med in request.medications:
            medications.append(MedicationItem(
                name=med.get("name", ""),
                dosage=med.get("dosage"),
                frequency=med.get("frequency"),
                duration=med.get("duration"),
                quantity=med.get("quantity"),
                instructions=med.get("instructions"),
                confidence=med.get("confidence", 0.0)
            ))
        
        # Parse optional fields
        user_id = UUID(request.user_id) if request.user_id else None
        prescription_date = None
        if request.prescription_date:
            try:
                prescription_date = date.fromisoformat(request.prescription_date)
            except ValueError:
                pass
        
        # Create scan data
        scan_data = PrescriptionScanCreate(
            user_id=user_id,
            image_url=request.image_url,
            image_filename=request.image_filename,
            extracted_text=request.extracted_text,
            medications=medications,
            metadata=request.metadata,
            confidence=request.confidence,
            image_quality=request.image_quality,
            has_handwriting=request.has_handwriting,
            prescription_date=prescription_date,
            doctor_name=request.doctor_name,
            patient_name=request.patient_name,
            processing_time_ms=request.processing_time_ms,
            notes=request.notes
        )
        
        # Save to database
        repo = PrescriptionScanRepository(supabase)
        result = await repo.create(scan_data)
        
        if result:
            logger.info(f"[SAVE] Successfully saved scan with ID: {result.id}")
            return {
                "status": "success",
                "id": str(result.id),
                "message": "Prescription scan saved successfully",
                "medications_count": len(medications)
            }
        else:
            logger.error("[SAVE] Failed to save scan - no result returned")
            return {
                "status": "error",
                "error": "Failed to save prescription scan",
                "id": None
            }
    
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"[SAVE] EXCEPTION: {e}\n{tb}")
        return {
            "status": "error",
            "error": str(e),
            "id": None
        }


@router.get("/scans")
async def get_prescription_scans(
    user_id: Optional[str] = None,
    limit: int = 20
):
    """
    Get saved prescription scans.
    
    If user_id is provided, returns scans for that user.
    Otherwise returns recent scans (for dashboard).
    """
    from core.database import get_supabase_client
    from repositories.prescription_scan_repository import PrescriptionScanRepository
    from uuid import UUID
    
    logger.info(f"[GET] Fetching prescription scans. user_id={user_id}, limit={limit}")
    
    try:
        supabase = get_supabase_client()
        if not supabase:
            return {
                "status": "error",
                "error": "Database connection not available",
                "scans": []
            }
        
        repo = PrescriptionScanRepository(supabase)
        
        if user_id:
            scans = await repo.get_user_scans(UUID(user_id), limit=limit)
        else:
            scans = await repo.get_recent_scans(limit=limit)
        
        # Convert to JSON-serializable format
        scans_data = []
        for scan in scans:
            scans_data.append({
                "id": str(scan.id),
                "user_id": str(scan.user_id) if scan.user_id else None,
                "image_url": scan.image_url,
                "extracted_text": scan.extracted_text[:200] + "..." if len(scan.extracted_text) > 200 else scan.extracted_text,
                "medications": [
                    {
                        "name": med.name,
                        "dosage": med.dosage,
                        "frequency": med.frequency,
                        "duration": med.duration,
                        "confidence": med.confidence
                    }
                    for med in scan.medications
                ],
                "confidence": scan.confidence,
                "status": scan.status,
                "prescription_date": scan.prescription_date.isoformat() if scan.prescription_date else None,
                "doctor_name": scan.doctor_name,
                "created_at": scan.created_at.isoformat() if scan.created_at else None
            })
        
        logger.info(f"[GET] Returning {len(scans_data)} scans")
        return {
            "status": "success",
            "scans": scans_data,
            "count": len(scans_data)
        }
    
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"[GET] EXCEPTION: {e}\n{tb}")
        return {
            "status": "error",
            "error": str(e),
            "scans": []
        }


@router.get("/scans/{scan_id}")
async def get_prescription_scan_by_id(scan_id: str):
    """Get a specific prescription scan by ID."""
    from core.database import get_supabase_client
    from repositories.prescription_scan_repository import PrescriptionScanRepository
    from uuid import UUID
    
    logger.info(f"[GET] Fetching prescription scan: {scan_id}")
    
    try:
        supabase = get_supabase_client()
        if not supabase:
            return {
                "status": "error",
                "error": "Database connection not available"
            }
        
        repo = PrescriptionScanRepository(supabase)
        scan = await repo.get_by_id(UUID(scan_id))
        
        if not scan:
            return {
                "status": "error",
                "error": "Scan not found"
            }
        
        return {
            "status": "success",
            "scan": {
                "id": str(scan.id),
                "user_id": str(scan.user_id) if scan.user_id else None,
                "image_url": scan.image_url,
                "extracted_text": scan.extracted_text,
                "medications": [
                    {
                        "name": med.name,
                        "dosage": med.dosage,
                        "frequency": med.frequency,
                        "duration": med.duration,
                        "quantity": med.quantity,
                        "instructions": med.instructions,
                        "confidence": med.confidence
                    }
                    for med in scan.medications
                ],
                "metadata": scan.metadata,
                "confidence": scan.confidence,
                "image_quality": scan.image_quality,
                "has_handwriting": scan.has_handwriting,
                "status": scan.status,
                "prescription_date": scan.prescription_date.isoformat() if scan.prescription_date else None,
                "doctor_name": scan.doctor_name,
                "patient_name": scan.patient_name,
                "created_at": scan.created_at.isoformat() if scan.created_at else None
            }
        }
    
    except Exception as e:
        logger.error(f"[GET] Error fetching scan {scan_id}: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
