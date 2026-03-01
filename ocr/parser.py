# parser.py

import re
from datetime import datetime
from drug_database import find_closest_drug


# Common medicine name patterns to help identify medicines in mixed-language text
COMMON_MEDICINE_PATTERNS = [
    r'paracetamol',
    r'acetaminophen',
    r'amoxicillin',
    r'allegra',
    r'fexo',
    r'cetirizine',
    r'zyrtec',
    r'wysolone',
    r'prednisolone',
    r'ibuprofen',
    r'aspirin',
    r'azithromycin',
    r'crocin',
    r'dolo',
    r'combiflam',
    r'augmentin',
    r'cipro',
    r'metformin',
]


def clean_text(text: str) -> str:
    """
    Clean OCR text by removing noise and normalizing
    
    Args:
        text: Raw OCR text
        
    Returns:
        Cleaned text
    """
    # Remove special characters but keep alphanumeric, spaces, and common punctuation
    cleaned = re.sub(r'[^\w\s.,/\-()]', ' ', text)
    
    # Remove extra whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    return cleaned.strip()


# ----------------------------
# MEDICATION PARSER (LINE-BASED)
# ----------------------------
def parse_medications(text: str):
    """
    Parse medications from OCR text with improved mixed-language support
    
    Args:
        text: Extracted OCR text
        
    Returns:
        list: List of detected medications with details
    """
    medications = []
    
    # Clean the text first
    text = clean_text(text)

    dosage_pattern = r'(\d+\s?(mg|ml|g|mcg|IU|Mg|ML|Mg|GM))'
    frequency_pattern = r'(once daily|twice daily|thrice daily|\d+\s?times daily|OD|BD|TID|QD|Bid|od|bd|tid)'
    duration_pattern = r'(\d+\s?(days|weeks|months|day|week|month|Days|Weeks|Months))'
    quantity_pattern = r'\((\d+)\)'  # Pattern for quantity like (2) or (10)

    # Split text into lines (various separators)
    lines = re.split(r'[\n\r]+', text)
    if not lines or len(lines) < 2:
        # If no newlines, try other separators
        lines = re.split(r'(?<=[\d)])\s{2,}(?=[A-Za-z])', text)

    detected_drugs = set()

    for line in lines:
        # Skip empty or very short lines
        if len(line.strip()) < 3:
            continue

        words = line.split()

        # Try to find medicine names
        for i, word in enumerate(words):
            clean_word = re.sub(r'[^a-zA-Z]', '', word).lower()

            # Skip very short words
            if len(clean_word) < 3:
                continue
            
            # Check against common medicine patterns first
            for pattern in COMMON_MEDICINE_PATTERNS:
                if re.search(pattern, clean_word, re.IGNORECASE):
                    clean_word = pattern
                    break

            # Try to find closest drug match
            drug = find_closest_drug(clean_word)

            if drug and drug not in detected_drugs:
                detected_drugs.add(drug)

                # Extract dosage, frequency, duration from the line
                dosage = re.search(dosage_pattern, line, re.IGNORECASE)
                frequency = re.search(frequency_pattern, line, re.IGNORECASE)
                duration = re.search(duration_pattern, line, re.IGNORECASE)
                quantity_match = re.search(quantity_pattern, line)
                
                # Calculate confidence based on what we found
                confidence = 0.6  # Base confidence
                if dosage:
                    confidence += 0.15
                if frequency:
                    confidence += 0.15
                if duration:
                    confidence += 0.1

                medications.append({
                    "name": drug,
                    "dosage": dosage.group(0) if dosage else "",
                    "frequency": frequency.group(0) if frequency else "",
                    "duration": duration.group(0) if duration else "",
                    "quantity": int(quantity_match.group(1)) if quantity_match else 1,
                    "instructions": "",
                    "confidence": min(confidence, 1.0)
                })

    return medications


# ----------------------------
# METADATA EXTRACTION
# ----------------------------
def extract_metadata(text: str):
    """
    Extract prescription metadata (date, doctor name) from OCR text
    
    Args:
        text: Extracted OCR text
        
    Returns:
        tuple: (prescription_date, doctor_name)
    """
    # Clean text first
    text = clean_text(text)
    
    # Date detection (supports various formats)
    # dd/mm/yyyy, dd-mm-yyyy, dd/mm/yy, dd-mm-yy, dd.mm.yyyy
    date_patterns = [
        r'(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{4})',  # dd/mm/yyyy
        r'(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2})',   # dd/mm/yy
        r'(\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2})',  # yyyy/mm/dd
    ]
    
    prescription_date = ""
    
    for pattern in date_patterns:
        date_match = re.search(pattern, text)
        if date_match:
            raw_date = date_match.group(1)
            
            # Try various date formats
            date_formats = [
                "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
                "%d/%m/%y", "%d-%m-%y", "%d.%m.%y",
                "%Y/%m/%d", "%Y-%m-%d", "%Y.%m.%d",
            ]
            
            for fmt in date_formats:
                try:
                    dt = datetime.strptime(raw_date, fmt)
                    prescription_date = dt.strftime("%Y-%m-%d")
                    break
                except:
                    continue
            
            if prescription_date:
                break

    # Doctor name detection (various patterns)
    doctor_patterns = [
        r'[Dd]r\.?\s+([A-Za-z][A-Za-z\s\.]{2,30})',  # Dr. Name or Dr Name
        r'[Dd]octor\.?\s+([A-Za-z][A-Za-z\s\.]{2,30})',  # Doctor Name
    ]
    
    doctor_name = ""
    for pattern in doctor_patterns:
        doctor_match = re.search(pattern, text)
        if doctor_match:
            doctor_name = "Dr. " + doctor_match.group(1).strip()
            # Clean up the name
            doctor_name = re.sub(r'\s+', ' ', doctor_name)
            break

    return prescription_date, doctor_name