# parser.py

import re
from datetime import datetime
from drug_database import find_closest_drug


# ----------------------------
# MEDICATION PARSER (LINE-BASED)
# ----------------------------
def parse_medications(text: str):

    medications = []

    dosage_pattern = r'(\d+\s?(mg|ml|g|mcg|IU))'
    frequency_pattern = r'(once daily|twice daily|thrice daily|\d+\s?times daily|OD|BD|TID|QD|Bid)'
    duration_pattern = r'(\d+\s?(days|weeks|months))'

    # Split text into probable prescription lines
    lines = re.split(r'(?<=\D)\s(?=[A-Z])', text)

    detected_drugs = set()

    for line in lines:

        words = line.split()

        for word in words:
            clean_word = re.sub(r'[^a-zA-Z]', '', word)

            if len(clean_word) < 4:
                continue

            drug = find_closest_drug(clean_word)

            if drug and drug not in detected_drugs:
                detected_drugs.add(drug)

                dosage = re.search(dosage_pattern, line, re.IGNORECASE)
                frequency = re.search(frequency_pattern, line, re.IGNORECASE)
                duration = re.search(duration_pattern, line, re.IGNORECASE)

                medications.append({
                    "name": drug,
                    "dosage": dosage.group(0) if dosage else "",
                    "frequency": frequency.group(0) if frequency else "",
                    "duration": duration.group(0) if duration else "",
                    "quantity": 0,
                    "instructions": "",
                    "confidence": 0.9 if dosage or frequency else 0.75
                })

    return medications


# ----------------------------
# METADATA EXTRACTION
# ----------------------------
def extract_metadata(text: str):

    # Date detection (supports dd-mm-yy, dd/mm/yyyy etc.)
    date_match = re.search(r'(\d{2}[/-]\d{2}[/-]\d{2,4})', text)
    prescription_date = ""

    if date_match:
        raw_date = date_match.group(1)

        try:
            # Handle 2-digit year
            if len(raw_date.split("-")[-1]) == 2:
                dt = datetime.strptime(raw_date, "%d-%m-%y")
            else:
                dt = datetime.strptime(raw_date, "%d-%m-%Y")

            prescription_date = dt.strftime("%Y-%m-%d")

        except:
            prescription_date = raw_date

    # Doctor name detection
    doctor_match = re.search(r'(Dr\.?\s+[A-Za-z\s_]+)', text)
    doctor_name = doctor_match.group(0) if doctor_match else ""

    return prescription_date, doctor_name