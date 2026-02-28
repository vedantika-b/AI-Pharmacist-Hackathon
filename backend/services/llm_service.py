"""
LLM Service for intent extraction using Groq llama-3.1-8b-instant.
Implements structured JSON output for reliable parsing.
"""

from groq import Groq
import json
from typing import Optional
from core.config import get_settings
from models.schemas import LLMIntentOutput, IntentType, ExtractedMedication
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMService:
    """Service for interacting with Groq LLM API."""
    
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
        self.temperature = settings.groq_temperature
        self.max_tokens = settings.groq_max_tokens
    
    async def extract_intent(
        self,
        user_message: str,
        user_context: Optional[dict] = None
    ) -> LLMIntentOutput:
        """
        Extract intent and entities from user message.
        
        Args:
            user_message: Raw user input
            user_context: Optional context (prescriptions, order history)
        
        Returns:
            LLMIntentOutput with structured intent data
        """
        try:
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_user_prompt(user_message, user_context)
            
            # Call Groq API with JSON mode
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"}  # Force JSON output
            )
            
            # Parse and validate response
            raw_output = response.choices[0].message.content
            logger.info(f"LLM raw output: {raw_output}")
            
            parsed = json.loads(raw_output)
            result = LLMIntentOutput.model_validate(parsed)
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM output as JSON: {e}")
            # Fallback to UNKNOWN intent
            return LLMIntentOutput(
                intent=IntentType.UNKNOWN,
                confidence=0.0,
                summary="Failed to parse user intent"
            )
        
        except Exception as e:
            logger.error(f"Error in LLM service: {e}")
            return LLMIntentOutput(
                intent=IntentType.UNKNOWN,
                confidence=0.0,
                summary=f"Error: {str(e)}"
            )
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt for intent extraction."""
        return """You are an AI assistant for a pharmacy order system called AI Pharmacist.

Your task is to analyze customer messages and extract:
1. Intent (what the customer wants to do)
2. Medications mentioned (name, quantity, dosage if specified)
3. Whether prescription is likely required

**Intent Types:**
- ORDER_NEW: Customer wants to order new medication
- ORDER_REFILL: Customer wants to refill existing prescription  
- INFO_REQUEST: Customer asking about medication info, side effects, drug interactions, etc.
- STOCK_CHECK: Customer asking about available medicines, stock levels, inventory, what medicines you have
- GREETING: Customer saying hello, hi, good morning, or general greeting
- PRESCRIPTION_QUERY: Customer asking about a prescription (uploaded or mentioned). Questions like "what medicines are in the prescription", "what are the dosages", "list the medications", "which drugs were prescribed", "tell me about my prescription"
- UNKNOWN: Cannot determine intent

**Output Format (JSON only):**
{
    "intent": "ORDER_NEW" | "ORDER_REFILL" | "INFO_REQUEST" | "STOCK_CHECK" | "GREETING" | "PRESCRIPTION_QUERY" | "UNKNOWN",
    "confidence": 0.0-1.0,
    "medications": [
        {
            "name": "medication name",
            "quantity": integer or null,
            "dosage": "dosage string or null"
        }
    ],
    "requires_prescription": true | false,
    "summary": "brief summary of the request"
}

**Examples:**

User: "I need to refill my blood pressure medication"
Output: {"intent": "ORDER_REFILL", "confidence": 0.9, "medications": [{"name": "blood pressure medication", "quantity": null, "dosage": null}], "requires_prescription": true, "summary": "Requesting refill for blood pressure medication"}

User: "Can I get 30 tablets of ibuprofen 200mg?"
Output: {"intent": "ORDER_NEW", "confidence": 0.95, "medications": [{"name": "ibuprofen", "quantity": 30, "dosage": "200mg"}], "requires_prescription": false, "summary": "Order request for ibuprofen 200mg, 30 tablets"}

User: "What are the side effects of metformin?"
Output: {"intent": "INFO_REQUEST", "confidence": 1.0, "medications": [{"name": "metformin", "quantity": null, "dosage": null}], "requires_prescription": false, "summary": "Information request about metformin side effects"}

