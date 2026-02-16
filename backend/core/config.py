"""
Configuration management using Pydantic Settings.
Loads environment variables for database, API keys, and app settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App Settings
    app_name: str = "AI Pharmacist API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Supabase Configuration
    supabase_url: str
    supabase_service_key: str  # Service role key for backend operations
    
    # PostgreSQL Direct Connection (alternative to Supabase client)
    database_url: str  # postgresql://user:password@host:port/database
    
    # Groq LLM Configuration
    groq_api_key: str
    groq_model: str = "llama-3.1-8b-instant"
    groq_temperature: float = 0.1
    groq_max_tokens: int = 1024
    
    # ML Model Configuration
    ml_model_path: str = "models/ml/refill_predictor.joblib"
    ml_scaler_path: str = "models/ml/scaler.joblib"
    
    # Business Rules
    min_refill_days: int = 21  # Minimum days before refill is allowed
    max_daily_dosage_multiplier: float = 2.0  # Maximum dosage vs prescribed
    
    # API Settings
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance.
    Use lru_cache to create a singleton pattern.
    """
    return Settings()
