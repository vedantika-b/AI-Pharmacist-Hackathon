"""
Export router for data export functionality (CSV/JSON).
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import StreamingResponse
from supabase import Client
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID
import csv
import json
import io
from core.database import get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/export", tags=["Export"])


def dict_to_csv_row(data: list[dict]) -> str:
    """Convert list of dicts to CSV string."""
    if not data:
        return ""
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    return output.getvalue()


@router.get("/orders")
async def export_orders(
    format: Literal["csv", "json"] = Query(default="csv", description="Export format"),
    user_id: Optional[str] = Query(default=None, description="Filter by user ID"),
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Export orders in CSV or JSON format.
    """
    try:
        query = supabase.table("orders").select("*, order_items(*)")
        
        if user_id:
            query = query.eq("user_id", user_id)
        
        if start_date:
            query = query.gte("created_at", start_date)
        
        if end_date:
            query = query.lte("created_at", end_date)
        
        query = query.order("created_at", desc=True).limit(1000)
        result = query.execute()
        
        # Flatten data for CSV
        export_data = []
        for order in result.data:
            for item in order.get("order_items", []):
                export_data.append({
                    "order_id": order["id"],
                    "order_number": order["order_number"],
                    "order_date": order["created_at"],
                    "status": order["status"],
                    "customer_id": order["user_id"],
                    "product_id": item["medicine_id"],
                    "quantity": item["quantity"],
                    "unit_price": item["unit_price"],
                    "total_price": item["total_price"],
                    "order_total": order["total"]
                })
        
        if format == "csv":
            csv_content = dict_to_csv_row(export_data)
            return StreamingResponse(
                iter([csv_content]),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=orders_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                }
            )
        else:  # json
            return StreamingResponse(
                iter([json.dumps(export_data, indent=2)]),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=orders_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                }
            )
    
    except Exception as e:
        logger.error(f"Error exporting orders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/ai-logs")
async def export_ai_logs(
    format: Literal["csv", "json"] = Query(default="csv", description="Export format"),
    action_type: Optional[str] = Query(default=None, description="Filter by action type"),
    limit: int = Query(default=1000, ge=1, le=10000),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Export AI logs for transparency and audit.
    """
    try:
        query = supabase.table("ai_logs").select("*")
        
        if action_type:
            query = query.eq("action_type", action_type)
        
        query = query.order("created_at", desc=True).limit(limit)
        result = query.execute()
        
        # Simplify data for export
        export_data = []
        for log in result.data:
            export_data.append({
                "id": log["id"],
                "timestamp": log["created_at"],
                "user_id": log.get("user_id", ""),
                "action_type": log["action_type"],
                "model_used": log.get("model_used", ""),
                "confidence_score": log.get("confidence_score", ""),
                "execution_time_ms": log.get("execution_time_ms", 0),
                "success": log.get("success", True),
                "prompt_tokens": log.get("prompt_tokens", 0),
                "completion_tokens": log.get("completion_tokens", 0),
                "total_tokens": log.get("total_tokens", 0)
            })
        
        if format == "csv":
            csv_content = dict_to_csv_row(export_data)
            return StreamingResponse(
                iter([csv_content]),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=ai_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                }
            )
        else:  # json
            return StreamingResponse(
                iter([json.dumps(export_data, indent=2)]),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=ai_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                }
            )
    
    except Exception as e:
        logger.error(f"Error exporting AI logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/refill-predictions")
async def export_predictions(
    format: Literal["csv", "json"] = Query(default="csv", description="Export format"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Export refill predictions.
    """
    try:
        query = supabase.table("refill_predictions").select(
            "*, medicines(name, generic_name)"
        ).eq("is_active", True)
        
        query = query.order("predicted_refill_date").limit(1000)
        result = query.execute()
        
        export_data = []
        for pred in result.data:
            medicine = pred.get("medicines", {})
            export_data.append({
                "id": pred["id"],
                "customer_id": pred["customer_id"],
                "medicine_name": medicine.get("name", "Unknown"),
                "predicted_date": pred["predicted_refill_date"],
                "confidence_score": pred.get("confidence_score", 0),
                "notification_sent": pred.get("notification_sent", False),
                "created_at": pred["created_at"]
            })
        
        if format == "csv":
            csv_content = dict_to_csv_row(export_data)
            return StreamingResponse(
                iter([csv_content]),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                }
            )
        else:  # json
            return StreamingResponse(
                iter([json.dumps(export_data, indent=2)]),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                }
            )
    
    except Exception as e:
        logger.error(f"Error exporting predictions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
