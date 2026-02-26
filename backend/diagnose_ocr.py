"""
Diagnostic script to check why OCR module fails when called from backend
"""
import sys
from pathlib import Path

print("=" * 60)
print("OCR DIAGNOSTIC")
print("=" * 60)

# Check paths
ocr_path = Path(__file__).parent.parent / "ocr"
print(f"\n1. OCR path: {ocr_path}")
print(f"   Exists: {ocr_path.exists()}")

# Check files in ocr folder
if ocr_path.exists():
    print(f"\n2. Files in OCR folder:")
    for f in ocr_path.iterdir():
        print(f"   - {f.name}")

# Add to sys.path
sys.path.insert(0, str(ocr_path))
print(f"\n3. sys.path[0]: {sys.path[0]}")

# Try imports step by step
print("\n4. Testing imports...")

try:
    import model
    print("   ✓ import model - SUCCESS")
except Exception as e:
    print(f"   ✗ import model - FAILED: {e}")

try:
    from model import process_prescription_image
    print("   ✓ from model import process_prescription_image - SUCCESS")
except Exception as e:
    print(f"   ✗ from model import process_prescription_image - FAILED: {e}")

try:
    import ocr_engine
    print("   ✓ import ocr_engine - SUCCESS")
except Exception as e:
    print(f"   ✗ import ocr_engine - FAILED: {e}")

try:
    import parser
    print("   ✓ import parser - SUCCESS")
except Exception as e:
    print(f"   ✗ import parser - FAILED: {e}")

# Try to run OCR on sample image
print("\n5. Testing OCR on sample image...")
sample_path = ocr_path / "sample1.jpg"
print(f"   Sample image: {sample_path}")
print(f"   Exists: {sample_path.exists()}")

if sample_path.exists():
    try:
        from model import process_prescription_image
        result = process_prescription_image(str(sample_path))
        print(f"   ✓ OCR SUCCESS!")
        print(f"   Status: {result.get('status')}")
        print(f"   Medications found: {len(result.get('medications', []))}")
        print(f"   Confidence: {result.get('confidence')}")
    except Exception as e:
        import traceback
        print(f"   ✗ OCR FAILED: {e}")
        print("\n   Full traceback:")
        traceback.print_exc()

print("\n" + "=" * 60)
