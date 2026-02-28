"""
Pydantic models for request/response schemas and domain objects.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime, date
from enum import Enum
from uuid import UUID


# ==================== ENUMS ====================

class IntentType(str, Enum):
    """Intent types extracted by LLM."""
    ORDER_NEW = "ORDER_NEW"
    ORDER_REFILL = "ORDER_REFILL"
    INFO_REQUEST = "INFO_REQUEST"
    STOCK_CHECK = "STOCK_CHECK"
    GREETING = "GREETING"
    PRESCRIPTION_QUERY = "PRESCRIPTION_QUERY"  # Questions about uploaded prescription
    SYMPTOM_QUERY = "SYMPTOM_QUERY"  # User mentions symptoms like fever, headache, etc.
    UNKNOWN = "UNKNOWN"


class OrderStatus(str, Enum):
    """Order status values."""
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready_for_pickup"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ValidationResult(str, Enum):
    """Prescription validation result."""
    APPROVED = "approved"
    REQUIRES_RX = "requires_rx"
    INVALID_RX = "invalid_rx"
    TOO_EARLY = "too_early"
    DOSAGE_EXCEEDED = "dosage_exceeded"


# ==================== REQUEST SCHEMAS ====================

class OrderItemRequest(BaseModel):
    """Individual item in an order request."""
    product_id: UUID = Field(description="Product UUID from products table")
    quantity: int = Field(gt=0, le=1000, description="Quantity to order")
    prescription_id: Optional[UUID] = Field(default=None, description="Associated prescription if applicable")


class OrderRequest(BaseModel):
    """Request body for POST /order endpoint."""
    user_id: UUID = Field(description="User placing the order")
    items: list[OrderItemRequest] = Field(min_length=1, description="Items to order")
    delivery_method: Literal["pickup", "delivery"] = Field(default="pickup")
    notes: Optional[str] = Field(default=None, max_length=1000)
    
    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError("Order must contain at least one item")
        return v


# ==================== LLM SCHEMAS ====================

class ExtractedMedication(BaseModel):
    """Medication extracted by LLM."""
    name: str
    quantity: Optional[int] = None
    dosage: Optional[str] = None


class LLMIntentOutput(BaseModel):
    """Structured output from Groq LLM intent extraction."""
    intent: IntentType = Field(description="Detected user intent")
    confidence: float = Field(ge=0, le=1, description="Confidence score")
    medications: list[ExtractedMedication] = Field(default_factory=list)
    requires_prescription: bool = Field(default=False)
    summary: str = Field(description="Brief summary of the request")


# ==================== VALIDATION SCHEMAS ====================

class PrescriptionValidation(BaseModel):
    """Result of prescription validation."""
    is_valid: bool
    result: ValidationResult
    prescription_id: Optional[UUID] = None
    refills_remaining: Optional[int] = None
    days_until_refill_eligible: Optional[int] = None
    warnings: list[str] = Field(default_factory=list)
    blocking_reasons: list[str] = Field(default_factory=list)


class SafetyCheck(BaseModel):
    """Comprehensive safety check result."""
    approved: bool
    prescription_validation: Optional[PrescriptionValidation] = None
    dosage_check_passed: bool = True
    interaction_warnings: list[str] = Field(default_factory=list)


# ==================== ML PREDICTION SCHEMAS ====================

class RefillPrediction(BaseModel):
    """Refill date prediction from ML model."""
    prescription_id: UUID
    predicted_refill_date: date
    confidence_score: float = Field(ge=0, le=1)
    days_supply_remaining: int
    features_used: dict = Field(default_factory=dict)


# ==================== DATABASE MODELS ====================

class Product(BaseModel):
    """Product/Medication from database."""
    id: UUID
    name: str
    generic_name: Optional[str] = None
    price: float
    rx_required: bool
    controlled_substance_schedule: Optional[int] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None


class Prescription(BaseModel):
    """Prescription from database."""
    id: UUID
    user_id: UUID
    product_id: UUID
    rx_number: str
    quantity_prescribed: int
    days_supply: int
    refills_total: int
    refills_remaining: int
    last_filled_date: Optional[date] = None
    valid_until: date
    status: str


class InventoryItem(BaseModel):
    """Inventory record."""
    id: UUID
    product_id: UUID
    quantity: int
    reorder_threshold: int
    location: Optional[str] = None


# ==================== AI LOG SCHEMAS ====================

class AILogCreate(BaseModel):
    """Data for creating an AI log entry."""
    order_id: Optional[UUID] = None
    user_id: UUID
    agent_type: str = Field(description="conversation, safety, refill_prediction, action")
    intent_detected: Optional[str] = None
    llm_raw_output: Optional[dict] = None
    validation_result: Optional[dict] = None
    prediction_result: Optional[dict] = None
    decision_made: str
    confidence_score: Optional[float] = None
    processing_time_ms: Optional[int] = None


# ==================== RESPONSE SCHEMAS ====================

class OrderItemResponse(BaseModel):
    """Order item in response."""
    product_id: UUID
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    prescription_id: Optional[UUID] = None


class OrderResponse(BaseModel):
    """Response from order creation."""
    order_id: UUID
    order_number: str
    status: OrderStatus
    user_id: UUID
    items: list[OrderItemResponse]
    subtotal: float
    tax: float
    total: float
    delivery_method: str
    estimated_ready_at: Optional[datetime] = None
    created_at: datetime
    
    # AI Agent Outputs
    intent_detected: str
    llm_confidence: float
    safety_check: SafetyCheck
    refill_predictions: list[RefillPrediction] = Field(default_factory=list)
    inventory_updated: bool
    ai_log_id: UUID
    
    # User-facing messages
    message: str = Field(description="Human-readable message about the order")
    warnings: list[str] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


# ==================== PRESCRIPTION SCAN SCHEMAS ====================

class MedicationItem(BaseModel):
    """Medication extracted from OCR."""
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    quantity: Optional[int] = None
    instructions: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0, le=1)


class PrescriptionScanCreate(BaseModel):
    """Data for creating a prescription scan entry."""
    user_id: Optional[UUID] = None
    image_url: Optional[str] = None
    image_filename: Optional[str] = None
    extracted_text: str
    medications: list[MedicationItem] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)
    confidence: float = Field(default=0.0, ge=0, le=1)
    image_quality: str = "unknown"
    has_handwriting: bool = False
    prescription_date: Optional[date] = None
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None
    processing_time_ms: Optional[int] = None
    notes: Optional[str] = None


class PrescriptionScanResponse(BaseModel):
    """Response for prescription scan."""
    id: UUID
    user_id: Optional[UUID] = None
    image_url: Optional[str] = None
    extracted_text: str
    medications: list[MedicationItem]
    metadata: dict
    confidence: float
    image_quality: str
    has_handwriting: bool
    status: str
    prescription_date: Optional[date] = None
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None
    created_at: datetime
