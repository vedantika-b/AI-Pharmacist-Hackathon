from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator, model_validator
from functools import lru_cache
from typing import Optional, Literal
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Production-ready application settings with validation."""

    # Environment
    environment: Literal["development", "staging", "production"] = Field(
        default="development",
        alias="ENVIRONMENT"
    )
    
    # Application
    app_name: str = Field(default="AI Pharmacist API", alias="APP_NAME")
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")
    debug: bool = Field(default=False, alias="DEBUG")
    
    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT", ge=1024, le=65535)
    workers: int = Field(default=1, alias="WORKERS", ge=1, le=8)
    reload: bool = Field(default=False, alias="RELOAD")
    
    # Database
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")
    supabase_url: str = Field(alias="SUPABASE_URL")
    supabase_anon_key: str = Field(alias="SUPABASE_ANON_KEY")
    supabase_service_key: str = Field(alias="SUPABASE_SERVICE_KEY")
    db_pool_size: int = Field(default=10, alias="DB_POOL_SIZE", ge=5, le=50)
    db_max_overflow: int = Field(default=20, alias="DB_MAX_OVERFLOW", ge=10, le=100)
    
    # LLM Service
    groq_api_key: str = Field(alias="GROQ_API_KEY") 
    groq_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_MODEL")
    groq_temperature: float = Field(default=0.1, alias="GROQ_TEMPERATURE", ge=0.0, le=2.0)
    groq_max_tokens: int = Field(default=1024, alias="GROQ_MAX_TOKENS", ge=128, le=4096)
    groq_timeout: int = Field(default=30, alias="GROQ_TIMEOUT", ge=5, le=120)
    
    # ML Service
    ml_model_path: str = Field(default="models/ml/refill_predictor.joblib", alias="ML_MODEL_PATH")
    ml_scaler_path: str = Field(default="models/ml/scaler.joblib", alias="ML_SCALER_PATH")
    ml_prediction_threshold: float = Field(default=0.7, alias="ML_PREDICTION_THRESHOLD", ge=0.0, le=1.0)
    
    # Business Rules
    min_refill_days: int = Field(default=21, alias="MIN_REFILL_DAYS", ge=7, le=90)
    max_daily_dosage_multiplier: float = Field(default=2.0, alias="MAX_DAILY_DOSAGE_MULTIPLIER", ge=1.0, le=5.0)
    
    # API
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        alias="CORS_ORIGINS"
    )
    
    # Rate Limiting
    rate_limit_enabled: bool = Field(default=True, alias="RATE_LIMIT_ENABLED")
    rate_limit_requests: int = Field(default=100, alias="RATE_LIMIT_REQUESTS", ge=10, le=1000)
    rate_limit_window: int = Field(default=60, alias="RATE_LIMIT_WINDOW", ge=60, le=3600)
    
    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_format: str = Field(default="json", alias="LOG_FORMAT")
    
    # Security
    secret_key: Optional[str] = Field(default=None, alias="SECRET_KEY")
    allowed_hosts: list[str] = Field(default=["*"], alias="ALLOWED_HOSTS")
    
    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")
    enable_metrics: bool = Field(default=True, alias="ENABLE_METRICS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        populate_by_name=True,
        case_sensitive=False
    )
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @field_validator("allowed_hosts", mode="before")
    @classmethod
    def parse_allowed_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.environment == "production":
            if self.debug:
                logger.warning("Debug mode enabled in production!")
            if not self.secret_key:
                raise ValueError("SECRET_KEY required in production")
            if "*" in self.allowed_hosts:
                logger.warning("Wildcard allowed_hosts in production")
        return self
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        return self.environment == "development"

@lru_cache()
def get_settings():
    return Settings()
