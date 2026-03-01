"""
Patient Feedback Analysis Router
Analyzes patient feedback about medicines and provides structured health insights
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from services.llm_service import LLMService
from repositories.feedback_repository import FeedbackRepository
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["Feedback"])

llm_service = LLMService()
feedback_repo = FeedbackRepository()


class FeedbackRequest(BaseModel):
    """Patient feedback submission"""
    user_id: Optional[str] = None
    patient_name: Optional[str] = None
    phone_number: Optional[str] = None
    medicine_name: Optional[str] = None
    feedback_text: str = Field(..., min_length=10, description="Patient's detailed feedback")


class FeedbackAnalysis(BaseModel):
    """Structured feedback analysis response"""
    health_status: str
    relief_status: str
    side_effects: str
    emergency_risk: str
    patient_doubts: str
    app_suggestions: str
    ai_response: str
    raw_feedback: str
    analyzed_at: str


def parse_feedback_response(llm_response: str, original_feedback: str) -> FeedbackAnalysis:
    """Parse the structured LLM response into a FeedbackAnalysis object"""
    
    lines = llm_response.strip().split('\n')
    analysis = {
        'health_status': 'Not specified',
        'relief_status': 'Not specified',
        'side_effects': 'None mentioned',
        'emergency_risk': 'None detected',
        'patient_doubts': 'None',
        'app_suggestions': 'None',
        'ai_response': 'Thank you for your feedback.'
    }
    
    current_key = None
    current_value = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if this is a header line
        if line.endswith(':') and not line.startswith('-'):
            # Save previous section if exists
            if current_key and current_value:
                analysis[current_key] = ' '.join(current_value).strip()
                current_value = []
            
            # Determine new section
            header = line[:-1].strip().lower()
            if 'health status' in header:
                current_key = 'health_status'
            elif 'relief status' in header or 'relief provided' in header:
                current_key = 'relief_status'
            elif 'side effect' in header:
                current_key = 'side_effects'
            elif 'emergency' in header or 'risk' in header:
                current_key = 'emergency_risk'
            elif 'doubt' in header or 'question' in header:
                current_key = 'patient_doubts'
            elif 'suggestion' in header or 'improvement' in header:
                current_key = 'app_suggestions'
            elif 'ai response' in header or 'response' in header:
                current_key = 'ai_response'
            else:
                current_key = None
        elif current_key:
            # Add to current section
            current_value.append(line)
    
    # Save the last section
    if current_key and current_value:
        analysis[current_key] = ' '.join(current_value).strip()
    
    return FeedbackAnalysis(
        **analysis,
        raw_feedback=original_feedback,
        analyzed_at=datetime.now().isoformat()
    )


@router.post("/analyze", response_model=FeedbackAnalysis)
async def analyze_patient_feedback(feedback: FeedbackRequest):
    """
    Analyze patient feedback about medicine usage and provide structured health insights.
    
    This endpoint uses AI to:
    - Assess patient's health status
    - Determine if medicine provided relief
    - Detect side effects
    - Identify emergency symptoms
    - Extract patient questions
    - Provide empathetic response
    """
    
    try:
        # Construct the healthcare analysis prompt
        system_prompt = """You are an AI healthcare assistant for an application called "AI Pharmacist".

A patient has submitted feedback after using medicine recommended by the system.

Your task is to carefully analyze the feedback and provide a structured response.

Instructions:
1. Identify the patient's current health status (improving, same, worsening).
2. Determine if the medicine provided relief (Yes, No, Partial).
3. Detect any side effects mentioned.
4. Detect any emergency symptoms (e.g., severe pain, chest pain, breathing difficulty, allergy, high fever, unconsciousness).
5. Extract any doubts or questions from the patient.
6. Identify suggestions to improve the application.
7. Generate a short, empathetic and professional response to the patient.

If severe or emergency symptoms are detected, clearly advise immediate medical consultation.

Provide output strictly in this format:

Health Status:
Relief Status:
Side Effects:
Emergency Risk:
Patient Doubts:
App Improvement Suggestions:
AI Response:"""

        user_message = f"""Patient Feedback:
"{feedback.feedback_text}"
"""
        
        # Add context if medicine name is provided
        if feedback.medicine_name:
            user_message = f"""Medicine: {feedback.medicine_name}

""" + user_message

        # Get LLM analysis
        logger.info(f"Analyzing feedback from user: {feedback.user_id or 'anonymous'}")
        
        llm_response = await llm_service.get_completion(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=0.3  # Lower temperature for more consistent analysis
        )
        
        # Parse the structured response
        analysis = parse_feedback_response(llm_response, feedback.feedback_text)
        
        # Log if emergency detected
        if "yes" in analysis.emergency_risk.lower() or "detected" in analysis.emergency_risk.lower():
            logger.warning(f"Emergency risk detected in feedback from user {feedback.user_id}: {analysis.emergency_risk}")
        
        # Save to database (non-blocking)
        try:
            await feedback_repo.create_feedback(
                feedback_text=feedback.feedback_text,
                health_status=analysis.health_status,
                relief_status=analysis.relief_status,
                side_effects=analysis.side_effects,
                emergency_risk=analysis.emergency_risk,
                patient_doubts=analysis.patient_doubts,
                app_suggestions=analysis.app_suggestions,
                ai_response=analysis.ai_response,
                analyzed_at=analysis.analyzed_at,
                user_id=feedback.user_id,
                patient_name=feedback.patient_name,
                phone_number=feedback.phone_number,
                medicine_name=feedback.medicine_name
            )
            logger.info(f"Feedback saved to database for user {feedback.user_id or 'anonymous'}")
        except Exception as db_error:
            # Log error but don't fail the request
            logger.error(f"Failed to save feedback to database: {db_error}")
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze feedback: {str(e)}"
        )


@router.get("/health")
async def feedback_health_check():
    """Health check endpoint for feedback service"""
    return {
        "status": "healthy",
        "service": "feedback_analysis",
        "llm_available": llm_service is not None
    }
