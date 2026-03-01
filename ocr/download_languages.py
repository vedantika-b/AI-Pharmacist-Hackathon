"""
Download EasyOCR Language Models for Mixed-Language Support

This script downloads Hindi (hi) and Marathi (mr) language models
for EasyOCR to support mixed-language prescriptions.

Note: This will download ~300MB of data for Hindi and Marathi models.
Run this once to enable multi-language OCR support.
"""

import easyocr

print("=" * 60)
print("EasyOCR Language Model Downloader")
print("=" * 60)
print()
print("This will download language models for:")
print("  - English (en)")
print("  - Hindi (hi)")
print("  - Marathi (mr)")
print()
print("Total download size: ~300-400 MB")
print("This needs to be done only once.")
print()

try:
    print("Initializing EasyOCR reader with multi-language support...")
    print("(This may take a few minutes on first run)")
    print()
    
    # This will download models if not present
    reader = easyocr.Reader(['en', 'hi', 'mr'], gpu=False)
    
    print()
    print("✓ Language models downloaded successfully!")
    print()
    print("You can now process prescriptions in:")
    print("  ✓ English")
    print("  ✓ Hindi (हिंदी)")
    print("  ✓ Marathi (मराठी)")
    print()
    print("=" * 60)
    
except Exception as e:
    print()
    print("✗ Error downloading models:")
    print(f"  {str(e)}")
    print()
    print("This is normal if you only want English support.")
    print("The system will work with English-only OCR.")
    print()
