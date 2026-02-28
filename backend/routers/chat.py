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
from services.prescription_llm_parser import enhance_ocr_with_llm
from repositories.prescription_repository import PrescriptionRepository
from mock_data import MOCK_MEDICINES
import logging
import base64
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

llm_service = LLMService()

# Session-based prescription context storage (in production, use Redis or DB)
# Key: session_id or user_id, Value: {ocr_data, medications, timestamp}
prescription_context: dict = {}

# Context expiry time (30 minutes)
CONTEXT_EXPIRY_MINUTES = 30


def get_session_key(user_id: Optional[UUID], session_id: Optional[str]) -> str:
    """Generate a session key for context storage."""
    if session_id:
        return f"session_{session_id}"
    elif user_id:
        return f"user_{user_id}"
    return "default_session"


def store_prescription_context(session_key: str, ocr_data: dict, medications: list, raw_text: str = "", conversation_history: list = None):
    """Store prescription context for follow-up questions."""
    prescription_context[session_key] = {
        "ocr_data": ocr_data,
        "medications": medications,
        "raw_text": raw_text,
        "conversation_history": conversation_history or [],
        "timestamp": datetime.now()
    }
    logger.info(f"Stored prescription context for {session_key}: {len(medications)} medications, {len(conversation_history or [])} messages in history")


def get_prescription_context(session_key: str) -> Optional[dict]:
    """Retrieve prescription context if not expired."""
    ctx = prescription_context.get(session_key)
    if ctx:
        age = datetime.now() - ctx["timestamp"]
        if age < timedelta(minutes=CONTEXT_EXPIRY_MINUTES):
            return ctx
        else:
            # Expired, remove it
            del prescription_context[session_key]
            logger.info(f"Prescription context expired for {session_key}")
    return None


def format_prescription_response(medications: list, query_type: str = "list") -> str:
    """Format prescription medications for response."""
    if not medications:
        return "I don't have any prescription data to show. Please upload a prescription image first using the 📷 button."
    
    response = f"Based on your prescription, I found **{len(medications)} medication(s)**:\n\n"
    
    for i, med in enumerate(medications, 1):
        name = med.get("name", "Unknown")
        dosage = med.get("dosage", "N/A")
        frequency = med.get("frequency", "N/A")
        duration = med.get("duration", "N/A")
        quantity = med.get("quantity", "N/A")
        instructions = med.get("instructions", "")
        
        response += f"**{i}. {name}**\n"
        response += f"   • Dosage: {dosage}\n"
        response += f"   • Frequency: {frequency}\n"
        if duration and duration != "N/A":
            response += f"   • Duration: {duration}\n"
        if quantity and quantity != "N/A":
            response += f"   • Quantity: {quantity}\n"
        if instructions:
            response += f"   • Instructions: {instructions}\n"
        response += "\n"
    
    return response


async def get_medicines_from_db(supabase: Client, search: str = None, limit: int = 10) -> List[dict]:
    """Fetch medicines from database or fall back to mock data."""
    try:
        if supabase:
            query = supabase.table("medicines").select("*")
            if search:
                query = query.ilike("name", f"%{search}%")
            query = query.limit(limit)
            result = query.execute()
            if result.data:
                return result.data
    except Exception as e:
        logger.warning(f"Failed to fetch medicines from DB: {e}")
    
    # Fallback to mock data
    medicines = MOCK_MEDICINES
    if search:
        medicines = [m for m in medicines if search.lower() in m.get("name", "").lower()]
    return medicines[:limit]


