"""
Predictions router for refill predictions and alerts.
Generates stock alerts from real inventory data.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from supabase import Client
from uuid import UUID
from typing import Optional, List
from datetime import date, datetime, timedelta
from core.database import get_supabase_client
from services.ml_service import MLService
from repositories.prescription_repository import PrescriptionRepository
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictions", tags=["Predictions"])

ml_service = MLService()

# Track notification status in memory (would be in DB in production)
notification_status = {}


class NotifyRequest(BaseModel):
    alert_id: str
    notification_type: str = "email"  # email, sms, push


@router.get("/refills", response_model=List[dict])
async def get_refill_predictions(
    user_id: Optional[str] = Query(default=None, description="Filter by user ID"),
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by status: critical, low, safe"),
    limit: int = Query(default=50, ge=1, le=200),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get stock alerts based on real inventory data.
    
    Returns alerts with status:
    - critical: Stock at or below minimum level
    - low: Stock above minimum but approaching reorder level (within 50% buffer)
    - safe: Stock well above minimum level
    """
    try:
        # Check if supabase is available
        if supabase is None:
            raise Exception("Supabase client not initialized")
        
        # Fetch real inventory data from medicines table
        query = supabase.table("medicines").select("*").eq("is_active", True)
        result = query.execute()
        
        if not result.data:
            logger.warning("No medicines found in database")
            return []
        
        today = date.today()
        alerts = []
        
        for medicine in result.data:
            stock_qty = medicine.get("stock_quantity", 0)
            min_stock = medicine.get("min_stock_level", 10)
            reorder_level = medicine.get("reorder_level", 20)
            
            # Calculate status based on stock levels
            # Assume average daily consumption based on reorder level
            avg_daily_consumption = max(reorder_level / 30, 1)  # Estimate ~30 days for reorder
            days_remaining = int(stock_qty / avg_daily_consumption) if avg_daily_consumption > 0 else 999
            
            # Determine status
            if stock_qty <= min_stock:
                alert_status = "critical"
            elif stock_qty <= min_stock * 1.5:  # Within 50% buffer of minimum
                alert_status = "low"
            else:
                alert_status = "safe"
            
            # Filter by status if requested
            if status_filter and alert_status != status_filter:
                continue
            
            # Calculate predicted refill date
            predicted_refill_date = (today + timedelta(days=days_remaining)).isoformat()
            
            # Calculate confidence score based on data quality
            confidence_score = 0.85 if stock_qty > 0 else 0.5
            
            alert_id = f"alert-{medicine['id'][:8]}"
            
            alert = {
                "id": alert_id,
                "medicine_id": medicine["id"],
                "medicine_name": medicine.get("name", "Unknown"),
                "generic_name": medicine.get("generic_name", ""),
                "brand_name": medicine.get("brand_name", ""),
                "category": medicine.get("category", "General"),
                "current_stock": stock_qty,
                "min_stock_level": min_stock,
                "reorder_level": reorder_level,
                "daily_consumption": round(avg_daily_consumption, 2),
                "predicted_refill_date": predicted_refill_date,
                "days_remaining": days_remaining,
                "status": alert_status,
                "confidence_score": confidence_score,
                "price": medicine.get("price", 0),
                "form": medicine.get("form", ""),
                "strength": medicine.get("strength", ""),
                "last_order_date": (today - timedelta(days=7)).isoformat(),  # Placeholder
                "notification_sent": notification_status.get(alert_id, False),
                "is_active": True
            }
            
            alerts.append(alert)
        
        # Sort by status priority (critical first) then by days remaining
        status_priority = {"critical": 0, "low": 1, "safe": 2}
        alerts.sort(key=lambda x: (status_priority.get(x["status"], 3), x["days_remaining"]))
        
        return alerts[:limit]
    
    except Exception as e:
        logger.error(f"Error fetching stock alerts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stock alerts: {str(e)}"
        )


