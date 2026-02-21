"""Dashboard statistics endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from datetime import datetime, timedelta
from typing import Dict, Any, List

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get dashboard statistics including:
    - Active orders count
    - Total customers
    - Medicine stock info
    - Revenue (mock for now)
    """
    try:
        # Active orders (orders from last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        active_orders_query = """
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE created_at >= %s
        """
        result = db.execute(active_orders_query, (thirty_days_ago,))
        active_orders = result.fetchone()[0] if result else 0
        
        # Total customers
        customers_query = "SELECT COUNT(DISTINCT customer_id) as count FROM orders"
        result = db.execute(customers_query)
        total_customers = result.fetchone()[0] if result else 0
        
        # Medicine stock info
        medicines_query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock
            FROM medicines
        """
        result = db.execute(medicines_query)
        stock_info = result.fetchone()
        total_medicines = stock_info[0] if stock_info else 0
        low_stock_count = stock_info[1] if stock_info else 0
        
        # Revenue calculation (orders from last 30 days)
        revenue_query = """
            SELECT COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE created_at >= %s
        """
        result = db.execute(revenue_query, (thirty_days_ago,))
        revenue = result.fetchone()[0] if result else 0
        
        # Calculate growth percentages (mock for now - would need historical data)
        return {
            "active_orders": {
                "value": active_orders,
                "change": "+12%",  # Mock percentage
                "description": "from last month"
            },
            "total_customers": {
                "value": total_customers,
                "change": "+18%",  # Mock percentage
                "description": "from last month"
            },
            "medicines_stock": {
                "value": total_medicines,
                "low_stock": low_stock_count,
                "description": f"{low_stock_count} low stock items"
            },
            "revenue": {
                "value": float(revenue) if revenue else 0,
                "change": "+20%",  # Mock percentage
                "description": "from last month"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")


@router.get("/recent-orders", response_model=List[Dict[str, Any]])
async def get_recent_orders(limit: int = 10, db: Session = Depends(get_db)):
    """Get recent orders with customer and medicine details"""
    try:
        query = """
            SELECT 
                o.id,
                o.customer_id,
                o.total_amount,
                o.created_at,
                o.status,
                COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id, o.customer_id, o.total_amount, o.created_at, o.status
            ORDER BY o.created_at DESC
            LIMIT %s
        """
        result = db.execute(query, (limit,))
        
        orders = []
        for row in result:
            orders.append({
                "id": row[0],
                "customer_id": row[1],
                "total_amount": float(row[2]) if row[2] else 0,
                "created_at": row[3].isoformat() if row[3] else None,
                "status": row[4],
                "item_count": row[5] or 0
            })
        
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent orders: {str(e)}")


@router.get("/insights", response_model=List[Dict[str, str]])
async def get_ai_insights(db: Session = Depends(get_db)):
    """Get AI-powered insights and recommendations"""
    try:
        insights = []
        
        # Low stock alert
        low_stock_query = """
            SELECT COUNT(*) 
            FROM medicines 
            WHERE stock_quantity <= reorder_level
        """
        result = db.execute(low_stock_query)
        low_stock_count = result.fetchone()[0] if result else 0
        
        if low_stock_count > 0:
            insights.append({
                "type": "alert",
                "category": "Stock Alert",
                "message": f"{low_stock_count} medicines running low. Consider restocking soon.",
                "color": "blue"
            })
        
        # Critical refill predictions
        critical_refills_query = """
            SELECT COUNT(*) 
            FROM refill_predictions 
            WHERE days_remaining <= 5 
            AND notification_sent = false
        """
        result = db.execute(critical_refills_query)
        critical_count = result.fetchone()[0] if result else 0
        
        if critical_count > 0:
            insights.append({
                "type": "suggestion",
                "category": "AI Suggestion",
                "message": f"Schedule refill reminders for {critical_count} patients today.",
                "color": "purple"
            })
        
        # Recent order trend (last 7 days vs previous 7 days)
        trend_query = """
            SELECT 
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '14 days' 
                           AND created_at < NOW() - INTERVAL '7 days' THEN 1 END) as previous
            FROM orders
        """
        result = db.execute(trend_query)
        trend_data = result.fetchone()
        
        if trend_data:
            recent_count = trend_data[0] or 0
            previous_count = trend_data[1] or 1  # Avoid division by zero
            
            if recent_count > previous_count:
                growth = ((recent_count - previous_count) / previous_count) * 100
                insights.append({
                    "type": "trending",
                    "category": "Trending",
                    "message": f"Order volume increased by {growth:.0f}% this week.",
                    "color": "green"
                })
        
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch insights: {str(e)}")
