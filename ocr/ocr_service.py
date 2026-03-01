import easyocr
import re
import cv2
import numpy as np
from PIL import Image
from pdf2image import convert_from_path
from datetime import datetime
from typing import Dict, List
import os
import logging

logger = logging.getLogger(__name__)

# Initialize OCR reader with multilingual support for Indian prescriptions
# Supporting English, Hindi, and Marathi to handle mixed-language prescriptions
try:
    logger.info("Initializing EasyOCR with multi-language support (en, hi, mr)...")
    reader = easyocr.Reader(['en', 'hi', 'mr'], gpu=False)
    logger.info("✓ Multilingual OCR initialized successfully (English + Hindi + Marathi)")
except Exception as e:
    logger.warning(f"Could not load Hindi/Marathi models: {e}")
    logger.info("Falling back to English-only OCR...")
    reader = easyocr.Reader(['en'], gpu=False)
    logger.info("✓ English-only OCR initialized")

# ----------------------------
# ENHANCED DRUG DATABASE WITH INDIAN VARIANTS
# ----------------------------
COMMON_DRUGS = {
    # Generic names
    "paracetamol", "acetaminophen", "ibuprofen", "amoxicillin",
    "azithromycin", "metformin", "atorvastatin", "omeprazole",
    "pantoprazole", "cetirizine", "levocetirizine",
    "aspirin", "insulin", "amlodipine", "losartan", 
    "telmisartan", "glimepiride", "clopidogrel", "diclofenac",
    "rabeprazole", "montelukast", "thyroxine", "sertraline", "fluoxetine",
    
    # Indian brand names (commonly prescribed)
    "dolo", "crocin", "calpol", "combiflam", "brufen",
    "augmentin", "azee", "zifi", "cipro", "norflox",
    "allegra", "fexo", "zyrtec", "wysolone", "omnacortil",
    "pan", "pantop", "rablet", "rabeloc", "gelusil",
    "digene", "rantac", "crestor", "rosuvastatin",
    "telma", "eritel", "stamlo", "amlong", "listril",
    "glycomet", "gluconorm", "amaryl", "diamicron",
    "ecosprin", "disprin", "deplatt", "clavix",
    "zerodol", "voveran", "volini", "moov",
    "deriphyllin", "asthalin", "levolin", "budecort",
    "montair", "monteka", "levocet", "cetrizet"
}

# Medicine name variations (transliteration and common misspellings)
# Maps Devanagari and common variations to standard English names
MEDICINE_VARIATIONS = {
    "paracetamol": ["पॅरासिटामॉल", "पेरासिटामोल", "पॅरासिटामोल", "parasetamol", "paracetamol", "पॅरा", "para"],
    "amoxicillin": ["एमोक्सिसिलिन", "अमॉक्सिसिलिन", "amoxicilin", "amoxycillin", "एमॉक्सी"],
    "azithromycin": ["एझिथ्रोमायसिन", "अझिथ्रोमायसिन", "azithromicin", "एझी"],
    "cetirizine": ["सेटिरिझीन", "सेट्रिझिन", "setiriझeen", "cetirizine", "cetrizine", "सेटी"],
    "metformin": ["मेटफॉर्मिन", "मेटफोर्मिन", "metformin", "मेट"],
    "pantoprazole": ["पँटोप्राझोल", "पॅन्टोप्राझोल", "pantoprazol", "पॅन्टो", "pan"],
    "omeprazole": ["ओमेप्राझोल", "ओमेप्राझोल", "omeprazol", "ओमे"],
    "ibuprofen": ["आयबुप्रोफेन", "इबुप्रोफेन", "ibuprofen", "आय"],
    "aspirin": ["ॲस्पिरिन", "ॲस्प्रिन", "aspirin", "ॲस"],
    "dolo": ["डोलो", "dolo", "dolo", "डो"],
    "crocin": ["क्रोसिन", "crocin", "क्रो"],
    "combiflam": ["कॉम्बिफ्लम", "कॉम्बीफ्लम", "combiflame", "combiflam", "कॉम"],
    "allegra": ["ॲलेग्रा", "अलेग्रा", "allegra", "ॲले"],
    "azee": ["एझी", "अझी", "azee", "azee"],
    "augmentin": ["ऑगमेंटीन", "ऑगमेंटिन", "augmentin", "ऑग"],
    "wysolone": ["वायसोलोन", "वायसोलोन", "wysolone", "वे"],
    "montair": ["मॉन्टेयर", "मोंटेयर", "montair", "मॉन"],
    "levocet": ["लिव्होसेट", "लेवोसेट", "levocet", "लेवो"],
    "pantop": ["पॅन्टॉप", "पँटॉप", "pantop", "pan"],
    "rablet": ["रॅब्लेट", "रॅबलेट", "rablet", "रॅब"],
    "glycomet": ["ग्लायकोमेट", "ग्लायकोमेट", "glycomet", "ग्लाय"],
    "telma": ["टेल्मा", "तेल्मा", "telma", "टेल"],
    "stamlo": ["स्टॅम्लो", "स्टामलो", "stamlo", "स्टॅम"],
    "ecosprin": ["इकोस्प्रिन", "एकोस्प्रिन", "ecosprin", "इको"],
    "zerodol": ["झिरोडॉल", "झेरोडोल", "zerodol", "झिरो"],
    "asthalin": ["ॲस्थालिन", "अस्थालिन", "asthalin", "ॲस"],
    "budecort": ["बुडेकोर्ट", "बुडेकोर्ट", "budecort", "बुडे"],
}


