# OCR/Prescription Image Recognition - Implementation Guide

## Context
This is a hackathon project for an AI Pharmacist application. We need to implement Optical Character Recognition (OCR) to process prescription images and extract medication information. Currently, the frontend has a basic image upload field, but no backend processing exists.

## Technology Stack
- **Frontend:** Next.js 14, TypeScript, React 19, Tailwind CSS
- **Backend:** Python 3.10+, FastAPI
- **Database:** Supabase PostgreSQL
- **Current Dependencies:** scikit-learn, pandas, numpy, joblib (ML model training tools already installed)

## Requirement Summary

### Input
- **From:** User uploads a prescription image (JPG, PNG, or PDF scan)
- **Location:** Frontend form: `/dashboard/medicines` page
- **File Size:** Up to 5MB
- **Format:** JPEG, PNG, or scanned PDF images

### Processing Required
1. **Image Preprocessing:**
   - Resize/normalize for OCR
   - Handle rotated images
   - Improve contrast/brightness if needed

2. **OCR Text Extraction:**
   - Extract all text from prescription image
   - Handle both printed and handwritten text (if possible)
   - Include confidence scores where available

3. **Data Extraction:**
   - Parse extracted text to identify:
     - Medication names
     - Dosages (amount + unit, e.g., "500mg", "2 tablets")
     - Frequency (e.g., "twice daily", "every 8 hours")
     - Duration (e.g., "for 7 days", "30 pills")
     - Quantity
     - Any special instructions
     - Doctor name and date (if visible)

4. **Validation:**
   - Match extracted medication names against database
   - Flag unrecognized medications for manual review
   - Validate dosage formats
   - Cross-check with known drug databases

### Output Format
```python
{
    "status": "success" | "partial" | "error",
    "confidence": 0.0-1.0,  # Overall confidence score
    "extracted_text": "Raw OCR output",
    "medications": [
        {
            "name": "Aspirin",
            "dosage": "500mg",
            "frequency": "twice daily",
            "duration": "7 days",
            "quantity": 14,
            "instructions": "Take with food",
            "confidence": 0.95
        }
    ],
    "metadata": {
        "prescription_date": "2024-02-22",
        "doctor_name": "Dr. Smith",
        "image_quality": "good" | "fair" | "poor",
        "has_handwriting": true | false
    },
    "errors": [
        "Could not identify medication: xxx"
    ]
}
```

## Backend Integration Points

### New Endpoints Needed
1. **POST /api/v1/prescriptions/upload**
   - Accepts: multipart/form-data with image file
   - Returns: OCR result with extracted medications
   - Processes: Single image upload with real-time result

2. **POST /api/v1/prescriptions/scan**
   - Accepts: multipart/form-data with image + optional manual corrections
   - Returns: Processed prescription ready to order
   - Processes: Validates and saves extracted data

### New Database Fields
Add to existing `prescriptions` table:
- `image_url` - S3/Supabase storage link
- `image_confidence` - OCR confidence score
- `raw_extraction` - Raw OCR JSON result
- `processing_status` - pending | success | manual_review | failed
- `verified_by_user` - Boolean for user confirmation

### New Files to Create
```
backend/
  services/
    ocr_service.py       ← OCR processing logic
    prescription_parser.py ← Extract medication info
  routers/
    prescriptions_ocr.py ← API endpoints for OCR
  utils/
    drug_database.py     ← Validate against known drugs
```

---

## GPT Prompt (Copy-Paste This)

