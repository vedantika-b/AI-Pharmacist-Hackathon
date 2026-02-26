"""
Test exact FastAPI endpoint flow including Pydantic validation
"""
import sys
from pathlib import Path
import base64

# Add OCR path first (same as ocr_processor.py does)
ocr_path = Path(__file__).parent.parent / "ocr"
sys.path.insert(0, str(ocr_path))

from services.ocr_processor import (
    OCRProcessor,
    extract_medications_from_ocr,
    format_ocr_metadata
)
from pydantic import BaseModel
from typing import Optional, List

# Same models as in prescriptions.py
class MedicationFromOCR(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
    confidence: float
    extracted_from_ocr: bool = True


class PrescriptionOCRResponse(BaseModel):
    status: str
    medications: List[MedicationFromOCR]
    metadata: dict
    confidence: float
    extracted_text: Optional[str] = None
    errors: Optional[List[str]] = None


print("=" * 60)
print("TESTING FULL ENDPOINT FLOW WITH PYDANTIC VALIDATION")
print("=" * 60)

# Load sample image
sample_path = Path(__file__).parent.parent / "ocr" / "sample1.jpg"
with open(sample_path, 'rb') as f:
    image_bytes = f.read()
base64_data = "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode()

print("\n1. Calling OCRProcessor.process_base64_image()...")
ocr_result = OCRProcessor.process_base64_image(base64_data, "sample1.jpg")
print(f"   Status: {ocr_result.get('status')}")
print(f"   Medications count: {len(ocr_result.get('medications', []))}")

print("\n2. Calling extract_medications_from_ocr()...")
medications = extract_medications_from_ocr(ocr_result)
print(f"   Formatted medications: {medications}")

print("\n3. Calling format_ocr_metadata()...")
metadata = format_ocr_metadata(ocr_result)
print(f"   Metadata: {metadata}")

print("\n4. Creating PrescriptionOCRResponse (Pydantic validation)...")
try:
    response = PrescriptionOCRResponse(
        status=ocr_result.get("status", "partial"),
        medications=medications,
        metadata=metadata,
        confidence=ocr_result.get("confidence", 0.0),
        extracted_text=ocr_result.get("extracted_text", ""),
        errors=ocr_result.get("errors", None)
    )
    print(f"   ✓ SUCCESS!")
    print(f"   Response status: {response.status}")
    print(f"   Response medications: {len(response.medications)}")
except Exception as e:
    import traceback
    print(f"   ✗ PYDANTIC VALIDATION FAILED: {e}")
    traceback.print_exc()

print("\n" + "=" * 60)
