"""
LLM-based Prescription Parser - Uses Groq to extract structured medication data from raw OCR text
"""

from groq import Groq
import json
from typing import Dict, List, Optional
from core.config import get_settings
import logging
import re

logger = logging.getLogger(__name__)
settings = get_settings()


class PrescriptionLLMParser:
    """Parse prescription OCR text using Groq LLM for accurate extraction"""
    
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
    
    def parse_prescription(self, raw_text: str, existing_medications: List[Dict] = None) -> Dict:
        """
        Parse raw OCR text to extract structured prescription data.
        
        Args:
            raw_text: Raw text extracted from prescription image via OCR
            existing_medications: Medications already detected by basic OCR parser
            
        Returns:
            Dict with structured prescription data including medications, doctor info, patient info
        """
        if not raw_text or len(raw_text.strip()) < 10:
            return {
                "success": False,
                "error": "Insufficient text to parse",
                "medications": existing_medications or []
            }
        
        try:
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_user_prompt(raw_text, existing_medications)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=2048,
                response_format={"type": "json_object"}
            )
            
            raw_output = response.choices[0].message.content
            logger.info(f"LLM prescription parser output: {raw_output[:500]}...")
            
            parsed = json.loads(raw_output)
            
            # Validate and clean the output
            result = self._validate_and_clean(parsed)
            result["success"] = True
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM output as JSON: {e}")
            return {
                "success": False,
                "error": "Failed to parse prescription",
                "medications": existing_medications or []
            }
        except Exception as e:
            logger.error(f"LLM prescription parsing error: {e}")
            return {
                "success": False,
                "error": str(e),
                "medications": existing_medications or []
            }
    
    def _build_system_prompt(self) -> str:
        return """You are a medical prescription parser AI. Your task is to extract structured information from raw OCR text of prescription images.

Extract ONLY information that is clearly present in the text. Do not guess or make up data.

**Output Format (JSON only):**
{
    "medications": [
        {
            "name": "medicine name (generic or brand)",
            "dosage": "strength/dose (e.g., 500mg, 10ml)",
            "frequency": "how often (e.g., twice daily, BD, TID)",
            "duration": "how long (e.g., 5 days, 1 week)",
            "quantity": "number of tablets/units if mentioned",
            "instructions": "any special instructions (e.g., after food, at bedtime)"
        }
    ],
    "doctor_info": {
        "name": "doctor name if found",
        "license": "DEA/license number if found",
        "address": "clinic address if found"
    },
    "patient_info": {
        "name": "patient name if found",
        "age": "patient age if found"
    },
    "prescription_date": "date in YYYY-MM-DD format if found",
    "refills": "number of refills if mentioned",
    "notes": "any other relevant notes"
}

**Rules:**
1. Return ONLY valid JSON
2. For medications, extract the EXACT name as written (don't correct spelling unless obviously wrong)
3. If a field is not found, use empty string "" or null, never make up data
4. Common abbreviations to recognize:
   - BD/BID = twice daily
   - TID = three times daily  
   - QD/OD = once daily
   - PRN = as needed
   - AC = before meals
   - PC = after meals
   - HS = at bedtime
   - Sig = directions
5. Look for patterns like "Tab", "Cap", "Syr" for tablet, capsule, syrup"""

    def _build_user_prompt(self, raw_text: str, existing_medications: List[Dict] = None) -> str:
        prompt = f"""Parse this prescription OCR text and extract structured information:

--- RAW OCR TEXT ---
{raw_text}
--- END TEXT ---
"""
        
        if existing_medications:
            med_names = [m.get("name", "") for m in existing_medications if m.get("name")]
            if med_names:
                prompt += f"\n\nNote: Basic OCR already detected these medication names: {', '.join(med_names)}\nPlease enhance with dosage, frequency, duration details if found in the text."
        
        prompt += "\n\nExtract all medications and prescription details. Return ONLY valid JSON."
        return prompt
    
    def _validate_and_clean(self, parsed: Dict) -> Dict:
        """Validate and clean the parsed output"""
        result = {
            "medications": [],
            "doctor_info": {},
            "patient_info": {},
            "prescription_date": None,
            "refills": None,
            "notes": ""
        }
        
        # Process medications
        meds = parsed.get("medications", [])
        for med in meds:
            if isinstance(med, dict) and med.get("name"):
                cleaned_med = {
                    "name": self._clean_string(med.get("name", "")),
                    "dosage": self._clean_string(med.get("dosage", "")),
                    "frequency": self._normalize_frequency(med.get("frequency", "")),
                    "duration": self._clean_string(med.get("duration", "")),
                    "quantity": med.get("quantity"),
                    "instructions": self._clean_string(med.get("instructions", "")),
                    "confidence": 0.85  # Higher confidence since LLM validated
                }
                # Only add if name is meaningful
                if len(cleaned_med["name"]) >= 3:
                    result["medications"].append(cleaned_med)
        
        # Process doctor info
        doc = parsed.get("doctor_info", {})
        if isinstance(doc, dict):
            result["doctor_info"] = {
                "name": self._clean_string(doc.get("name", "")),
                "license": self._clean_string(doc.get("license", "")),
                "address": self._clean_string(doc.get("address", ""))
            }
        
        # Process patient info
        patient = parsed.get("patient_info", {})
        if isinstance(patient, dict):
            result["patient_info"] = {
                "name": self._clean_string(patient.get("name", "")),
                "age": self._clean_string(str(patient.get("age", "")))
            }
        
        # Other fields
        result["prescription_date"] = self._parse_date(parsed.get("prescription_date"))
        result["refills"] = parsed.get("refills")
        result["notes"] = self._clean_string(parsed.get("notes", ""))
        
        return result
    
    def _clean_string(self, value: str) -> str:
        """Clean and normalize string values"""
        if not value or not isinstance(value, str):
            return ""
        # Remove extra whitespace
        cleaned = " ".join(value.split())
        # Remove common OCR artifacts
        cleaned = re.sub(r'[~`|]', '', cleaned)
        return cleaned.strip()
    
    def _normalize_frequency(self, freq: str) -> str:
        """Normalize frequency abbreviations to readable format"""
        if not freq:
            return ""
        freq_lower = freq.lower().strip()
        
        normalizations = {
            "bd": "Twice daily",
            "bid": "Twice daily",
            "tid": "Three times daily",
            "qd": "Once daily",
            "od": "Once daily",
            "qid": "Four times daily",
            "prn": "As needed",
            "hs": "At bedtime",
            "ac": "Before meals",
            "pc": "After meals",
            "stat": "Immediately",
        }
        
        for abbr, full in normalizations.items():
            if freq_lower == abbr:
                return full
        
        return self._clean_string(freq)
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse and normalize date string"""
        if not date_str:
            return None
        
        # Try to extract date in various formats
        date_patterns = [
            r'(\d{4}-\d{2}-\d{2})',  # YYYY-MM-DD
            r'(\d{2}/\d{2}/\d{4})',  # MM/DD/YYYY
            r'(\d{2}-\d{2}-\d{4})',  # DD-MM-YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, str(date_str))
            if match:
                return match.group(1)
        
        return self._clean_string(str(date_str)) if date_str else None


# Singleton instance
_parser_instance = None

def get_prescription_parser() -> PrescriptionLLMParser:
    """Get or create prescription parser instance"""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = PrescriptionLLMParser()
    return _parser_instance


async def enhance_ocr_with_llm(ocr_result: Dict) -> Dict:
    """
    Enhance OCR results using LLM parsing.
    
    Args:
        ocr_result: Raw OCR result with extracted_text and basic medications
        
    Returns:
        Enhanced OCR result with better medication extraction
    """
    raw_text = ocr_result.get("extracted_text", "")
    existing_meds = ocr_result.get("medications", [])
    
    if not raw_text:
        logger.warning("No raw text available for LLM enhancement")
        return ocr_result
    
    try:
        parser = get_prescription_parser()
        llm_result = parser.parse_prescription(raw_text, existing_meds)
        
        if llm_result.get("success") and llm_result.get("medications"):
            # Replace/enhance medications with LLM-parsed data
            enhanced_meds = llm_result["medications"]
            
            # Update OCR result
            ocr_result["medications"] = enhanced_meds
            ocr_result["llm_enhanced"] = True
            
            # Update metadata with additional extracted info
            if llm_result.get("doctor_info", {}).get("name"):
                ocr_result["metadata"]["doctor_name"] = llm_result["doctor_info"]["name"]
            
            if llm_result.get("patient_info", {}).get("name"):
                ocr_result["metadata"]["patient_name"] = llm_result["patient_info"]["name"]
            
            if llm_result.get("prescription_date"):
                ocr_result["metadata"]["prescription_date"] = llm_result["prescription_date"]
            
            # Boost confidence since LLM validated
            if ocr_result.get("confidence", 0) < 0.7:
                ocr_result["confidence"] = min(ocr_result.get("confidence", 0) + 0.2, 0.9)
            
            logger.info(f"LLM enhancement successful: {len(enhanced_meds)} medications extracted")
        else:
            logger.warning(f"LLM enhancement failed or no medications found: {llm_result.get('error', 'Unknown')}")
            ocr_result["llm_enhanced"] = False
            
    except Exception as e:
        logger.error(f"LLM enhancement error: {e}")
        ocr_result["llm_enhanced"] = False
    
    return ocr_result
