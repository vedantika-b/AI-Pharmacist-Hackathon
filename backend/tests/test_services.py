"""
Sample unit tests for backend services.
Run with: pytest tests/
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import date, timedelta
from uuid import uuid4

from services.validation_service import ValidationService
from models.schemas import (
    Product, Prescription, ValidationResult, PrescriptionValidation
)


class TestValidationService:
    """Test cases for prescription validation service."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.validation_service = ValidationService()
        
        # Mock product (prescription required)
        self.rx_product = Product(
            id=uuid4(),
            name="Metformin 500mg",
            generic_name="Metformin",
            price=15.99,
            rx_required=True,
            controlled_substance_schedule=None,
            dosage_form="tablet",
            strength="500mg"
        )
        
        # Mock product (OTC)
        self.otc_product = Product(
            id=uuid4(),
            name="Ibuprofen 200mg",
            generic_name="Ibuprofen",
            price=8.99,
            rx_required=False,
            controlled_substance_schedule=None,
            dosage_form="tablet",
            strength="200mg"
        )
        
        # Mock valid prescription
        self.valid_prescription = Prescription(
            id=uuid4(),
            user_id=uuid4(),
            product_id=self.rx_product.id,
            rx_number="RX123456",
            quantity_prescribed=30,
            days_supply=30,
            refills_total=3,
            refills_remaining=2,
            last_filled_date=date.today() - timedelta(days=25),
            valid_until=date.today() + timedelta(days=365),
            status="active"
        )
    
    def test_otc_product_no_prescription_required(self):
        """Test that OTC products don't require prescriptions."""
        result = self.validation_service.validate_prescription_requirement(
            product=self.otc_product,
            prescription=None,
            quantity_requested=30
        )
        
        assert result.is_valid is True
        assert result.result == ValidationResult.APPROVED
    
    def test_rx_product_requires_prescription(self):
        """Test that RX products require prescriptions."""
        result = self.validation_service.validate_prescription_requirement(
            product=self.rx_product,
            prescription=None,
            quantity_requested=30
        )
        
        assert result.is_valid is False
        assert result.result == ValidationResult.REQUIRES_RX
        assert len(result.blocking_reasons) > 0
    
    def test_valid_prescription_approved(self):
        """Test that valid prescription is approved."""
        result = self.validation_service.validate_prescription_requirement(
            product=self.rx_product,
            prescription=self.valid_prescription,
            quantity_requested=30
        )
        
        assert result.is_valid is True
        assert result.result == ValidationResult.APPROVED
        assert result.refills_remaining == 2
    
    def test_expired_prescription_rejected(self):
        """Test that expired prescriptions are rejected."""
        expired_rx = Prescription(
            **{**self.valid_prescription.model_dump(), 
               'valid_until': date.today() - timedelta(days=1)}
        )
        
        result = self.validation_service.validate_prescription_requirement(
            product=self.rx_product,
            prescription=expired_rx,
            quantity_requested=30
        )
        
        assert result.is_valid is False
        assert result.result == ValidationResult.INVALID_RX
        assert "expired" in result.blocking_reasons[0].lower()
    
    def test_no_refills_remaining_rejected(self):
        """Test that prescriptions with no refills are rejected."""
        no_refills_rx = Prescription(
            **{**self.valid_prescription.model_dump(), 'refills_remaining': 0}
        )
        
        result = self.validation_service.validate_prescription_requirement(
            product=self.rx_product,
            prescription=no_refills_rx,
            quantity_requested=30
        )
        
        assert result.is_valid is False
        assert result.result == ValidationResult.INVALID_RX
        assert "no refills" in result.blocking_reasons[0].lower()
    
    def test_too_early_to_refill(self):
        """Test that refills too early are rejected."""
        recent_rx = Prescription(
            **{**self.valid_prescription.model_dump(), 
               'last_filled_date': date.today() - timedelta(days=10)}
        )
        
        result = self.validation_service.validate_prescription_requirement(
            product=self.rx_product,
            prescription=recent_rx,
            quantity_requested=30
        )
        
        assert result.is_valid is False
        assert result.result == ValidationResult.TOO_EARLY
        assert result.days_until_refill_eligible is not None
        assert result.days_until_refill_eligible > 0
    
    def test_dosage_exceeded(self):
        """Test that excessive dosage is rejected."""
        result = self.validation_service.validate_prescription_requirement(
            product=self.rx_product,
            prescription=self.valid_prescription,
            quantity_requested=100  # Way more than prescribed 30
        )
        
        assert result.is_valid is False
        assert result.result == ValidationResult.DOSAGE_EXCEEDED


# Run tests with: pytest tests/test_services.py -v
