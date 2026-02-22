"""Dashboard statistics endpoints"""
from fastapi import APIRouter
from datetime import datetime, timedelta
from typing import Dict, Any, List

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats():
    """Get dashboard statistics (mock data for hackathon)"""
    return {
        "active_orders": {
            "value": 42,
            "change": "+12%",
            "description": "from last month"
        },
        "total_customers": {
            "value": 1250,
            "change": "+18%",
            "description": "from last month"
        },
        "medicines_stock": {
            "value": 450,
            "low_stock": 23,
            "description": "23 low stock items"
        },
        "revenue": {
            "value": 125000.00,
            "change": "+20%",
            "description": "from last month"
        }
    }


@router.get("/recent-orders", response_model=List[Dict[str, Any]])
async def get_recent_orders(limit: int = 10):
    """Get recent orders (mock data for hackathon)"""
    base_date = datetime.now()
    return [
        {
            "id": f"ORD{i:04d}",
            "customer_id": f"CUST{i:03d}",
            "total_amount": 250.00 + (i * 10),
            "created_at": (base_date - timedelta(hours=i)).isoformat(),
            "status": "completed" if i % 2 == 0 else "pending",
            "item_count": 2 + (i % 3)
        }
        for i in range(1, limit + 1)
    ]


@router.get("/insights", response_model=List[Dict[str, str]])
async def get_ai_insights():
    """Get AI-powered insights (mock data for hackathon)"""
    return [
        {
            "type": "alert",
            "category": "Stock Alert",
            "message": "23 medicines running low. Consider restocking soon.",
            "color": "blue"
        },
        {
            "type": "suggestion",
            "category": "Refill Predictions",
            "message": "15 patients need refills in the next 5 days.",
            "color": "green"
        },
        {
            "type": "warning",
            "category": "High Demand",
            "message": "Metformin showing 30% increase in orders this week.",
            "color": "yellow"
        }
    ]


@router.get("/trends", response_model=List[Dict[str, Any]])
async def get_order_trends():
    """Get order trends (mock data for hackathon)"""
    base_date = datetime.now()
    return [
        {
            "date": (base_date - timedelta(days=i)).strftime("%Y-%m-%d"),
            "orders": 20 + (i % 5) * 3,
            "revenue": 5000 + (i % 7) * 500
        }
        for i in range(7)
    ][::-1]  # Reverse to show oldest first
