"""
Order repository for database operations on orders table.
"""

from supabase import Client
from uuid import UUID, uuid4
from datetime import datetime
from models.schemas import OrderRequest, OrderItemRequest, OrderStatus
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class OrderRepository:
    """Repository for order-related database operations."""
    
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.table = "orders"
        self.items_table = "order_items"
    
    async def create_order(
        self,
        order_request: OrderRequest,
        order_items_data: list[dict],
        subtotal: float,
        tax: float,
        total: float
    ) -> dict:
        """
        Create a new order with items.
        
        Args:
            order_request: Original order request
            order_items_data: List of order item dictionaries
            subtotal: Calculated subtotal
            tax: Calculated tax
            total: Calculated total
        
        Returns:
            Created order record
        """
        try:
            # Generate order number (format: ORD-YYYY-MMDD-XXX)
            order_number = self._generate_order_number()
            
            # Create order record
            order_data = {
                "id": str(uuid4()),
                "order_number": order_number,
                "user_id": str(order_request.user_id),
                "status": OrderStatus.PENDING.value,
                "subtotal": subtotal,
                "tax": tax,
                "total": total,
                "delivery_method": order_request.delivery_method,
                "notes": order_request.notes,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table(self.table).insert(order_data).execute()
            order = result.data[0]
            
            # Create order items
            for item_data in order_items_data:
                item_data["order_id"] = order["id"]
                item_data["id"] = str(uuid4())
            
            items_result = self.client.table(self.items_table).insert(order_items_data).execute()
            
            # Attach items to order
            order["items"] = items_result.data
            
            logger.info(f"Created order {order_number} with {len(order_items_data)} items")
            
            return order
        
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            raise
    
    async def get_order_by_id(self, order_id: UUID) -> Optional[dict]:
        """Get order by ID with items."""
        try:
            result = self.client.table(self.table)\
                .select("*, order_items(*, products(*))")\
                .eq("id", str(order_id))\
                .single()\
                .execute()
            
            return result.data if result.data else None
        
        except Exception as e:
            logger.error(f"Error fetching order {order_id}: {e}")
            return None
    
    async def update_order_status(
        self,
        order_id: UUID,
        status: OrderStatus
    ) -> dict:
        """Update order status."""
        try:
            result = self.client.table(self.table)\
                .update({
                    "status": status.value,
                    "updated_at": datetime.utcnow().isoformat()
                })\
                .eq("id", str(order_id))\
                .execute()
            
            return result.data[0]
        
        except Exception as e:
            logger.error(f"Error updating order status: {e}")
            raise
    
    def _generate_order_number(self) -> str:
        """Generate unique order number."""
        now = datetime.utcnow()
        date_part = now.strftime("%Y-%m%d")
        
        # In production, use sequence or counter from database
        random_part = str(now.microsecond)[:3].zfill(3)
        
        return f"ORD-{date_part}-{random_part}"
