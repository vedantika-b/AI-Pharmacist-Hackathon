"""
Inventory service for stock management operations.
Handles inventory updates and low stock checks.
"""

from models.schemas import InventoryItem
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


class InventoryService:
    """Service for inventory management."""
    
    async def check_availability(
        self,
        product_id: UUID,
        quantity_requested: int,
        inventory_repo
    ) -> tuple[bool, str]:
        """
        Check if product is available in requested quantity.
        
        Args:
            product_id: Product to check
            quantity_requested: Quantity needed
            inventory_repo: Repository for inventory operations
        
        Returns:
            Tuple of (is_available, message)
        """
        try:
            inventory = await inventory_repo.get_by_product_id(product_id)
            
            if not inventory:
                return False, f"Product not found in inventory"
            
            if inventory.quantity < quantity_requested:
                return False, f"Insufficient stock. Available: {inventory.quantity}, Requested: {quantity_requested}"
            
            return True, "Product available"
        
        except Exception as e:
            logger.error(f"Error checking inventory: {e}")
            return False, f"Error checking availability: {str(e)}"
    
    async def update_inventory(
        self,
        product_id: UUID,
        quantity_delta: int,
        inventory_repo,
        reason: str = "order_fulfillment"
    ) -> InventoryItem:
        """
        Update inventory quantity.
        
        Args:
            product_id: Product to update
            quantity_delta: Change in quantity (negative for decrease)
            inventory_repo: Repository for inventory operations
            reason: Reason for adjustment
        
        Returns:
            Updated InventoryItem
        """
        try:
            updated_inventory = await inventory_repo.adjust_quantity(
                product_id=product_id,
                quantity_delta=quantity_delta,
                reason=reason
            )
            
            # Check if reorder needed
            if updated_inventory.quantity <= updated_inventory.reorder_threshold:
                logger.warning(
                    f"LOW STOCK ALERT: Product {product_id} at {updated_inventory.quantity} units "
                    f"(threshold: {updated_inventory.reorder_threshold})"
                )
                # In production, trigger reorder notification here
            
            return updated_inventory
        
        except Exception as e:
            logger.error(f"Error updating inventory: {e}")
            raise
    
    async def reserve_inventory(
        self,
        order_items: list[tuple[UUID, int]],
        inventory_repo
    ) -> list[tuple[bool, str]]:
        """
        Reserve inventory for multiple items.
        
        Args:
            order_items: List of (product_id, quantity) tuples
            inventory_repo: Repository for inventory operations
        
        Returns:
            List of (success, message) for each item
        """
        results = []
        
        for product_id, quantity in order_items:
            available, message = await self.check_availability(
                product_id, quantity, inventory_repo
            )
            results.append((available, message))
        
        return results