class ChatRequest(BaseModel):
    """Chat message request."""
    message: str = Field(min_length=1, max_length=2000, description="User message")
    user_id: Optional[UUID] = Field(default=None, description="User ID for context")
    session_id: Optional[str] = Field(default=None, description="Session tracking")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded prescription image")
    conversation_history: Optional[List[dict]] = Field(default=None, description="Previous messages in conversation")


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
        # Get session key for context storage
        session_key = get_session_key(request.user_id, request.session_id)
        
        # Get or initialize conversation history (ChatGPT-like memory)
        existing_context = get_prescription_context(session_key)
        conversation_history = []
        if existing_context and existing_context.get("conversation_history"):
            conversation_history = existing_context["conversation_history"]
        elif request.conversation_history:
            conversation_history = request.conversation_history
        
        logger.info(f"Conversation history: {len(conversation_history)} messages")
        
        # Process prescription image if provided
        ocr_data = None
        extracted_medications = []
        ocr_raw_text = ""  # Store raw text from OCR for use in PRESCRIPTION_QUERY
        
        if request.image_base64:
            logger.info("Processing prescription image with OCR")
            ocr_result = OCRProcessor.process_base64_image(
                request.image_base64,
                "prescription.jpg"
            )
            
            if ocr_result.get("status") != "error":
                # Get raw OCR text and store for later use
                ocr_raw_text = ocr_result.get("extracted_text", "")
                
                # Enhance OCR results with LLM for better medication extraction
                try:
                    ocr_result = await enhance_ocr_with_llm(ocr_result)
                    logger.info(f"LLM enhanced OCR, llm_enhanced: {ocr_result.get('llm_enhanced')}")
                except Exception as e:
                    logger.warning(f"LLM enhancement failed, using basic OCR: {e}")
                
                ocr_data = {
                    "status": ocr_result.get("status"),
                    "confidence": ocr_result.get("confidence"),
                    "metadata": format_ocr_metadata(ocr_result),
                    "medication_count": len(ocr_result.get("medications", [])),
                    "llm_enhanced": ocr_result.get("llm_enhanced", False)
                }
                extracted_medications = extract_medications_from_ocr(ocr_result)
                
                # Store the prescription context with raw text for follow-up questions
                store_prescription_context(session_key, ocr_data, extracted_medications, ocr_raw_text, conversation_history)
                
                # If OCR found medications and user didn't provide a message, create one
                if extracted_medications and not request.message:
                    med_names = ", ".join([m["name"] for m in extracted_medications])
                    request.message = f"I uploaded a prescription with {med_names}. Can you help me order these?"
            else:
                # OCR failed - try to generate a multilingual error response
                try:
                    ocr_error_response = await llm_service.generate_response(
                        user_message=request.message if request.message else "Uploaded prescription image",
                        intent="OCR_ERROR",
                        medications=[],
                        conversation_history=conversation_history
                    )
                except:
                    # Fallback if LLM fails
                    ocr_error_response = "I couldn't read the prescription image clearly. Please try uploading a clearer image or tell me the medications directly."
                
                return ChatResponse(
                    response=ocr_error_response,
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
            logger.info(f"Added {len(extracted_medications)} OCR medications to context")
        
        # Check for existing prescription context (for follow-up questions)
        # This also catches the case where OCR was just done in this request
        existing_context = get_prescription_context(session_key)
        if existing_context:
            # Use stored context if we don't have fresh extracted medications
            if not extracted_medications:
                context["stored_prescription"] = existing_context["medications"]
                context["has_stored_prescription"] = True
                logger.info(f"Using stored prescription context: {len(existing_context.get('medications', []))} medications")
            # Also add raw text for better context
            if existing_context.get("raw_text"):
                context["prescription_raw_text"] = existing_context["raw_text"][:500]  # Limit size
        
        # Extract intent
        try:
            llm_output = await llm_service.extract_intent(
                request.message,
                context
            )
        except Exception as e:
            logger.warning(f"LLM service error: {e}")
            # Fallback response for LLM errors - generate multilingual fallback
            try:
                response_text = await llm_service.generate_response(
                    user_message=request.message,
                    intent="FALLBACK",
                    medications=extracted_medications if extracted_medications else [],
                    conversation_history=conversation_history
                )
            except:
                # Last resort fallback
                response_text = "Thank you for your message. I'm here to help with your medication needs."
            
            if extracted_medications:
                # Keep the medications context even on error
                pass
            
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
            # Generate multilingual response
            response_context = {
                "requires_prescription": llm_output.requires_prescription,
                "suggestions": ["Yes, create order", "Tell me more about these medicines", "Cancel"]
            }
            response_text = await llm_service.generate_response(
                user_message=request.message,
                intent="ORDER_NEW",
                medications=all_medications,
                context=response_context,
                conversation_history=conversation_history
            )
            suggestions = ["Yes, create order", "Tell me more about these medicines", "Cancel"]
        
        elif llm_output.intent.value == "ORDER_REFILL":
            # Generate multilingual response
            response_text = await llm_service.generate_response(
                user_message=request.message,
                intent="ORDER_REFILL",
                medications=all_medications,
                conversation_history=conversation_history
            )
            suggestions = ["Yes, refill now", "Check refill date", "Cancel"]
        
        elif llm_output.intent.value == "INFO_REQUEST":
            # Generate multilingual response
            response_text = await llm_service.generate_response(
                user_message=request.message,
                intent="INFO_REQUEST",
                medications=all_medications,
                conversation_history=conversation_history
            )
            suggestions = [
                "Dosage instructions",
                "Side effects",
                "Drug interactions",
                "Price and availability"
            ]
        
        elif llm_output.intent.value == "STOCK_CHECK":
            # Fetch real medicines from database
            medicines = await get_medicines_from_db(supabase, limit=10)
            
            if all_medications:
                # User asked about specific medicines
                med_names = [m.name if hasattr(m, 'name') else m.get("name", "") for m in all_medications]
                search_name = med_names[0] if med_names else None
                if search_name:
                    medicines = await get_medicines_from_db(supabase, search=search_name, limit=5)
            
            # Format medicine list for context
            stock_info = ""
            if medicines:
                stock_items = []
                for med in medicines[:5]:
                    name = med.get("name", "Unknown")
                    stock = med.get("stock_quantity", 0)
                    price = med.get("price", 0)
                    rx = "Rx Required" if med.get("prescription_required") else "OTC"
                    stock_items.append(f"• **{name}**: {stock} in stock, ₹{price:.2f} ({rx})")
                stock_info = "\n".join(stock_items)
            
            # Generate multilingual response with stock info
            response_context = {
                "stock_info": stock_info if stock_info else "No specific stock information available"
            }
            response_text = await llm_service.generate_response(
                user_message=request.message,
                intent="STOCK_CHECK",
                medications=all_medications,
                context=response_context,
                conversation_history=conversation_history
            )
            
            suggestions = ["Order medicine", "Search specific medicine", "View all categories"]
        
        elif llm_output.intent.value == "PRESCRIPTION_QUERY":
            # Handle questions about prescription (uploaded or stored)
            prescription_meds = []
            prescription_raw_text = ""
            
            # If user just uploaded an image in this request, prioritize that
            if request.image_base64 and ocr_data:
                prescription_meds = extracted_medications
                # Use raw_text from current OCR processing
                prescription_raw_text = ocr_raw_text
                logger.info(f"Using just-uploaded image: {len(prescription_meds)} meds, raw_text_len={len(prescription_raw_text)}")
            # Otherwise check fresh OCR medications
            elif extracted_medications:
                prescription_meds = extracted_medications
                prescription_raw_text = ocr_raw_text  # Also capture raw text
                logger.info(f"Using fresh OCR medications: {len(prescription_meds)}")
            # Otherwise check stored context
            elif existing_context:
                prescription_meds = existing_context.get("medications", [])
                prescription_raw_text = existing_context.get("raw_text", "")
                logger.info(f"Using stored context medications: {len(prescription_meds)}")
            
            if prescription_meds:
                # Format prescription info for the response
                prescription_info = format_prescription_response(prescription_meds)
                
                # Generate multilingual response
                response_text = await llm_service.generate_response(
                    user_message=request.message,
                    intent="PRESCRIPTION_QUERY",
                    medications=prescription_meds,
                    prescription_info=prescription_info,
                    conversation_history=conversation_history
                )
                suggestions = ["Order these medicines", "Tell me about side effects", "Check drug interactions", "Upload new prescription"]
                all_medications = prescription_meds
            elif prescription_raw_text or (ocr_data and ocr_data.get("status") == "partial"):
                # We have raw text but no parsed medications - show what was found
                stored_raw = existing_context.get("raw_text", "") if existing_context else ""
                display_text = prescription_raw_text or stored_raw or ocr_raw_text
                if display_text:
                    # Truncate for display
                    display_text = display_text[:800] if len(display_text) > 800 else display_text
                    
                    # Generate multilingual response with partial data
                    response_context = {"prescription_raw_text": display_text}
                    response_text = await llm_service.generate_response(
                        user_message=request.message,
                        intent="PRESCRIPTION_QUERY_PARTIAL",
                        medications=[],
                        context=response_context,
                        conversation_history=conversation_history
                    )
                else:
                    # Generate multilingual response for unclear prescription
                    response_text = await llm_service.generate_response(
                        user_message=request.message,
                        intent="PRESCRIPTION_QUERY_UNCLEAR",
                        medications=[],
                        conversation_history=conversation_history
                    )
                suggestions = ["Try uploading again", "Tell me medications manually", "Order medicine"]
            else:
                # Generate multilingual response for no prescription
                response_text = await llm_service.generate_response(
                    user_message=request.message,
                    intent="PRESCRIPTION_QUERY_NONE",
                    medications=[],
                    conversation_history=conversation_history
                )
                suggestions = ["Upload prescription", "Order medicine manually", "Check available stock"]
        
        elif llm_output.intent.value == "GREETING":
            # Generate multilingual greeting response
            response_text = await llm_service.generate_response(
                user_message=request.message,
                intent="GREETING",
                medications=[],
                conversation_history=conversation_history
            )
            suggestions = ["Show available medicines", "Order medicine", "Refill prescription", "Upload prescription"]
        
        elif llm_output.intent.value == "SYMPTOM_QUERY":
            # User mentioned symptoms - ask follow-up questions first
            response_text = await llm_service.generate_response(
                user_message=request.message,
                intent="SYMPTOM_QUERY",
                medications=[],
                conversation_history=conversation_history
            )
            suggestions = ["Tell me more", "Suggest medicine", "Check available medicines"]
        
        else:
            # Generate multilingual response for unknown intent
            response_text = await llm_service.generate_response(
                user_message=request.message,
                intent="UNKNOWN",
                medications=[],
                conversation_history=conversation_history
            )
            suggestions = ["Order new medicine", "Refill prescription", "Check stock", "Get medicine info"]
        
        # Update conversation history with current exchange (ChatGPT-like memory)
        conversation_history.append({
            "role": "user",
            "content": request.message
        })
        conversation_history.append({
            "role": "assistant", 
            "content": response_text
        })
        
        # Store updated conversation history in context
        if existing_context:
            existing_context["conversation_history"] = conversation_history
            store_prescription_context(
                session_key,
                existing_context.get("ocr_data", {}),
                existing_context.get("medications", []),
                existing_context.get("raw_text", ""),
                conversation_history
            )
        else:
            store_prescription_context(
                session_key,
                ocr_data or {},
                all_medications,
                ocr_raw_text,
                conversation_history
            )
        
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
        # Return a default helpful response - try to make it multilingual if possible
        try:
            # Try to detect language from request if available
            default_response = "I'm here to help with your medication needs. You can ask me about ordering medicines, refilling prescriptions, or upload a prescription image for me to analyze."
        except:
            default_response = "I'm here to help with your medication needs. You can ask me about ordering medicines, refilling prescriptions, or upload a prescription image for me to analyze."
        
        return ChatResponse(
            response=default_response,
            intent="FALLBACK",
            confidence=0.0,
            medications=[],
            requires_prescription=False,
            suggestions=["Order new medicine", "Upload prescription", "Get medicine info"]
        )