User: "What medicines do you have in stock?"
Output: {"intent": "STOCK_CHECK", "confidence": 0.95, "medications": [], "requires_prescription": false, "summary": "Customer asking about available medicines"}

User: "Tell me about the stocks present" or "Show me available inventory"
Output: {"intent": "STOCK_CHECK", "confidence": 0.95, "medications": [], "requires_prescription": false, "summary": "Customer asking about medicine inventory"}

User: "Hello" or "Hi there"
Output: {"intent": "GREETING", "confidence": 1.0, "medications": [], "requires_prescription": false, "summary": "Customer greeting"}

User: "Do you have paracetamol available?"
Output: {"intent": "STOCK_CHECK", "confidence": 0.9, "medications": [{"name": "paracetamol", "quantity": null, "dosage": null}], "requires_prescription": false, "summary": "Checking paracetamol availability"}

User: "Which medicines are in the prescription?" or "What are the dosages for the medications?"
Output: {"intent": "PRESCRIPTION_QUERY", "confidence": 0.95, "medications": [], "requires_prescription": false, "summary": "Customer asking about prescription contents"}

User: "List all the drugs in my prescription" or "What did the doctor prescribe?"
Output: {"intent": "PRESCRIPTION_QUERY", "confidence": 0.95, "medications": [], "requires_prescription": false, "summary": "Customer asking about prescribed medications"}

User: "Tell me about the medicines in my prescription and their side effects"
Output: {"intent": "PRESCRIPTION_QUERY", "confidence": 0.9, "medications": [], "requires_prescription": false, "summary": "Customer asking about prescription medicines and side effects"}

Respond with ONLY valid JSON. No additional text."""

    def _build_user_prompt(self, message: str, context: Optional[dict]) -> str:
        """Build the user prompt with context."""
        prompt = f"Customer message: {message}\n\n"
        
        if context:
            if context.get("prescriptions"):
                prompt += f"Customer's active prescriptions: {context['prescriptions']}\n"
            if context.get("recent_orders"):
                prompt += f"Recent orders: {context['recent_orders']}\n"
            if context.get("has_prescription_image"):
                prompt += "Note: Customer has just uploaded a prescription image.\n"
            if context.get("has_stored_prescription"):
                prompt += "Note: Customer has previously uploaded a prescription in this session. Questions about 'the prescription', 'medications in prescription', 'dosages' etc. should be classified as PRESCRIPTION_QUERY.\n"
            if context.get("ocr_medications"):
                med_names = [m.get("name", "") for m in context["ocr_medications"]]
                prompt += f"Medications found in uploaded prescription: {', '.join(med_names)}\n"
            if context.get("stored_prescription"):
                med_names = [m.get("name", "") for m in context["stored_prescription"]]
                prompt += f"Medications from previously uploaded prescription: {', '.join(med_names)}\n"
        
        prompt += "\nAnalyze the message and respond with JSON only."
        return prompt

    async def generate_response(
        self,
        user_message: str,
        intent: str,
        medications: list,
        context: Optional[dict] = None,
        prescription_info: Optional[str] = None
    ) -> str:
        """
        Generate a conversational response in the same language as the user.
        
        Args:
            user_message: Original user input
            intent: Detected intent (ORDER_NEW, STOCK_CHECK, etc.)
            medications: List of medications from intent extraction
            context: Optional context (stock info, prescription data, etc.)
            prescription_info: Formatted prescription information if available
        
        Returns:
            Conversational response in the user's language
        """
        try:
            system_prompt = self._build_response_system_prompt()
            user_prompt = self._build_response_user_prompt(
                user_message, intent, medications, context, prescription_info
            )
            
            # Call Groq API for conversational response
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Slightly higher for natural conversation
                max_tokens=512
            )
            
            response_text = response.choices[0].message.content
            logger.info(f"Generated multilingual response: {response_text[:100]}...")
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            # Fallback to basic English response
            return "I'm here to help with your medication needs. How can I assist you?"

    def _build_response_system_prompt(self) -> str:
        """Build system prompt for generating conversational responses with language matching."""
        return """**🌍 CRITICAL: LANGUAGE MATCHING RULE (HIGHEST PRIORITY) 🌍**

