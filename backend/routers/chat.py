"""
Chat router for AI-powered conversational interface.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from supabase import Client
from typing import Optional
from uuid import UUID
from core.database import get_supabase_client
from services.llm_service import LLMService
from repositories.prescription_repository import PrescriptionRepository
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

llm_service = LLMService()


class ChatRequest(BaseModel):
    """Chat message request."""
    message: str = Field(min_length=1, max_length=2000, description="User message")
    user_id: Optional[UUID] = Field(default=None, description="User ID for context")
    session_id: Optional[str] = Field(default=None, description="Session tracking")


class ChatResponse(BaseModel):
    """Chat message response."""
    response: str
    intent: str
    confidence: float
    medications: list
    requires_prescription: bool
    suggestions: Optional[list] = None


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Send a chat message and get AI-powered response.
    
    This endpoint:
    1. Extracts intent using LLM
    2. Provides context-aware responses
    3. Can trigger actions (orders, info requests, etc.)
    """
    try:
        # Get user context
        context = {}
        if request.user_id:
            prescription_repo = PrescriptionRepository(supabase)
            prescriptions = await prescription_repo.get_user_prescriptions(
                request.user_id
            )
            context["prescriptions"] = [
                f"{p.product_id}" for p in prescriptions
            ]
        
        # Extract intent
        llm_output = await llm_service.extract_intent(
            request.message,
            context
        )
        
        # Generate response based on intent
        response_text = ""
        suggestions = []
        
        if llm_output.intent.value == "ORDER_NEW":
            response_text = f"I understand you want to order {', '.join([m.name for m in llm_output.medications])}. "
            if llm_output.requires_prescription:
                response_text += "Please note that prescription verification will be required. "
            response_text += "Would you like me to proceed with creating your order?"
            suggestions = ["Yes, create order", "Tell me more about these medicines", "Cancel"]
        
        elif llm_output.intent.value == "ORDER_REFILL":
            response_text = f"I can help you refill your prescription. {llm_output.summary} "
            response_text += "Let me check your prescription status. Would you like to proceed?"
            suggestions = ["Yes, refill now", "Check refill date", "Cancel"]
        
        elif llm_output.intent.value == "INFO_REQUEST":
            response_text = f"I can provide information about {', '.join([m.name for m in llm_output.medications])}. "
            response_text += "What would you like to know?"
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
            confidence=llm_output.confidence,
            medications=[m.model_dump() for m in llm_output.medications],
            requires_prescription=llm_output.requires_prescription,
            suggestions=suggestions
        )
    
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(e)}"
        )
