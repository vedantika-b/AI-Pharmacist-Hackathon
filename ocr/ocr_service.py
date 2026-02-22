import easyocr
import re
import cv2
import numpy as np
from PIL import Image
from pdf2image import convert_from_path
from datetime import datetime
from typing import Dict, List
import os

# Initialize OCR reader once (important for performance)
reader = easyocr.Reader(['en'], gpu=False)

# ----------------------------
# BASIC DRUG DATABASE (Top Common Medications)
# ----------------------------
COMMON_DRUGS = {
    "paracetamol", "acetaminophen", "ibuprofen", "amoxicillin",
    "azithromycin", "metformin", "atorvastatin", "omeprazole",
    "pantoprazole", "cetirizine", "levocetirizine", "dolo",
    "crocin", "augmentin", "aspirin", "insulin",
    "amlodipine", "losartan", "telmisartan", "glimepiride",
    "clopidogrel", "diclofenac", "rabeprazole", "montelukast",
    "thyroxine", "sertraline", "fluoxetine"
}

# ----------------------------
# OCR TEXT EXTRACTION
# ----------------------------
def extract_text_from_image(image_path: str):
    try:
        if image_path.lower().endswith(".pdf"):
            pages = convert_from_path(image_path)
            image = np.array(pages[0])
        else:
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError("Invalid image file")

        # Basic quality check
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()

        image_quality = "good"
        if variance < 50:
            image_quality = "poor"
        elif variance < 150:
            image_quality = "fair"

        results = reader.readtext(image)
        extracted_text = " ".join([res[1] for res in results])
        confidence = np.mean([res[2] for res in results]) if results else 0.0

        has_handwriting = confidence < 0.7

        return extracted_text, confidence, image_quality, has_handwriting

    except Exception as e:
        return "", 0.0, "poor", False


# ----------------------------
# PARSE MEDICATIONS FROM TEXT
# ----------------------------
def parse_medications(text: str) -> List[Dict]:
    medications = []

    # Simple regex patterns
    dosage_pattern = r'(\d+\s?(mg|ml|g|mcg|IU))'
    frequency_pattern = r'(once daily|twice daily|thrice daily|\d+\s?times daily|OD|BD|TDS)'
    duration_pattern = r'(\d+\s?(days|weeks|months))'

    words = text.lower().split()

    for drug in COMMON_DRUGS:
        if drug in text.lower():
            dosage = re.search(dosage_pattern, text, re.IGNORECASE)
            frequency = re.search(frequency_pattern, text, re.IGNORECASE)
            duration = re.search(duration_pattern, text, re.IGNORECASE)

            medications.append({
                "name": drug,
                "dosage": dosage.group(0) if dosage else "",
                "frequency": frequency.group(0) if frequency else "",
                "duration": duration.group(0) if duration else "",
                "quantity": 0,
                "instructions": "",
                "confidence": 0.85 if dosage else 0.6
            })

    return medications


# ----------------------------
# METADATA EXTRACTION
# ----------------------------
def extract_metadata(text: str):
    # Date extraction
    date_match = re.search(r'(\d{2}[/-]\d{2}[/-]\d{4})', text)
    prescription_date = ""
    if date_match:
        try:
            prescription_date = datetime.strptime(date_match.group(1), "%d/%m/%Y").strftime("%Y-%m-%d")
        except:
            prescription_date = ""

    # Doctor name (basic heuristic)
    doctor_match = re.search(r'(Dr\.?\s+[A-Za-z\s]+)', text)
    doctor_name = doctor_match.group(0) if doctor_match else ""

    return prescription_date, doctor_name


# ----------------------------
# MAIN FUNCTION
# ----------------------------
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

    text, ocr_confidence, image_quality, has_handwriting = extract_text_from_image(image_path)

    if not text:
        response["errors"].append("No text detected in image")
        return response

    medications = parse_medications(text)
    prescription_date, doctor_name = extract_metadata(text)

    response.update({
        "status": "success" if medications else "partial",
        "confidence": float(round(ocr_confidence, 2)),
        "extracted_text": text,
        "medications": medications,
        "metadata": {
            "prescription_date": prescription_date,
            "doctor_name": doctor_name,
            "image_quality": image_quality,
            "has_handwriting": has_handwriting
        }
    })

    return response