```
I need you to create a Python OCR service for processing prescription images in a FastAPI backend. 

REQUIREMENTS:
1. Create a function that takes an image file (JPG/PNG/PDF) and extracts prescription data
2. Return structured JSON with extracted medications, dosages, frequencies, etc.
3. Include confidence scores for extracted information
4. Handle both printed and handwritten text if possible
5. Validate medication names against a basic drug database
6. Output must match this exact schema:
   {
     "status": "success|partial|error",
     "confidence": 0.0-1.0,
     "extracted_text": "raw OCR output",
     "medications": [
       {
         "name": "medication name",
         "dosage": "amount/unit",
         "frequency": "how often",
         "duration": "how long",
         "quantity": number,
         "instructions": "special notes",
         "confidence": 0.0-1.0
       }
     ],
     "metadata": {
       "prescription_date": "YYYY-MM-DD",
       "doctor_name": "string",
       "image_quality": "good|fair|poor",
       "has_handwriting": true/false
     },
     "errors": ["list of errors"]
   }

TECHNICAL CONTEXT:
- Backend: FastAPI with Python 3.10+
- Already installed: scikit-learn, pandas, numpy
- Database: Supabase PostgreSQL
- Frontend: Next.js (will be handled separately)
- This is a hackathon project so performance > perfection

IMPLEMENTATION OPTIONS (choose one or recommend best):
1. EasyOCR (Python-based, good accuracy, ~50MB)
2. Tesseract.js (JavaScript, lighter weight, lower accuracy)
3. Google Cloud Vision API (best accuracy, costs money, API quota needed)
4. PaddleOCR (Chinese-optimized but works for English too, fast)

TASKS:
1. Provide a Python function called `process_prescription_image(image_path: str) -> dict`
2. Include a simpler version that just extracts text first
3. Add regex patterns to parse medication info from extracted text
4. Include a basic drug database validator (top 100 common meds)
5. Add error handling for common issues (blurry images, no text found, etc.)
6. Include setup instructions (pip install commands)
7. Provide example usage code

BONUS:
- Handle rotated images automatically
- Detect and skip non-prescription images
- Estimate confidence based on image quality
- Support for multiple languages (English, Hindi, Marathi) if possible

Output ready-to-use Python code that I can drop into my backend service. Use best practices but prioritize working code over perfect architecture.
```

---

## Summary of Implementation

When you get the code from GPT, you'll need to:

1. **Test it locally first:**
   ```bash
   python -c "from services.ocr_service import process_prescription_image; result = process_prescription_image('path/to/test/prescription.jpg'); print(result)"
   ```

2. **Create the API endpoint** in a new file `backend/routers/prescriptions_ocr.py`

3. **Update the frontend** to actually call the upload endpoint (currently it just shows an input field)

4. **Add the endpoint to main.py:**
   ```python
   from routers import prescriptions_ocr
   app.include_router(prescriptions_ocr.router, prefix="/api/v1", tags=["prescriptions"])
   ```

5. **Test with test images** before going live

---

## Quick Implementation Checklist

- [ ] Get OCR code from GPT using the prompt above
- [ ] Drop code into `backend/services/ocr_service.py`
- [ ] Create `backend/routers/prescriptions_ocr.py` with endpoints
- [ ] Test locally with sample prescription images
- [ ] Update frontend form to call `/api/v1/prescriptions/upload`
- [ ] Display extracted medications in the frontend
- [ ] Add manual correction UI if needed
- [ ] Test end-to-end upload → extract → display

---

## Expected Timeline (Hackathon Pace)
- OCR setup & testing: 30 minutes
- Backend integration: 30 minutes  
- Frontend integration: 30 minutes
- Testing & debugging: 30 minutes
- **Total: ~2 hours**

## Resources
- [EasyOCR Documentation](https://github.com/JaidedAI/EasyOCR)
- [PaddleOCR Documentation](https://paddlepaddle.github.io/PaddleOCR/)
- [FastAPI File Upload](https://fastapi.tiangolo.com/request-files/)
- [Supabase Storage Upload](https://supabase.com/docs/guides/storage/uploads)

---

**Next Steps:** 
1. Copy the GPT prompt above
2. Paste into ChatGPT or Claude
3. Get the code
4. Test it locally
5. Send me the code and I'll integrate it into the backend
