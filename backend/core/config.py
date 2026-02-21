from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    """App settings loaded from .env"""

    # Application Settings
    app_name: str = Field(default="AI Pharmacist API", alias="APP_NAME")
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")
    debug: bool = Field(default=True, alias="DEBUG")
    
    # Supabase & Database
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")
    supabase_url: str = Field(alias="SUPABASE_URL")
    supabase_anon_key: str = Field(alias="SUPABASE_ANON_KEY")
    supabase_service_key: str = Field(alias="SUPABASE_SERVICE_KEY")
    
    # Groq LLM Configuration
    groq_api_key: str = Field(alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_MODEL")
    groq_temperature: float = Field(default=0.1, alias="GROQ_TEMPERATURE")
    groq_max_tokens: int = Field(default=1024, alias="GROQ_MAX_TOKENS")
    
    # Machine Learning Configuration
    ml_model_path: str = Field(default="models/ml/refill_predictor.joblib", alias="ML_MODEL_PATH")
    ml_scaler_path: str = Field(default="models/ml/scaler.joblib", alias="ML_SCALER_PATH")
    
    # Business Rules
    min_refill_days: int = Field(default=21, alias="MIN_REFILL_DAYS")
    max_daily_dosage_multiplier: float = Field(default=2.0, alias="MAX_DAILY_DOSAGE_MULTIPLIER")
    
    # API Configuration
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
        alias="CORS_ORIGINS"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        populate_by_name=True
    )

@lru_cache()
def get_settings():
    return Settings()
