"""
Product repository for database operations on products table.
"""

from supabase import Client
from uuid import UUID
from models.schemas import Product
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class ProductRepository:
    """Repository for product-related database operations."""
    
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.table = "products"
    
    async def get_by_id(self, product_id: UUID) -> Optional[Product]:
        """Get product by ID."""
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .eq("id", str(product_id))\
                .single()\
                .execute()
            
            if result.data:
                return Product(**result.data)
            return None
        
        except Exception as e:
            logger.error(f"Error fetching product {product_id}: {e}")
            return None
    
    async def get_by_ids(self, product_ids: List[UUID]) -> List[Product]:
        """Get multiple products by IDs."""
        try:
            str_ids = [str(pid) for pid in product_ids]
            
            result = self.client.table(self.table)\
                .select("*")\
                .in_("id", str_ids)\
                .execute()
            
            return [Product(**row) for row in result.data]
        
        except Exception as e:
            logger.error(f"Error fetching products: {e}")
            return []
    
    async def search_by_name(self, name: str, limit: int = 10) -> List[Product]:
        """Search products by name (case-insensitive)."""
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .ilike("name", f"%{name}%")\
                .limit(limit)\
                .execute()
            
            return [Product(**row) for row in result.data]
        
        except Exception as e:
            logger.error(f"Error searching products: {e}")
            return []