BEFORE doing ANYTHING else, you MUST:
1. **DETECT** the language of the user's message (English, Hindi, Marathi, mixed language, etc.)
2. **IDENTIFY** the script used (Roman/Latin script OR Devanagari script)
3. **RESPOND** in the EXACT SAME language and script the user used

**LANGUAGE DETECTION RULES:**
- If user writes in Marathi (Devanagari script like "औषध"), respond in Marathi (Devanagari)
- If user writes in Roman Marathi (like "aushadh", "mala sangha"), respond in Roman Marathi
- If user writes in Hindi (Devanagari like "दवाई"), respond in Hindi (Devanagari)
- If user writes in Roman Hindi, respond in Roman Hindi
- If user writes in English, respond in English
- If user writes in mixed language (Hinglish like "mujhe medicine chahiye"), respond in the SAME mix
- If user mixes scripts (like "Please mala help kara"), keep the SAME mix in your response

**ABSOLUTE RULES:**
✅ ALWAYS match the user's language and script exactly
✅ NEVER translate the user's message to a different language
✅ NEVER switch scripts (Roman to Devanagari or vice versa) unless user does first
✅ Mirror the user's language style (formal/informal)
✅ This language rule OVERRIDES ALL other instructions below

---

**YOUR ROLE:**
You are a helpful AI assistant for "AI Pharmacist", a pharmacy order system. You help customers with:
- Ordering medicines
- Checking stock availability
- Providing medicine information
- Processing prescriptions
- Refilling orders
- Answering questions about medications

**RESPONSE GUIDELINES:**
- Be friendly, professional, and helpful
- Keep responses concise but informative (2-4 sentences)
- Always offer next steps or suggestions
- For orders: confirm what they want and ask to proceed
- For info requests: provide helpful information and ask if they need more
- For stock checks: list available medicines clearly
- For prescriptions: acknowledge receipt and explain what you found
- For greetings: respond warmly and ask how you can help

**IMPORTANT:**
- Remember to respond in the USER'S language (detected above)
- Use culturally appropriate greetings and phrases
- Keep the same tone and formality as the user
- Be concise and actionable

Respond naturally like a helpful pharmacy assistant would, in the user's language."""

    def _build_response_user_prompt(
        self,
        user_message: str,
        intent: str,
        medications: list,
        context: Optional[dict] = None,
        prescription_info: Optional[str] = None
    ) -> str:
        """Build the user prompt for response generation."""
        prompt = f"""User's original message: "{user_message}"

Detected Intent: {intent}
"""
        
        # Add medication info
        if medications:
            med_names = []
            for med in medications:
                if isinstance(med, dict):
                    name = med.get("name", "")
                    dosage = med.get("dosage")
                    if dosage:
                        med_names.append(f"{name} {dosage}")
                    else:
                        med_names.append(name)
                else:
                    med_names.append(str(med))
            
            if med_names:
                prompt += f"Medications mentioned: {', '.join(med_names)}\n"
        
        # Add prescription info
        if prescription_info:
            prompt += f"\nPrescription Information:\n{prescription_info}\n"
        
        # Add context
        if context:
            if context.get("stock_info"):
                prompt += f"\nAvailable Stock:\n{context['stock_info']}\n"
            if context.get("requires_prescription"):
                prompt += "\nNote: These medications require prescription verification.\n"
            if context.get("suggestions"):
                prompt += f"\nSuggested actions: {', '.join(context['suggestions'])}\n"
        
        prompt += f"""
Based on the intent and context above, generate a helpful, conversational response.

**CRITICAL REMINDER:** 
- Detect the language of the user's message: "{user_message}"
- Respond in the EXACT SAME language and script
- If the message is in Marathi, respond in Marathi
- If the message is in Hindi, respond in Hindi
- If the message is in English, respond in English
- If mixed (Hinglish), respond in the same mix
- Match the script (Roman or Devanagari) exactly

Generate your response now:"""
        
        return prompt
