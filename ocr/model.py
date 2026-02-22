
import os
from ocr_engine import extract_text
from parser import parse_medications, extract_metadata

def process_prescription_image(image_path: str) -> dict:

    response = {
        "status": "error",
        "confidence": 0.0,
        "extracted_text": "",
        "medications": [],
        "metadata": {
            "prescription_date": "",
            "doctor_name": "",
            "image_quality": "poor",
            "has_handwriting": False
        },
        "errors": []
    }

    if not os.path.exists(image_path):
        response["errors"].append("File not found")
        return response

    try:
        text, ocr_confidence, image_quality, has_handwriting = extract_text(image_path)

        if not text:
            response["errors"].append("No text detected")
            return response

        meds = parse_medications(text)
        prescription_date, doctor_name = extract_metadata(text)

        response.update({
            "status": "success" if meds else "partial",
            "confidence": round(ocr_confidence, 2),
            "extracted_text": text,
            "medications": meds,
            "metadata": {
                "prescription_date": prescription_date,
                "doctor_name": doctor_name,
                "image_quality": image_quality,
                "has_handwriting": has_handwriting
            }
        })

        return response

    except Exception as e:
        response["errors"].append(str(e))
        return response