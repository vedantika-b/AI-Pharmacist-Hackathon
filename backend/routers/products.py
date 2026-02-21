"""
Products/Medicines router for fetching medicine catalog.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from supabase import Client
from uuid import UUID
from typing import Optional, List
from core.database import get_supabase_client
from repositories.product_repository import ProductRepository
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[dict])
async def get_products(
    search: Optional[str] = Query(default=None, description="Search by name or generic name"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    prescription_required: Optional[bool] = Query(default=None, description="Filter by prescription requirement"),
    in_stock: bool = Query(default=True, description="Show only in-stock items"),
    limit: int = Query(default=50, ge=1, le=200, description="Maximum results"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get products/medicines catalog with optional filters.
    """
    try:
        product_repo = ProductRepository(supabase)
        
        # Build query
        query = supabase.table("medicines").select("*")
        
        # Apply filters
        if search:
            query = query.or_(
                f"name.ilike.%{search}%,generic_name.ilike.%{search}%,brand_name.ilike.%{search}%"
            )
        
        if category:
            query = query.eq("category", category)
        
        if prescription_required is not None:
            query = query.eq("prescription_required", prescription_required)
        
        if in_stock:
            query = query.gt("stock_quantity", 0)
        
        query = query.eq("is_active", True)
        query = query.order("name")
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        return result.data
    
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch products: {str(e)}"
        )


@router.get("/{product_id}", response_model=dict)
async def get_product(
    product_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get single product by ID.
    """
    try:
        result = supabase.table("medicines")\
            .select("*")\
            .eq("id", product_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found"
            )
        
        return result.data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/categories/list", response_model=List[str])
async def get_categories(
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get list of unique product categories.
    """
    try:
        result = supabase.table("medicines")\
            .select("category")\
            .eq("is_active", True)\
            .execute()
        
        categories = list(set(
            item["category"] for item in result.data 
            if item.get("category")
        ))
        categories.sort()
        
        return categories
    
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
