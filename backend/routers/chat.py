"""
Chat router for AI-powered conversational interface with OCR support for prescriptions.
"""

from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Form
from pydantic import BaseModel, Field
from supabase import Client
from typing import Optional, List
from uuid import UUID
from core.database import get_supabase_client
from services.llm_service import LLMService
from services.ocr_processor import OCRProcessor, extract_medications_from_ocr, format_ocr_metadata
from repositories.prescription_repository import PrescriptionRepository
import logging
import base64

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

llm_service = LLMService()


class ChatRequest(BaseModel):
    """Chat message request."""
    message: str = Field(min_length=1, max_length=2000, description="User message")
    user_id: Optional[UUID] = Field(default=None, description="User ID for context")
    session_id: Optional[str] = Field(default=None, description="Session tracking")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded prescription image")


class ChatResponse(BaseModel):
    """Chat message response."""
    response: str
    intent: str
    confidence: float
    medications: list
    requires_prescription: bool
    suggestions: Optional[list] = None
    ocr_data: Optional[dict] = None  # OCR results if prescription image was provided


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Send a chat message and get AI-powered response.
    
    Supports:
    1. Text messages with intent extraction
    2. Prescription image analysis via OCR
    3. Context-aware responses for medication queries
    4. Trigger actions (orders, info requests, refills)
    """
    try:
        # Process prescription image if provided
        ocr_data = None
        extracted_medications = []
        
        if request.image_base64:
            logger.info("Processing prescription image with OCR")
            ocr_result = OCRProcessor.process_base64_image(
                request.image_base64,
                "prescription.jpg"
            )
            
            if ocr_result.get("status") != "error":
                ocr_data = {
                    "status": ocr_result.get("status"),
                    "confidence": ocr_result.get("confidence"),
                    "metadata": format_ocr_metadata(ocr_result),
                    "medication_count": len(ocr_result.get("medications", []))
                }
                extracted_medications = extract_medications_from_ocr(ocr_result)
                
                # If OCR found medications and user didn't provide a message, create one
                if extracted_medications and not request.message:
                    med_names = ", ".join([m["name"] for m in extracted_medications])
                    request.message = f"I uploaded a prescription with {med_names}. Can you help me order these?"
            else:
                return ChatResponse(
                    response="I couldn't read the prescription image clearly. Please try uploading a clearer image or tell me the medications directly.",
                    intent="OCR_ERROR",
                    confidence=0.0,
                    medications=[],
                    requires_prescription=False,
                    suggestions=["Try uploading again", "Tell me medications manually"],
                    ocr_data={"status": "error", "error": ocr_result.get("error")}
                )
        
        # Get user context
        context = {}
        if request.user_id and supabase:
            prescription_repo = PrescriptionRepository(supabase)
            prescriptions = await prescription_repo.get_user_prescriptions(
                request.user_id
            )
            context["prescriptions"] = [
                f"{p.product_id}" for p in prescriptions
            ]
        
        # Add OCR medications to context
        if extracted_medications:
            context["ocr_medications"] = extracted_medications
            context["has_prescription_image"] = True
        
        # Extract intent
        try:
            llm_output = await llm_service.extract_intent(
                request.message,
                context
            )
        except Exception as e:
            logger.warning(f"LLM service error: {e}")
            # Fallback response for LLM errors
            response_text = f"Thank you for your message. I'm here to help with your medication needs."
            if extracted_medications:
                med_names = ", ".join([m["name"] for m in extracted_medications])
                response_text = f"I've identified {med_names} from your prescription. Would you like me to help you order these medications?"
            
            return ChatResponse(
                response=response_text,
                intent="FALLBACK",
                confidence=0.5,
                medications=[{"name": m["name"], "dosage": m.get("dosage", "")} for m in extracted_medications],
                requires_prescription=False,
                suggestions=["Yes, order now", "Get medicine info", "Cancel"] if extracted_medications else ["Order medicine", "Get medicine info"],
                ocr_data=ocr_data
            )
        
        # Generate response based on intent
        response_text = ""
        suggestions = []
        
        # Combine LLM medications with OCR medications
        all_medications = llm_output.medications if hasattr(llm_output, 'medications') else []
        if extracted_medications and not all_medications:
            all_medications = extracted_medications
        
        if llm_output.intent.value == "ORDER_NEW":
            med_names = ", ".join([m.name if hasattr(m, 'name') else m.get("name", "") for m in all_medications])
            response_text = f"I understand you want to order {med_names}. "
            if llm_output.requires_prescription:
                response_text += "Please note that prescription verification will be required. "
            response_text += "Would you like me to proceed with creating your order?"
            suggestions = ["Yes, create order", "Tell me more about these medicines", "Cancel"]
        
        elif llm_output.intent.value == "ORDER_REFILL":
            response_text = "I can help you refill your prescription. "
            response_text += "Let me check your prescription status. Would you like to proceed?"
            suggestions = ["Yes, refill now", "Check refill date", "Cancel"]
        
        elif llm_output.intent.value == "INFO_REQUEST":
            med_names = ", ".join([m.name if hasattr(m, 'name') else m.get("name", "") for m in all_medications])
            response_text = f"I can provide information about {med_names}. What would you like to know?"
            suggestions = [
                "Dosage instructions",
                "Side effects",
                "Drug interactions",
                "Price and availability"
            ]
        
        else:
            response_text = "I'm not sure I understood your request completely. Could you please provide more details about what you need?"
            suggestions = ["Order new medicine", "Refill prescription", "Get medicine info"]
        
        return ChatResponse(
            response=response_text,
            intent=llm_output.intent.value,
            confidence=llm_output.confidence if hasattr(llm_output, 'confidence') else 0.0,
            medications=[m.model_dump() if hasattr(m, 'model_dump') else m for m in all_medications],
            requires_prescription=llm_output.requires_prescription if hasattr(llm_output, 'requires_prescription') else False,
            suggestions=suggestions,
            ocr_data=ocr_data
        )
    
    except Exception as e:
        logger.warning(f"Chat service error, providing default response: {e}")
        # Return a default helpful response instead of crashing
        return ChatResponse(
            response="I'm here to help with your medication needs. You can ask me about ordering medicines, refilling prescriptions, or upload a prescription image for me to analyze.",
            intent="FALLBACK",
            confidence=0.0,
            medications=[],
            requires_prescription=False,
            suggestions=["Order new medicine", "Upload prescription", "Get medicine info"]
        )
