"""
AI Logs router for retrieving and monitoring AI decision logs.
Provides transparent access to all AI decisions for audit trail and debugging.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from supabase import Client
from typing import Optional, List
from datetime import datetime
from core.database import get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-logs", tags=["AI Logs"])


@router.get("", response_model=List[dict])
async def get_ai_logs(
    user_id: Optional[str] = Query(default=None, description="Filter by user ID"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Retrieve AI decision logs for audit trail and transparency.
    
    Returns:
    - Log ID
    - User ID
    - Decision type (chat, validation, prediction)
    - Input data and AI output
    - Model version and confidence scores
    - Execution time and token usage
    - Cost estimation
    """
    try:
        query = supabase.table("ai_logs").select("*")
        
        if user_id:
            query = query.eq("user_id", user_id)
        
        query = query.order("created_at", desc=True)
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        return result.data if result.data else []
    
    except Exception as e:
        logger.error(f"Error fetching AI logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{log_id}", response_model=dict)
async def get_ai_log_detail(
    log_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Retrieve detailed information about a specific AI decision log.
    """
    try:
        result = supabase.table("ai_logs").select("*").eq("id", log_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"AI log with ID {log_id} not found"
            )
        
        return result.data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching AI log detail: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats/summary", response_model=dict)
async def get_ai_logs_summary(
    user_id: Optional[str] = Query(default=None, description="Filter by user ID"),
    days: int = Query(default=30, ge=1, le=365),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get summary statistics about AI logs for a time period.
    
    Returns:
    - Total number of AI decisions
    - Average confidence score
    - Decision types breakdown
    - Average execution time
    - Total tokens used
    - Cost breakdown by decision type
    """
    try:
        from datetime import datetime, timedelta
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        query = supabase.table("ai_logs").select("*")
        query = query.gte("created_at", start_date.isoformat())
        query = query.lte("created_at", end_date.isoformat())
        
        if user_id:
            query = query.eq("user_id", user_id)
        
        result = query.execute()
        logs = result.data if result.data else []
        
        if not logs:
            return {
                "total_decisions": 0,
                "avg_confidence": 0,
                "decision_types": {},
                "avg_execution_time_ms": 0,
                "total_tokens": 0,
                "total_cost": 0,
                "time_period_days": days
            }
        
        # Calculate statistics
        total_logs = len(logs)
        confidences = [log.get("confidence_score", 0) for log in logs if log.get("confidence_score")]
        execution_times = [log.get("execution_time_ms", 0) for log in logs if log.get("execution_time_ms")]
        
        decision_types = {}
        total_tokens = 0
        total_cost = 0
        
        for log in logs:
            decision_type = log.get("decision_type", "unknown")
            decision_types[decision_type] = decision_types.get(decision_type, 0) + 1
            
            total_tokens += log.get("tokens_used", 0)
            total_cost += log.get("cost_estimate", 0)
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0
        
        return {
            "total_decisions": total_logs,
            "avg_confidence": round(avg_confidence, 4),
            "decision_types": decision_types,
            "avg_execution_time_ms": round(avg_execution_time, 2),
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 4),
            "time_period_days": days
        }
    
    except Exception as e:
        logger.error(f"Error computing AI logs summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
