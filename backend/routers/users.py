"""
User Profile and Settings router - User profile management and preferences.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from supabase import Client
from uuid import UUID
from core.database import get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


class UserProfile(BaseModel):
    """User profile data model."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    allergies: Optional[list[str]] = None
    chronic_conditions: Optional[list[str]] = None
    emergency_contact: Optional[Dict[str, str]] = None
    preferences: Optional[Dict[str, Any]] = None


class UserNotificationPreferences(BaseModel):
    """User notification preferences."""
    refill_alerts: bool = True
    email_notifications: bool = True
    sms_notifications: bool = False
    low_stock_alerts: bool = True
    controlled_substance_warnings: bool = True


class UserSettingsUpdate(BaseModel):
    """User settings update model."""
    profile: Optional[UserProfile] = None
    notifications: Optional[UserNotificationPreferences] = None


@router.get("/{user_id}/profile", response_model=dict)
async def get_user_profile(
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get user profile and extended information.
    """
    try:
        result = supabase.table("user_profiles").select("*").eq("id", user_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User profile for ID {user_id} not found"
            )
        
        return result.data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{user_id}/profile", response_model=dict)
async def update_user_profile(
    user_id: str,
    profile_data: UserProfile,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Update user profile information.
    """
    try:
        # Build update data - only include provided fields
        update_data = {}
        
        if profile_data.full_name is not None:
            update_data["full_name"] = profile_data.full_name
        if profile_data.phone is not None:
            update_data["phone"] = profile_data.phone
        if profile_data.date_of_birth is not None:
            update_data["date_of_birth"] = profile_data.date_of_birth
        
        # Handle metadata JSONB fields
        metadata = {}
        if profile_data.allergies is not None:
            metadata["allergies"] = profile_data.allergies
        if profile_data.chronic_conditions is not None:
            metadata["chronic_conditions"] = profile_data.chronic_conditions
        if profile_data.emergency_contact is not None:
            metadata["emergency_contact"] = profile_data.emergency_contact
        if profile_data.preferences is not None:
            metadata["preferences"] = profile_data.preferences
        
        if metadata:
            update_data["metadata"] = metadata
        
        result = supabase.table("user_profiles").update(update_data).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User profile for ID {user_id} not found"
            )
        
        logger.info(f"Updated profile for user {user_id}")
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{user_id}/notifications", response_model=UserNotificationPreferences)
async def get_notification_preferences(
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get user notification preferences.
    """
    try:
        # Try to get user profile, return defaults if not found
        try:
            result = supabase.table("user_profiles").select("metadata").eq("id", user_id).single().execute()
        except Exception as db_error:
            # If user not found, return default preferences
            logger.info(f"User profile not found for {user_id}, returning defaults")
            return UserNotificationPreferences()
        
        if not result.data:
            # Return defaults if user not found
            return UserNotificationPreferences()
        
        preferences = result.data.get("metadata", {}).get("notification_preferences", {})
        return UserNotificationPreferences(**preferences) if preferences else UserNotificationPreferences()
    
    except Exception as e:
        logger.error(f"Error fetching notification preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{user_id}/notifications", response_model=dict)
async def update_notification_preferences(
    user_id: str,
    preferences: UserNotificationPreferences,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Update user notification preferences.
    """
    try:
        # Get current metadata and update notification preferences
        result = supabase.table("user_profiles").select("metadata").eq("id", user_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User profile for ID {user_id} not found"
            )
        
        metadata = result.data.get("metadata", {})
        metadata["notification_preferences"] = preferences.dict()
        
        update_result = supabase.table("user_profiles").update({"metadata": metadata}).eq("id", user_id).execute()
        
        logger.info(f"Updated notification preferences for user {user_id}")
        return {"success": True, "preferences": preferences.dict()}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notification preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{user_id}/health-profile", response_model=dict)
async def get_health_profile(
    user_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Get user health profile information (allergies, conditions, medications).
    """
    try:
        result = supabase.table("user_profiles").select("metadata").eq("id", user_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User profile for ID {user_id} not found"
            )
        
        metadata = result.data.get("metadata", {})
        
        return {
            "allergies": metadata.get("allergies", []),
            "chronic_conditions": metadata.get("chronic_conditions", []),
            "emergency_contact": metadata.get("emergency_contact", {}),
            "preferences": metadata.get("preferences", {})
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching health profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{user_id}/health-profile", response_model=dict)
async def update_health_profile(
    user_id: str,
    allergies: Optional[list[str]] = Query(None),
    chronic_conditions: Optional[list[str]] = Query(None),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Update user health profile information.
    """
    try:
        # Get current metadata
        result = supabase.table("user_profiles").select("metadata").eq("id", user_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User profile for ID {user_id} not found"
            )
        
        metadata = result.data.get("metadata", {})
        
        if allergies is not None:
            metadata["allergies"] = allergies
        if chronic_conditions is not None:
            metadata["chronic_conditions"] = chronic_conditions
        
        update_result = supabase.table("user_profiles").update({"metadata": metadata}).eq("id", user_id).execute()
        
        logger.info(f"Updated health profile for user {user_id}")
        return {"success": True, "allergies": metadata.get("allergies"), "chronic_conditions": metadata.get("chronic_conditions")}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating health profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
