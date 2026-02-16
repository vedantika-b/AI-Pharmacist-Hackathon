"""
Prescription repository for database operations on prescriptions table.
"""

from supabase import Client
from uuid import UUID
from models.schemas import Prescription
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class PrescriptionRepository:
    """Repository for prescription-related database operations."""
    
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.table = "prescriptions"
    
    async def get_by_id(self, prescription_id: UUID) -> Optional[Prescription]:
        """Get prescription by ID."""
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .eq("id", str(prescription_id))\
                .single()\
                .execute()
            
            if result.data:
                return Prescription(**result.data)
            return None
        
        except Exception as e:
            logger.error(f"Error fetching prescription {prescription_id}: {e}")
            return None
    
    async def get_by_user_and_product(
        self,
        user_id: UUID,
        product_id: UUID
    ) -> Optional[Prescription]:
        """
        Get active prescription for user and product.
        Returns the most recent active prescription.
        """
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .eq("user_id", str(user_id))\
                .eq("product_id", str(product_id))\
                .eq("status", "active")\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()
            
            if result.data and len(result.data) > 0:
                return Prescription(**result.data[0])
            return None
        
        except Exception as e:
            logger.error(f"Error fetching prescription for user {user_id}, product {product_id}: {e}")
            return None
    
    async def get_user_prescriptions(
        self,
        user_id: UUID,
        active_only: bool = True
    ) -> List[Prescription]:
        """Get all prescriptions for a user."""
        try:
            query = self.client.table(self.table)\
                .select("*")\
                .eq("user_id", str(user_id))
            
            if active_only:
                query = query.eq("status", "active")
            
            result = query.order("created_at", desc=True).execute()
            
            return [Prescription(**row) for row in result.data]
        
        except Exception as e:
            logger.error(f"Error fetching prescriptions for user {user_id}: {e}")
            return []
    
    async def update_refill(
        self,
        prescription_id: UUID,
        new_last_filled_date: str
    ) -> Prescription:
        """
        Update prescription after refill.
        Decrements refills_remaining and updates last_filled_date.
        """
        try:
            # Get current prescription
            current = await self.get_by_id(prescription_id)
            if not current:
                raise ValueError(f"Prescription {prescription_id} not found")
            
            # Update fields
            update_data = {
                "last_filled_date": new_last_filled_date,
                "refills_remaining": max(0, current.refills_remaining - 1)
            }
            
            # If no refills remaining, mark as used
            if update_data["refills_remaining"] == 0:
                update_data["status"] = "expired"
            
            result = self.client.table(self.table)\
                .update(update_data)\
                .eq("id", str(prescription_id))\
                .execute()
            
            logger.info(f"Updated prescription {prescription_id} after refill")
            
            return Prescription(**result.data[0])
        
        except Exception as e:
            logger.error(f"Error updating prescription {prescription_id}: {e}")
            raise
