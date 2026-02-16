"""
AI Log repository for database operations on ai_logs table.
Logs all AI agent decisions and processing details.
"""

from supabase import Client
from uuid import UUID, uuid4
from datetime import datetime
from models.schemas import AILogCreate
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class AILogRepository:
    """Repository for AI log-related database operations."""
    
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.table = "ai_logs"
    
    async def create_log(self, log_data: AILogCreate) -> dict:
        """
        Create an AI log entry.
        Records all AI agent processing details for audit and debugging.
        
        Args:
            log_data: Log data to insert
        
        Returns:
            Created log record with ID
        """
        try:
            log_record = {
                "id": str(uuid4()),
                "order_id": str(log_data.order_id) if log_data.order_id else None,
                "user_id": str(log_data.user_id),
                "agent_type": log_data.agent_type,
                "intent_detected": log_data.intent_detected,
                "llm_raw_output": log_data.llm_raw_output,
                "validation_result": log_data.validation_result,
                "prediction_result": log_data.prediction_result,
                "decision_made": log_data.decision_made,
                "confidence_score": log_data.confidence_score,
                "processing_time_ms": log_data.processing_time_ms,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table(self.table).insert(log_record).execute()
            
            logger.info(f"Created AI log for agent: {log_data.agent_type}")
            
            return result.data[0]
        
        except Exception as e:
            logger.error(f"Error creating AI log: {e}")
            # Don't raise - logging failures shouldn't break the main flow
            return {"id": str(uuid4()), "error": str(e)}
    
    async def get_logs_by_order(self, order_id: UUID) -> list[dict]:
        """Get all AI logs for a specific order."""
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .eq("order_id", str(order_id))\
                .order("created_at", desc=True)\
                .execute()
            
            return result.data
        
        except Exception as e:
            logger.error(f"Error fetching AI logs for order {order_id}: {e}")
            return []
    
    async def get_logs_by_user(
        self,
        user_id: UUID,
        limit: int = 50
    ) -> list[dict]:
        """Get recent AI logs for a user."""
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .eq("user_id", str(user_id))\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data
        
        except Exception as e:
            logger.error(f"Error fetching AI logs for user {user_id}: {e}")
            return []
