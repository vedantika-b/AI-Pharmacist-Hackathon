"""
Products/Medicines router for fetching medicine catalog.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from supabase import Client
from uuid import UUID
from typing import Optional, List
from core.database import get_supabase_client
from repositories.product_repository import ProductRepository
from mock_data import MOCK_MEDICINES
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
    Returns mock data in development if database unavailable.
    """
    try:
        # Check if supabase client is available
        if supabase is None:
            raise Exception("Supabase client not initialized")
        
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
        logger.warning(f"Database error, using mock data: {e}")
        # Return mock data for development
        medicines = MOCK_MEDICINES
        
        # Apply filters to mock data
        if search:
            search_lower = search.lower()
            medicines = [m for m in medicines if 
                        search_lower in m.get("name", "").lower() or
                        search_lower in m.get("generic_name", "").lower() or
                        search_lower in m.get("brand_name", "").lower()]
        
        if category:
            medicines = [m for m in medicines if m.get("category") == category]
        
        if prescription_required is not None:
            medicines = [m for m in medicines if m.get("prescription_required") == prescription_required]
        
        if in_stock:
            medicines = [m for m in medicines if m.get("stock_quantity", 0) > 0]
        
        medicines = sorted(medicines, key=lambda x: x.get("name", ""))
        
        # Apply pagination
        return medicines[offset:offset + limit]


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
        logger.warning(f"Database error, checking mock data: {e}")
        # Try mock data
        for medicine in MOCK_MEDICINES:
            if medicine["id"] == product_id:
                return medicine
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found"
        )


@router.get("/categories/list", response_model=List[str])
async def get_categories(
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get list of unique product categories.
    """
    try:
        # Check if supabase is available
        if supabase is None:
            raise Exception("Supabase client not initialized")
        
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
        logger.warning(f"Database error, using mock categories: {e}")
        # Return mock categories
        categories = list(set(m.get("category") for m in MOCK_MEDICINES if m.get("category")))
        categories.sort()
        return categories