@router.get("/refills/{alert_id}", response_model=dict)
async def get_alert_detail(
    alert_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get detailed information about a specific stock alert.
    """
    try:
        # Extract medicine ID from alert ID (format: alert-{first8chars})
        medicine_id_partial = alert_id.replace("alert-", "")
        
        # Fetch all medicines and find matching one
        result = supabase.table("medicines").select("*").eq("is_active", True).execute()
        
        medicine = None
        for med in result.data:
            if med["id"].startswith(medicine_id_partial):
                medicine = med
                break
        
        if not medicine:
            raise HTTPException(status_code=404, detail="Alert not found")
        stock_qty = medicine.get("stock_quantity", 0)
        min_stock = medicine.get("min_stock_level", 10)
        reorder_level = medicine.get("reorder_level", 20)
        
        avg_daily_consumption = max(reorder_level / 30, 1)
        days_remaining = int(stock_qty / avg_daily_consumption) if avg_daily_consumption > 0 else 999
        
        if stock_qty <= min_stock:
            alert_status = "critical"
        elif stock_qty <= min_stock * 1.5:
            alert_status = "low"
        else:
            alert_status = "safe"
        
        today = date.today()
        
        return {
            "id": alert_id,
            "medicine": {
                "id": medicine["id"],
                "name": medicine.get("name", "Unknown"),
                "generic_name": medicine.get("generic_name", ""),
                "brand_name": medicine.get("brand_name", ""),
                "description": medicine.get("description", ""),
                "category": medicine.get("category", "General"),
                "form": medicine.get("form", ""),
                "strength": medicine.get("strength", ""),
                "price": medicine.get("price", 0),
                "prescription_required": medicine.get("prescription_required", False)
            },
            "stock_info": {
                "current_stock": stock_qty,
                "min_stock_level": min_stock,
                "reorder_level": reorder_level,
                "daily_consumption": round(avg_daily_consumption, 2),
                "days_remaining": days_remaining
            },
            "alert_info": {
                "status": alert_status,
                "predicted_refill_date": (today + timedelta(days=days_remaining)).isoformat(),
                "notification_sent": notification_status.get(alert_id, False),
                "last_notification_date": None,
                "recommendation": get_recommendation(alert_status, days_remaining, stock_qty, min_stock)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching alert detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refills/{alert_id}/notify", response_model=dict)
async def send_notification(
    alert_id: str,
    request: NotifyRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Send notification for a stock alert.
    In production, this would integrate with email/SMS services.
    """
    try:
        # Mark as notified
        notification_status[alert_id] = True
        
        # Log the notification
        logger.info(f"Notification sent for alert {alert_id} via {request.notification_type}")
        
        return {
            "success": True,
            "alert_id": alert_id,
            "notification_type": request.notification_type,
            "message": f"Notification sent successfully via {request.notification_type}",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error sending notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_recommendation(status: str, days_remaining: int, current_stock: int, min_stock: int) -> str:
    """Generate a recommendation based on alert status."""
    if status == "critical":
        return f"URGENT: Stock is critically low ({current_stock} units). Place an order immediately to avoid stockout."
    elif status == "low":
        return f"Stock is running low with approximately {days_remaining} days of supply remaining. Consider placing an order soon."
    else:
        return f"Stock levels are healthy with {days_remaining} days of supply. No immediate action required."


@router.get("/stats", response_model=dict)
async def get_prediction_stats(
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get aggregated statistics about stock alerts.
    """
    try:
        # Fetch all alerts to compute stats
        alerts = await get_refill_predictions(supabase=supabase)
        
        critical_count = sum(1 for a in alerts if a.get("status") == "critical")
        low_count = sum(1 for a in alerts if a.get("status") == "low")
        safe_count = sum(1 for a in alerts if a.get("status") == "safe")
        
        return {
            "total_alerts": len(alerts),
            "critical": critical_count,
            "low": low_count,
            "safe": safe_count,
            "last_updated": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error fetching alert stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
