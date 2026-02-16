"""
Validation service for prescription and safety checks.
Implements rule-based logic for prescription requirements and dosage validation.
"""

from models.schemas import (
    PrescriptionValidation, SafetyCheck, ValidationResult,
    Product, Prescription, OrderItemRequest
)
from datetime import date, timedelta
from typing import Optional, List
from core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class ValidationService:
    """Service for prescription and safety validation."""
    
    def validate_prescription_requirement(
        self,
        product: Product,
        prescription: Optional[Prescription],
        quantity_requested: int
    ) -> PrescriptionValidation:
        """
        Validate prescription requirements for a product order.
        
        Business Rules:
        1. If product requires RX and no prescription -> REQUIRES_RX
        2. If prescription expired -> INVALID_RX
        3. If no refills remaining -> INVALID_RX
        4. If too early to refill (< min_refill_days) -> TOO_EARLY
        5. If requested quantity exceeds prescribed -> DOSAGE_EXCEEDED
        6. Otherwise -> APPROVED
        
        Args:
            product: Product being ordered
            prescription: Associated prescription (if any)
            quantity_requested: Quantity customer wants to order
        
        Returns:
            PrescriptionValidation with result and details
        """
        warnings = []
        blocking_reasons = []
        
        # Rule 1: Check if prescription required but missing
        if product.rx_required and prescription is None:
            return PrescriptionValidation(
                is_valid=False,
                result=ValidationResult.REQUIRES_RX,
                blocking_reasons=[f"{product.name} requires a valid prescription"]
            )
        
        # If no prescription required, approve immediately
        if not product.rx_required:
            return PrescriptionValidation(
                is_valid=True,
                result=ValidationResult.APPROVED
            )
        
        # From here, product requires RX and we have a prescription
        assert prescription is not None
        
        # Rule 2: Check expiration
        if prescription.valid_until < date.today():
            return PrescriptionValidation(
                is_valid=False,
                result=ValidationResult.INVALID_RX,
                prescription_id=prescription.id,
                blocking_reasons=[f"Prescription expired on {prescription.valid_until}"]
            )
        
        # Check if prescription is active
        if prescription.status != "active":
            return PrescriptionValidation(
                is_valid=False,
                result=ValidationResult.INVALID_RX,
                prescription_id=prescription.id,
                blocking_reasons=[f"Prescription status is '{prescription.status}'"]
            )
        
        # Rule 3: Check refills remaining
        if prescription.refills_remaining <= 0:
            return PrescriptionValidation(
                is_valid=False,
                result=ValidationResult.INVALID_RX,
                prescription_id=prescription.id,
                refills_remaining=0,
                blocking_reasons=["No refills remaining on this prescription"]
            )
        
        # Rule 4: Check if too early to refill
        if prescription.last_filled_date:
            days_since_last_fill = (date.today() - prescription.last_filled_date).days
            days_until_eligible = settings.min_refill_days - days_since_last_fill
            
            if days_since_last_fill < settings.min_refill_days:
                return PrescriptionValidation(
                    is_valid=False,
                    result=ValidationResult.TOO_EARLY,
                    prescription_id=prescription.id,
                    refills_remaining=prescription.refills_remaining,
                    days_until_refill_eligible=days_until_eligible,
                    blocking_reasons=[
                        f"Too early to refill. You can refill in {days_until_eligible} days "
                        f"(minimum {settings.min_refill_days} days between refills)"
                    ]
                )
        
        # Rule 5: Check dosage limits
        max_allowed_quantity = int(
            prescription.quantity_prescribed * settings.max_daily_dosage_multiplier
        )
        
        if quantity_requested > max_allowed_quantity:
            return PrescriptionValidation(
                is_valid=False,
                result=ValidationResult.DOSAGE_EXCEEDED,
                prescription_id=prescription.id,
                refills_remaining=prescription.refills_remaining,
                blocking_reasons=[
                    f"Requested quantity ({quantity_requested}) exceeds maximum allowed "
                    f"({max_allowed_quantity}) based on prescription"
                ]
            )
        
        # Warning for non-standard quantity
        if quantity_requested != prescription.quantity_prescribed:
            warnings.append(
                f"Requested quantity ({quantity_requested}) differs from prescribed "
                f"quantity ({prescription.quantity_prescribed})"
            )
        
        # All checks passed
        return PrescriptionValidation(
            is_valid=True,
            result=ValidationResult.APPROVED,
            prescription_id=prescription.id,
            refills_remaining=prescription.refills_remaining,
            warnings=warnings
        )
    
    def perform_safety_check(
        self,
        items: List[tuple[Product, Optional[Prescription], int]],
        user_medications: Optional[List[Product]] = None
    ) -> SafetyCheck:
        """
        Perform comprehensive safety check for order.
        
        Args:
            items: List of (product, prescription, quantity) tuples
            user_medications: Current medications user is taking
        
        Returns:
            SafetyCheck with approval status and warnings
        """
        all_approved = True
        prescription_validations = []
        interaction_warnings = []
        
        # Validate each item
        for product, prescription, quantity in items:
            validation = self.validate_prescription_requirement(
                product, prescription, quantity
            )
            prescription_validations.append(validation)
            
            if not validation.is_valid:
                all_approved = False
        
        # Check for controlled substances
        for product, _, quantity in items:
            if product.controlled_substance_schedule:
                interaction_warnings.append(
                    f"{product.name} is a Schedule {product.controlled_substance_schedule} "
                    f"controlled substance. Additional verification required."
                )
        
        # Simple drug interaction check (in production, this would be more sophisticated)
        if user_medications and len(items) > 0:
            # Placeholder: Check if ordering multiple medications
            if len(items) > 1:
                interaction_warnings.append(
                    "Multiple medications ordered. Please consult pharmacist for interaction review."
                )
        
        return SafetyCheck(
            approved=all_approved,
            prescription_validation=prescription_validations[0] if prescription_validations else None,
            dosage_check_passed=all_approved,
            interaction_warnings=interaction_warnings
        )
