"""
Database connection management for Supabase PostgreSQL.
Provides both Supabase client (with PostgREST) and direct asyncpg connection.
"""

from supabase import create_client, Client
from functools import lru_cache
from typing import Optional
import asyncpg
from core.config import get_settings

settings = get_settings()


class SupabaseManager:
    """
    Singleton pattern for Supabase client management.
    Uses service_role key to bypass Row Level Security for backend operations.
    """
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance."""
        if cls._instance is None:
            cls._instance = create_client(
                supabase_url=settings.supabase_url,
                supabase_key=settings.supabase_service_key
            )
        return cls._instance


class DatabasePool:
    """
    AsyncPG connection pool for direct PostgreSQL operations.
    Useful for complex queries and transactions.
    """
    _pool: Optional[asyncpg.Pool] = None
    
    @classmethod
    async def get_pool(cls) -> asyncpg.Pool:
        """Get or create database connection pool."""
        if cls._pool is None:
            if not settings.database_url:
                raise ValueError(
                    "DATABASE_URL not configured. "
                    "Add it to .env if you need direct PostgreSQL access."
                )
            cls._pool = await asyncpg.create_pool(
                settings.database_url,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
        return cls._pool
    
    @classmethod
    async def close_pool(cls):
        """Close database connection pool."""
        if cls._pool is not None:
            await cls._pool.close()
            cls._pool = None


@lru_cache()
def get_supabase_client() -> Client:
    """Dependency injection helper for Supabase client."""
    try:
        return SupabaseManager.get_client()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to initialize Supabase client: {e}. Endpoints will use mock data.")
        # Return None - endpoints will check and use mock data
        return None


async def get_db_pool() -> asyncpg.Pool:
    """Dependency injection helper for database pool."""
    return await DatabasePool.get_pool()