def transliterate_to_english(devanagari_text: str) -> str:
    """
    Simple transliteration from Devanagari to English phonetics
    Helps match medicine names written in Hindi/Marathi
    """
    # Basic Devanagari to English mapping
    transliteration_map = {
        # Vowels
        'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
        'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
        # Consonants
        'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
        'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
        'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
        'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
        'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
        'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
        'ष': 'sh', 'स': 's', 'ह': 'h',
        # Special characters
        'ॐ': 'om', 'ं': 'm', 'ः': 'h', '्': '', 'ऑ': 'o', 'ॅ': 'a',
        # Numbers
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    }
    
    result = []
    for char in devanagari_text:
        result.append(transliteration_map.get(char, char))
    
    return ''.join(result).lower()

# ----------------------------
# IMAGE PREPROCESSING FOR MULTILINGUAL OCR
# ----------------------------
def preprocess_image(image):
    """
    Enhanced image preprocessing for better multilingual text recognition
    Handles mixed scripts (English, Devanagari) common in Indian prescriptions
    """
    # Convert to grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    # Apply denoising for clearer text
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    
    # Enhance contrast using CLAHE - helps with faded or low-contrast prescriptions
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    
    # Apply adaptive thresholding to handle uneven lighting and shadows
    binary = cv2.adaptiveThreshold(
        enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    # Morphological operations to clean up noise while preserving text
    kernel = np.ones((1, 1), np.uint8)
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
    
    return cleaned


# ----------------------------
# OCR TEXT EXTRACTION (MULTILINGUAL)
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

        # Image quality check
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()

        image_quality = "good"
        if variance < 50:
            image_quality = "poor"
        elif variance < 150:
            image_quality = "fair"

        # Preprocess image for better OCR results
        processed_image = preprocess_image(image)
        
        # Try OCR on both original and preprocessed images
        # This helps when original has good quality but preprocessing might help with faded text
        try:
            results_original = reader.readtext(image)
            confidence_original = float(np.mean([r[2] for r in results_original])) if results_original else 0.0
        except:
            results_original = []
            confidence_original = 0.0
            
        try:
            results_processed = reader.readtext(processed_image)
            confidence_processed = float(np.mean([r[2] for r in results_processed])) if results_processed else 0.0
        except:
            results_processed = []
            confidence_processed = 0.0
        
        # Use results with better confidence
        if confidence_processed > confidence_original:
            results = results_processed
            confidence = confidence_processed
            logger.info(f"Using preprocessed image results (confidence: {confidence:.2f})")
        else:
            results = results_original
            confidence = confidence_original
            logger.info(f"Using original image results (confidence: {confidence:.2f})")
        
        # Extract text from all detected regions
        extracted_text = " ".join([res[1] for res in results])
        
        # Detect handwriting based on confidence
        has_handwriting = confidence < 0.7

        return extracted_text, confidence, image_quality, has_handwriting

    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        return "", 0.0, "poor", False


# ----------------------------
# ENHANCED MEDICATION PARSER (MULTILINGUAL)
# ----------------------------
def parse_medications(text: str) -> List[Dict]:
    """
    Parse medications from multilingual text with fuzzy matching
    Handles English, Hindi, Marathi, and transliterated names
    """
    medications = []
    found_drugs = set()  # Track found drugs to avoid duplicates

    # Enhanced regex patterns (support English and Devanagari)
    dosage_pattern = r'(\d+\.?\d*\s?(mg|ml|g|mcg|μg|ug|IU|unit|tab|tablet|cap|capsule|मिग्रॅ|मिली|ग्रॅम|टॅब|कॅप))'
    frequency_pattern = r'(once\s+daily|twice\s+daily|thrice\s+daily|\d+\s?times?\s+daily|OD|BD|TDS|QID|PRN|SOS|morning|night|evening|breakfast|lunch|dinner|दिवसातून|सकाळी|रात्री|संध्याकाळी)'
    duration_pattern = r'(\d+\s?(days?|weeks?|months?|din|hafta|mahina|दिवस|आठवडे|महिने))'

    # Normalize text for better matching
    text_lower = text.lower()
    
    # Transliterate Devanagari text for better matching
    transliterated_text = transliterate_to_english(text)
    
    logger.info(f"\n--- Medicine Parsing Debug ---")
    logger.info(f"Original text sample: {text[:200]}...")
    logger.info(f"Transliterated sample: {transliterated_text[:200]}...")
    
    # Step 1: Check for Devanagari medicine names using variations
    for english_name, variations in MEDICINE_VARIATIONS.items():
        for variation in variations:
            # Check both original text and transliterated text
            if variation in text or variation in text_lower:
                if english_name not in found_drugs:
                    # Find context around the medicine name
                    try:
                        var_index = text.find(variation) if variation in text else text_lower.find(variation)
                        if var_index < 0:
                            continue
                            
                        context_start = max(0, var_index - 100)
                        context_end = min(len(text), var_index + len(variation) + 150)
                        context = text[context_start:context_end]
                        
                        # Extract dosage, frequency, duration from context
                        dosage = re.search(dosage_pattern, context, re.IGNORECASE)
                        frequency = re.search(frequency_pattern, context, re.IGNORECASE)
                        duration = re.search(duration_pattern, context, re.IGNORECASE)

                        medications.append({
                            "name": english_name.capitalize(),
                            "dosage": dosage.group(0) if dosage else "",
                            "frequency": frequency.group(0) if frequency else "",
                            "duration": duration.group(0) if duration else "",
                            "quantity": 0,
                            "instructions": f"Found as '{variation}'",
                            "confidence": 0.90 if (dosage and frequency) else 0.75 if dosage else 0.65
                        })
                        found_drugs.add(english_name)
                        logger.info(f"✓ Found: {english_name} (matched variation: '{variation}')")
                        break  # Stop checking other variations for this medicine
                    except Exception as e:
                        logger.error(f"Error processing variation {variation}: {e}")
                        continue
    
    # Step 2: Try exact matching for English medicine names
    for drug in COMMON_DRUGS:
        if drug in text_lower and drug not in found_drugs:
            # Find context around the drug name for better metadata extraction
            drug_index = text_lower.find(drug)
            context_start = max(0, drug_index - 50)
            context_end = min(len(text), drug_index + len(drug) + 100)
            context = text[context_start:context_end]
            
            # Extract dosage, frequency, duration from context
            dosage = re.search(dosage_pattern, context, re.IGNORECASE)
            frequency = re.search(frequency_pattern, context, re.IGNORECASE)
            duration = re.search(duration_pattern, context, re.IGNORECASE)

            medications.append({
                "name": drug.capitalize(),
                "dosage": dosage.group(0) if dosage else "",
                "frequency": frequency.group(0) if frequency else "",
                "duration": duration.group(0) if duration else "",
                "quantity": 0,
                "instructions": "",
                "confidence": 0.90 if (dosage and frequency) else 0.75 if dosage else 0.60
            })
            found_drugs.add(drug)
            logger.info(f"✓ Found: {drug} (direct English match)")
    
    # Step 3: Try fuzzy matching for partial matches (handles OCR errors)
    words = re.findall(r'\b[a-zA-Zà-ÿ\u0900-\u097F]{3,}\b', text)  # Extract words (3+ chars, includes Hindi/Marathi)

    
    for word in words:
        word_lower = word.lower()
        # Skip if already found
        if word_lower in found_drugs:
            continue
            
        # Check for partial matches (at least 70% similarity)
        for drug in COMMON_DRUGS:
            if len(word_lower) >= 4 and len(drug) >= 4:
                # Simple substring matching
                if (word_lower in drug and len(word_lower) / len(drug) > 0.7) or \
                   (drug in word_lower and len(drug) / len(word_lower) > 0.7):
                    
                    if drug not in found_drugs:
                        # Extract metadata around this word
                        word_index = text_lower.find(word_lower)
                        if word_index >= 0:
                            context_start = max(0, word_index - 50)
                            context_end = min(len(text), word_index + len(word) + 100)
                            context = text[context_start:context_end]
                            
                            dosage = re.search(dosage_pattern, context, re.IGNORECASE)
                            freq = re.search(frequency_pattern, context, re.IGNORECASE)
                            duration = re.search(duration_pattern, context, re.IGNORECASE)

                            medications.append({
                                "name": drug.capitalize(),
                                "dosage": dosage.group(0) if dosage else "",
                                "frequency": freq.group(0) if freq else "",
                                "duration": duration.group(0) if duration else "",
                                "quantity": 0,
                                "instructions": f"Detected as '{word}' (fuzzy match)",
                                "confidence": 0.70 if (dosage and freq) else 0.55 if dosage else 0.45
                            })
                            found_drugs.add(drug)
                            break

    # Log results
    logger.info(f"Parsed {len(medications)} medications from text")
    for med in medications:
        logger.info(f"  - {med['name']} {med['dosage']} {med['frequency']}")
    
    return medications


# ----------------------------
# METADATA EXTRACTION (ENHANCED)
# ----------------------------
def extract_metadata(text: str):
    """Enhanced metadata extraction supporting Marathi/Hindi prescriptions"""
    
    # Date extraction - multiple formats
    prescription_date = ""
    
    # Try various date formats
    date_patterns = [
        r'दि\.?\s*:?\s*(\d{1,2}[/|-]\d{1,2}[/|-]\d{4})',  # Marathi: दि.: 24/2/2026
        r'Date\s*:?\s*(\d{1,2}[/|-]\d{1,2}[/|-]\d{4})',   # English: Date: 24/2/2026
        r'(\d{1,2}[/|-]\d{1,2}[/|-]\d{4})',                # Standalone: 24/2/2026
        r'(\d{1,2}[/|-]\d{1,2}[/|-]\d{2})',                # Short year: 24/2/26
    ]
    
    for pattern in date_patterns:
        date_match = re.search(pattern, text)
        if date_match:
            date_str = date_match.group(1)
            try:
                # Try different date formats
                for fmt in ["%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y"]:
                    try:
                        parsed_date = datetime.strptime(date_str, fmt)
                        prescription_date = parsed_date.strftime("%d/%m/%Y")
                        break
                    except:
                        continue
                if prescription_date:
                    break
            except:
                continue
    
    # Doctor name extraction - support Marathi/Hindi names
    doctor_name = ""
    doctor_patterns = [
        r'डॉ\.?\s*([^\n\r]{5,40})',          # Marathi: डॉ. Name
        r'Dr\.?\s+([A-Za-z\s\.]+)',          # English: Dr. Name
        r'डॉक्टर\s+([^\n\r]{5,40})',         # डॉक्टर Name
    ]
    
    for pattern in doctor_patterns:
        doctor_match = re.search(pattern, text)
        if doctor_match:
            doctor_name = doctor_match.group(0).strip()[:50]  # Limit length
            break
    
    # Patient name extraction
    patient_name = ""
    patient_patterns = [
        r'पेशंटचे\s*नाव\s*:?\s*([^\n\r]{3,40})',  # Marathi: पेशंटचे नाव
        r'Patient\s*Name\s*:?\s*([A-Za-z\s\.]+)',  # English
        r'रुग्णाचे\s*नाव\s*:?\s*([^\n\r]{3,40})',  # रुग्णाचे नाव
    ]
    
    for pattern in patient_patterns:
        patient_match = re.search(pattern, text)
        if patient_match:
            patient_name = patient_match.group(1).strip()[:40]
            break
    
    return prescription_date, doctor_name, patient_name


# ----------------------------
# BLANK PRESCRIPTION DETECTION
# ----------------------------
def is_blank_prescription(text: str) -> bool:
    """Detect if this is a blank prescription form vs filled prescription"""
    blank_indicators = [
        'name:', 'hospital no', 'patient name', 'prescription',
        'date:', 'age:', 'sex:', 'doctor', 'signature',
        'client', 'bill', 'receipt', 'cashier'
    ]
    
    # Count how many blank form fields are present
    field_count = sum(1 for indicator in blank_indicators if indicator in text.lower())
    
    # If we have many blank fields but no actual content, it's likely a blank form
    has_numbers = bool(re.search(r'\d{2,}', text))  # Check for dosages/quantities
    word_count = len(text.split())
    
    # Heuristic: If >4 blank fields, few numbers, and short text = blank form
    if field_count >= 4 and word_count < 100:
        return True
    if field_count >= 3 and not has_numbers:
        return True
        
    return False


# ----------------------------
# FORMATTED OUTPUT GENERATOR (ENHANCED)
# ----------------------------
def format_prescription_output(response: dict) -> dict:
    """Format the prescription data in a clean, organized way with smart messages"""
    
    is_blank = is_blank_prescription(response["extracted_text"])
    has_medicines = len(response["medications"]) > 0
    
    # Determine status message
    if is_blank:
        status_message = "⚠️ Blank prescription form detected"
        helpful_note = "Please upload a filled prescription with medicine details written on it."
    elif not has_medicines:
        status_message = "⚠️ No medicines found"
        helpful_note = "The image might be unclear, or medicines might be handwritten. Try uploading a clearer image."
    elif has_medicines and response["confidence"] < 0.6:
        status_message = "⚠️ Low confidence detection"
        helpful_note = "Some medicines detected but image quality is poor. Please verify the results."
    else:
        status_message = "✅ Prescription analyzed successfully"
        helpful_note = f"Found {len(response['medications'])} medicine(s). Please verify the details below."
    
    formatted = {
        "status": "blank_form" if is_blank else response["status"],
        "message": status_message,
        "note": helpful_note,
        "confidence": response["confidence"],
        "summary": {
            "date": response["metadata"].get("prescription_date") or "Not found",
            "doctor": response["metadata"].get("doctor_name") or "Not found",
            "patient": response["metadata"].get("patient_name") or "Not found",
            "total_medicines": len(response["medications"]),
            "image_quality": response["metadata"].get("image_quality", "fair"),
            "is_blank_form": is_blank
        },
        "medicines": [],
        "raw_data": {
            "extracted_text": response["extracted_text"][:500] + "..." if len(response["extracted_text"]) > 500 else response["extracted_text"],
            "has_handwriting": response["metadata"].get("has_handwriting", False),
            "text_length": len(response["extracted_text"])
        }
    }
    
    # Format each medicine nicely
    if has_medicines:
        for idx, med in enumerate(response["medications"], 1):
            formatted_med = {
                "sno": idx,
                "name": med.get("name", "Unknown").title(),
                "dosage": med.get("dosage") or "Not specified",
                "frequency": med.get("frequency") or "Not specified",
                "duration": med.get("duration") or "Not specified",
                "instructions": med.get("instructions", ""),
                "confidence": f"{int(med.get('confidence', 0) * 100)}%"
            }
            formatted["medicines"].append(formatted_med)
    
    return formatted


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
            "patient_name": "",
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
    prescription_date, doctor_name, patient_name = extract_metadata(text)

    response.update({
        "status": "success" if medications else "partial",
        "confidence": float(round(ocr_confidence, 2)),
        "extracted_text": text,
        "medications": medications,
        "metadata": {
            "prescription_date": prescription_date,
            "doctor_name": doctor_name,
            "patient_name": patient_name,
            "image_quality": image_quality,
            "has_handwriting": has_handwriting
        }
    })
    
    # Return formatted output
    return format_prescription_output(response)