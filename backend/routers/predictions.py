"""
Predictions router for refill predictions and alerts.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from supabase import Client
from uuid import UUID
from typing import Optional, List
from datetime import date, timedelta
from core.database import get_supabase_client
from services.ml_service import MLService
from repositories.prescription_repository import PrescriptionRepository
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictions", tags=["Predictions"])

ml_service = MLService()


@router.get("/refills", response_model=List[dict])
async def get_refill_predictions(
    user_id: Optional[str] = Query(default=None, description="Filter by user ID"),
    status: Optional[str] = Query(default=None, description="Filter by status: critical, low, safe"),
    limit: int = Query(default=50, ge=1, le=200),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get refill predictions/alerts.
    
    Returns predictions with status:
    - critical: <= 5 days remaining
    - low: 6-14 days remaining
    - safe: > 14 days remaining
    """
    try:
        query = supabase.table("refill_predictions").select(
            "*, medicines(name, generic_name, dosage_form, strength)"
        )
        
        if user_id:
            query = query.eq("customer_id", user_id)
        
        query = query.eq("is_active", True)
        query = query.order("predicted_refill_date")
        query = query.limit(limit)
        
        result = query.execute()
        
        # Add status based on days remaining
        today = date.today()
        predictions = []
        
        for pred in result.data:
            pred_date = date.fromisoformat(pred["predicted_refill_date"])
            days_remaining = (pred_date - today).days
            
            # Determine status
            if days_remaining <= 5:
                pred_status = "critical"
            elif days_remaining <= 14:
                pred_status = "low"
            else:
                pred_status = "safe"
            
            # Filter by status if requested
            if status and pred_status != status:
                continue
            
            pred["status"] = pred_status
            pred["days_remaining"] = days_remaining
            pred["medicine_name"] = pred.get("medicines", {}).get("name", "Unknown")
            
            predictions.append(pred)
        
        return predictions
    
    except Exception as e:
        logger.error(f"Error fetching predictions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/refills/generate", response_model=dict)
async def generate_refill_predictions(
    user_id: UUID,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Generate refill predictions for a specific user.
    This would typically run as a background job.
    """
    try:
        prescription_repo = PrescriptionRepository(supabase)
        
        # Get active prescriptions
        prescriptions = await prescription_repo.get_user_prescriptions(
            user_id, active_only=True
        )
        
        if not prescriptions:
            return {
                "message": "No active prescriptions found for user",
                "predictions_generated": 0
            }
        
        predictions_created = 0
        
        # Generate predictions for each prescription
        for prescription in prescriptions:
            prediction = ml_service.predict_refill_date(prescription)
            
            # Store prediction in database
            prediction_data = {
                "customer_id": str(user_id),
                "medicine_id": str(prescription.product_id),
                "predicted_refill_date": prediction.predicted_refill_date.isoformat(),
                "confidence_score": prediction.confidence_score,
                "average_consumption_days": prescription.days_supply,
                "last_order_date": prescription.last_filled_date.isoformat() if prescription.last_filled_date else None,
                "model_name": "RandomForestRegressor",
                "model_version": "1.0",
                "features_used": prediction.features_used,
                "is_active": True,
                "notification_sent": False
            }
            
            # Upsert prediction
            supabase.table("refill_predictions")\
                .upsert(prediction_data)\
                .execute()
            
            predictions_created += 1
        
        logger.info(f"Generated {predictions_created} predictions for user {user_id}")
        
        return {
            "message": "Predictions generated successfully",
            "predictions_generated": predictions_created
        }
    
    except Exception as e:
        logger.error(f"Error generating predictions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats", response_model=dict)
async def get_prediction_stats(
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get aggregated statistics about refill predictions.
    """
    try:
        result = supabase.table("refill_predictions")\
            .select("*")\
            .eq("is_active", True)\
            .execute()
        
        today = date.today()
        critical_count = 0
        low_count = 0
        safe_count = 0
        
        for pred in result.data:
            pred_date = date.fromisoformat(pred["predicted_refill_date"])
            days_remaining = (pred_date - today).days
            
            if days_remaining <= 5:
                critical_count += 1
            elif days_remaining <= 14:
                low_count += 1
            else:
                safe_count += 1
        
        return {
            "total_predictions": len(result.data),
            "critical": critical_count,
            "low": low_count,
            "safe": safe_count
        }
    
    except Exception as e:
        logger.error(f"Error fetching prediction stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
