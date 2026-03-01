"""
Patient Feedback Repository
Handles database operations for patient feedback
"""

from typing import Optional, List
from datetime import datetime
from supabase import Client
from core.database import get_supabase_client
import logging

logger = logging.getLogger(__name__)


class FeedbackRepository:
    """Repository for patient feedback operations"""
    
    def __init__(self):
        self.client: Client = get_supabase_client()
        self.table = "patient_feedback"
    
    async def create_feedback(
        self,
        feedback_text: str,
        health_status: str,
        relief_status: str,
        side_effects: str,
        emergency_risk: str,
        patient_doubts: str,
        app_suggestions: str,
        ai_response: str,
        analyzed_at: str,
        user_id: Optional[str] = None,
        patient_name: Optional[str] = None,
        phone_number: Optional[str] = None,
        medicine_name: Optional[str] = None
    ) -> dict:
        """
        Store patient feedback and analysis in database
        
        Args:
            feedback_text: Raw patient feedback
            health_status: AI assessment of health status
            relief_status: Whether medicine provided relief
            side_effects: Detected side effects
            emergency_risk: Emergency symptom detection
            patient_doubts: Patient questions
            app_suggestions: App improvement suggestions
            ai_response: AI response to patient
            analyzed_at: Timestamp of analysis
            user_id: Optional user ID
            patient_name: Optional patient name
            medicine_name: Optional medicine name
        
        Returns:
            Created feedback record
        """
        try:
            feedback_data = {
                "user_id": user_id,
                "patient_name": patient_name,
                "phone_number": phone_number,
                "medicine_name": medicine_name,
                "feedback_text": feedback_text,
                "health_status": health_status,
                "relief_status": relief_status,
                "side_effects": side_effects,
                "emergency_risk": emergency_risk,
                "patient_doubts": patient_doubts,
                "app_suggestions": app_suggestions,
                "ai_response": ai_response,
                "analyzed_at": analyzed_at
            }
            
            result = self.client.table(self.table).insert(feedback_data).execute()
            
            if result.data:
                logger.info(f"Feedback saved successfully: {result.data[0]['id']}")
                return result.data[0]
            else:
                logger.error("Failed to save feedback - no data returned")
                return None
                
        except Exception as e:
            logger.error(f"Error saving feedback: {e}")
            # Return None on error but don't fail the request
            return None
    
    async def get_feedback_by_user(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[dict]:
        """
        Get feedback history for a user
        
        Args:
            user_id: User ID
            limit: Maximum results to return
        
        Returns:
            List of feedback records
        """
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error fetching feedback: {e}")
            return []
    
    async def get_recent_feedback(
        self,
        limit: int = 100
    ) -> List[dict]:
        """
        Get recent feedback (admin function)
        
        Args:
            limit: Maximum results to return
        
        Returns:
            List of recent feedback records
        """
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error fetching recent feedback: {e}")
            return []
    
    async def get_emergency_feedback(
        self,
        limit: int = 50
    ) -> List[dict]:
        """
        Get feedback with emergency risk detected
        
        Args:
            limit: Maximum results to return
        
        Returns:
            List of emergency feedback records
        """
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .ilike("emergency_risk", "%yes%")\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error fetching emergency feedback: {e}")
            return []
