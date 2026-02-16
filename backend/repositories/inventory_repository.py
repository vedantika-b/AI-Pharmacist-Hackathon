"""
Inventory repository for database operations on inventory table.
"""

from supabase import Client
from uuid import UUID
from models.schemas import InventoryItem
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class InventoryRepository:
    """Repository for inventory-related database operations."""
    
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.table = "inventory"
    
    async def get_by_product_id(self, product_id: UUID) -> Optional[InventoryItem]:
        """Get inventory record for a product."""
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .eq("product_id", str(product_id))\
                .single()\
                .execute()
            
            if result.data:
                return InventoryItem(**result.data)
            return None
        
        except Exception as e:
            logger.error(f"Error fetching inventory for product {product_id}: {e}")
            return None
    
    async def adjust_quantity(
        self,
        product_id: UUID,
        quantity_delta: int,
        reason: str = "adjustment"
    ) -> InventoryItem:
        """
        Adjust inventory quantity (positive or negative).
        
        Args:
            product_id: Product to adjust
            quantity_delta: Amount to add (positive) or subtract (negative)
            reason: Reason for adjustment (for audit trail)
        
        Returns:
            Updated InventoryItem
        """
        try:
            # Get current inventory
            current = await self.get_by_product_id(product_id)
            if not current:
                raise ValueError(f"Inventory record not found for product {product_id}")
            
            new_quantity = current.quantity + quantity_delta
            
            if new_quantity < 0:
                raise ValueError(
                    f"Insufficient inventory. Current: {current.quantity}, "
                    f"Requested change: {quantity_delta}"
                )
            
            # Update inventory
            update_data = {
                "quantity": new_quantity,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Update last restock time if adding inventory
            if quantity_delta > 0:
                update_data["last_restocked_at"] = datetime.utcnow().isoformat()
            
            result = self.client.table(self.table)\
                .update(update_data)\
                .eq("product_id", str(product_id))\
                .execute()
            
            logger.info(
                f"Adjusted inventory for product {product_id}: "
                f"{current.quantity} -> {new_quantity} (delta: {quantity_delta}, reason: {reason})"
            )
            
            return InventoryItem(**result.data[0])
        
        except Exception as e:
            logger.error(f"Error adjusting inventory for product {product_id}: {e}")
            raise
    
    async def check_low_stock(self, product_id: UUID) -> bool:
        """Check if product is at or below reorder threshold."""
        try:
            inventory = await self.get_by_product_id(product_id)
            if not inventory:
                return True  # Treat missing inventory as low stock
            
            return inventory.quantity <= inventory.reorder_threshold
        
        except Exception as e:
            logger.error(f"Error checking stock level: {e}")
            return True
