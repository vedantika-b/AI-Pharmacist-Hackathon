"""
Test the exact flow the FastAPI endpoint uses
"""
import sys
from pathlib import Path
import base64

# Add OCR path first (same as ocr_processor.py does)
ocr_path = Path(__file__).parent.parent / "ocr"
sys.path.insert(0, str(ocr_path))

# Now import the processor
from services.ocr_processor import OCRProcessor, OCR_AVAILABLE, OCR_IMPORT_ERROR

print("=" * 60)
print("TESTING OCRProcessor (same as FastAPI endpoint)")
print("=" * 60)

print(f"\nOCR_AVAILABLE: {OCR_AVAILABLE}")
print(f"OCR_IMPORT_ERROR: {OCR_IMPORT_ERROR}")

# Load sample image and convert to base64 (same as frontend does)
sample_path = Path(__file__).parent.parent / "ocr" / "sample1.jpg"
print(f"\nSample image: {sample_path}")
print(f"Exists: {sample_path.exists()}")

if sample_path.exists():
    with open(sample_path, 'rb') as f:
        image_bytes = f.read()
    
    # Create base64 with data URL prefix (same as frontend sends)
    base64_data = "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode()
    print(f"Base64 length: {len(base64_data)}")
    
    print("\nCalling OCRProcessor.process_base64_image()...")
    try:
        result = OCRProcessor.process_base64_image(base64_data, "sample1.jpg")
        print(f"\nResult:")
        print(f"  Status: {result.get('status')}")
        print(f"  Error: {result.get('error', 'None')}")
        print(f"  Confidence: {result.get('confidence')}")
        print(f"  Medications: {len(result.get('medications', []))}")
        if result.get('medications'):
            for med in result['medications']:
                print(f"    - {med.get('name')}")
        print(f"  Errors list: {result.get('errors', [])}")
    except Exception as e:
        import traceback
        print(f"\nEXCEPTION: {e}")
        traceback.print_exc()

print("\n" + "=" * 60)
