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
            logger.info(f"🔍 Extracting intent for message: '{user_message}'")
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_user_prompt(user_message, user_context)
            
            logger.info("📡 Calling Groq API...")
            # Call Groq API with JSON mode
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"},  # Force JSON output
                timeout=10  # Add explicit timeout
            )
            
            logger.info("✅ Groq API response received")
            # Parse and validate response
            raw_output = response.choices[0].message.content
            logger.info(f"LLM raw output: {raw_output}")
            
            parsed = json.loads(raw_output)
            result = LLMIntentOutput.model_validate(parsed)
            
            logger.info(f"✅ Intent extracted: {result.intent.value} (confidence: {result.confidence})")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse LLM output as JSON: {e}")
            logger.info("🔄 Falling back to rule-based intent detection")
            # Use rule-based fallback when JSON parsing fails
            return self._rule_based_intent_detection(user_message, user_context)
        
        except Exception as e:
            logger.error(f"❌ Error in LLM service: {type(e).__name__}: {str(e)}")
            logger.info("🔄 Falling back to rule-based intent detection")
            # Use rule-based fallback when LLM fails
            return self._rule_based_intent_detection(user_message, user_context)
    
    def _rule_based_intent_detection(self, message: str, context: Optional[dict] = None) -> LLMIntentOutput:
        """Fallback rule-based intent detection when LLM fails."""
        message_lower = message.lower()
        
        # Symptom patterns (Hindi/Hinglish/English)
        symptom_keywords = [
            'bukhar', 'fever', 'bukhar hai', 'तापमान',
            'headache', 'sir dard', 'सिर दर्द', 'sar dard',
            'pet dard', 'stomach', 'पेट दर्द', 'stomach pain',
            'cough', 'khansi', 'खांसी', 'cold', 'sardi',
            'body pain', 'badan dard', 'बदन दर्द',
            'throat', 'gala', 'गला खराब',
            'diarrhea', 'loose motion', 'दस्त',
            'vomiting', 'ulti', 'उल्टी',
            'dizzy', 'chakkar', 'चक्कर'
        ]
        
        # Greeting patterns
        greeting_keywords = ['hello', 'hi', 'hey', 'namaste', 'नमस्ते', 'good morning', 'good evening']
        
        # Order patterns
        order_keywords = ['order', 'buy', 'purchase', 'chahiye', 'चाहिए', 'lena hai', 'kharidna']
        
        # Stock check patterns
        stock_keywords = ['available', 'stock', 'hai kya', 'mil sakta', 'उपलब्ध']
        
        # Check for symptoms first (highest priority)
        if any(keyword in message_lower for keyword in symptom_keywords):
            return LLMIntentOutput(
                intent=IntentType.SYMPTOM_QUERY,
                confidence=0.8,
                medications=[],
                requires_prescription=False,
                summary="Customer reporting health symptoms (rule-based detection)"
            )
        
        # Check for greetings
        if any(keyword in message_lower for keyword in greeting_keywords):
            return LLMIntentOutput(
                intent=IntentType.GREETING,
                confidence=0.9,
                medications=[],
                requires_prescription=False,
                summary="Customer greeting (rule-based detection)"
            )
        
        # Check for orders
        if any(keyword in message_lower for keyword in order_keywords):
            return LLMIntentOutput(
                intent=IntentType.ORDER_NEW,
                confidence=0.7,
                medications=[],
                requires_prescription=False,
                summary="Customer wants to order medicine (rule-based detection)"
            )
        
        # Check for stock inquiry
        if any(keyword in message_lower for keyword in stock_keywords):
            return LLMIntentOutput(
                intent=IntentType.STOCK_CHECK,
                confidence=0.7,
                medications=[],
                requires_prescription=False,
                summary="Customer checking stock (rule-based detection)"
            )
        
        # Default to UNKNOWN
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
- SYMPTOM_QUERY: Customer mentions symptoms like "mujhe bukhar hai", "headache ho raha hai", "pet dard hai", "cough hai", any health issue or symptom
- UNKNOWN: Cannot determine intent

**Output Format (JSON only):**
{
    "intent": "ORDER_NEW" | "ORDER_REFILL" | "INFO_REQUEST" | "STOCK_CHECK" | "GREETING" | "PRESCRIPTION_QUERY" | "SYMPTOM_QUERY" | "UNKNOWN",
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

User: "Mujhe bukhar hai" or "I have fever"
Output: {"intent": "SYMPTOM_QUERY", "confidence": 0.95, "medications": [], "requires_prescription": false, "summary": "Customer reporting fever symptoms"}

User: "Pet dard hai" or "Headache ho raha hai"
Output: {"intent": "SYMPTOM_QUERY", "confidence": 0.95, "medications": [], "requires_prescription": false, "summary": "Customer reporting health symptoms"}

User: "Hello" or "Hi there"
Output: {"intent": "GREETING", "confidence": 1.0, "medications": [], "requires_prescription": false, "summary": "Customer greeting"}

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
        prescription_info: Optional[str] = None,
        conversation_history: Optional[list] = None
    ) -> str:
        """
        Generate a conversational response in the same language as the user.
        
        Args:
            user_message: Original user input
            intent: Detected intent (ORDER_NEW, STOCK_CHECK, etc.)
            medications: List of medications from intent extraction
            context: Optional context (stock info, prescription data, etc.)
            prescription_info: Formatted prescription information if available
            conversation_history: Previous messages in conversation
        
        Returns:
            Conversational response in the user's language
        """
        try:
            system_prompt = self._build_response_system_prompt()
            user_prompt = self._build_response_user_prompt(
                user_message, intent, medications, context, prescription_info
            )
            
            # Build messages array with conversation history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if available (last 5 messages to keep context fresh)
            if conversation_history:
                for msg in conversation_history[-5:]:
                    messages.append(msg)
            
            # Add current user message
            messages.append({"role": "user", "content": user_prompt})
            
            # Call Groq API for conversational response
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.5,  # Higher for more natural, friendly conversation
                max_tokens=512
            )
            
            response_text = response.choices[0].message.content
            logger.info(f"Generated multilingual response: {response_text[:100]}...")
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            logger.info("🔄 Falling back to rule-based response generation")
            # Use rule-based response generation
            return self._rule_based_response_generation(user_message, intent, medications, context)
    
    def _rule_based_response_generation(
        self,
        user_message: str,
        intent: str,
        medications: list,
        context: Optional[dict] = None
    ) -> str:
        """Generate responses without LLM using templates."""
        message_lower = user_message.lower()
        
        # Detect language (simple heuristic)
        is_hindi = any(word in message_lower for word in ['mujhe', 'hai', 'kya', 'mera', 'mere', 'ka', 'ki', 'ke'])
        
        if intent == "SYMPTOM_QUERY":
            return self._generate_symptom_response(user_message, is_hindi)
        elif intent == "GREETING":
            if is_hindi:
                return "Namaste! 🙏 Main aapki medicine ki madad ke liye yahan hoon. Aapko kya chahiye?"
            return "Hello! 👋 I'm here to help with your medication needs. How can I assist you?"
        elif intent == "ORDER_NEW":
            if is_hindi:
                return "Ji, medicine order karne mein madad kar sakta hoon. Konsi medicine chahiye?"
            return "I can help you order medicines. Which medicine do you need?"
        elif intent == "STOCK_CHECK":
            if is_hindi:
                return "Stock check karne mein madad karunga. Konsi medicine ka stock dekhna hai?"
            return "I can check medicine availability. Which medicine are you looking for?"
        else:
            if is_hindi:
                return "Main aapki madad ke liye yahan hoon. Medicine order karna hai ya kuch puchna hai?"
            return "I'm here to help with your medication needs. How can I assist you?"
    
    def _generate_symptom_response(self, message: str, is_hindi: bool) -> str:
        """Generate symptom-based medicine recommendations with pharmacy links."""
        message_lower = message.lower()
        
        # Medicine recommendations based on symptoms
        if 'bukhar' in message_lower or 'fever' in message_lower:
            if is_hindi:
                return """Bukhar hai? Kitna degree hai aur kab se hai? 🌡️

Abhi ke liye **Dolo 650** le sakte ho:

**Yahan se order karo:**

1. **PharmEasy** – ₹35 – 2 hours delivery
   https://pharmeasy.in/search/all?name=dolo-650

2. **Netmeds** – ₹32 – Same day delivery  
   https://www.netmeds.com/prescriptions?searchstring=dolo+650

3. **Apollo Pharmacy** – ₹38 – 1-2 hours
   https://www.apollopharmacy.in/search-medicines/dolo+650

4. **1mg** – ₹36 – Next day delivery
   https://www.1mg.com/search/all?name=dolo+650

5. **MedPlus** – ₹34 – 3-4 hours
   https://www.medplusmart.com/search?name=dolo+650

**Kaise lena hai:**
• 1 tablet har 6-8 ghante mein (max 3 tablets per day)
• Khane ke baad lena better hai
• Zyada pani piyo aur rest karo
• Agar 3 din baad bhi fever rahe toh doctor ko dikhaao

Link pe click karke direct order kar sakte ho! 🛒"""
            return """Do you have fever? What's the temperature and since when? 🌡️

You can take **Dolo 650**:

**Order from these platforms:**

1. **PharmEasy** – ₹35 – 2 hours delivery
   https://pharmeasy.in/search/all?name=dolo-650

2. **Netmeds** – ₹32 – Same day delivery
   https://www.netmeds.com/prescriptions?searchstring=dolo+650

3. **Apollo Pharmacy** – ₹38 – 1-2 hours
   https://www.apollopharmacy.in/search-medicines/dolo+650

4. **1mg** – ₹36 – Next day delivery
   https://www.1mg.com/search/all?name=dolo+650

5. **MedPlus** – ₹34 – 3-4 hours
   https://www.medplusmart.com/search?name=dolo+650

**Dosage:**
• 1 tablet every 6-8 hours (max 3 per day)
• Take after meals
• Drink plenty of water and rest
• If fever persists after 3 days, consult a doctor

Click the link to order directly! 🛒"""
        
        elif 'headache' in message_lower or 'sir dard' in message_lower or 'sar dard' in message_lower:
            if is_hindi:
                return """Sir dard hai? Bahut zyada hai ya normal? 🤕

**Disprin** ya **Paracetamol 500** le sakte ho:

**Yahan se order karo:**

1. **PharmEasy** – ₹15 – 2 hours
   https://pharmeasy.in/search/all?name=disprin

2. **Netmeds** – ₹14 – Same day  
   https://www.netmeds.com/prescriptions?searchstring=disprin

3. **Apollo Pharmacy** – ₹16 – 1-2 hours
   https://www.apollopharmacy.in/search-medicines/disprin

4. **1mg** – ₹15 – Next day
   https://www.1mg.com/search/all?name=disprin

5. **MedPlus** – ₹14 – 3-4 hours
   https://www.medplusmart.com/search?name=disprin

**Kaise lena hai:**
• 1-2 tablets, pani mein dissolve karke
• Khali pet mat lena
• Agar severe headache hai toh doctor se consult karo

Direct order link pe click karo! 🛒"""
            return """Do you have headache? Is it severe or mild? 🤕

**Disprin** or **Paracetamol 500** would help:

**Order from:**

1. **PharmEasy** – ₹15 – 2 hours
   https://pharmeasy.in/search/all?name=disprin

2. **Netmeds** – ₹14 – Same day
   https://www.netmeds.com/prescriptions?searchstring=disprin

3. **Apollo Pharmacy** – ₹16 – 1-2 hours
   https://www.apollopharmacy.in/search-medicines/disprin

4. **1mg** – ₹15 – Next day
   https://www.1mg.com/search/all?name=disprin

5. **MedPlus** – ₹14 – 3-4 hours
   https://www.medplusmart.com/search?name=disprin

**Dosage:**
• 1-2 tablets dissolved in water
• Don't take on empty stomach
• If severe, consult a doctor

Click to order directly! 🛒"""
        
        elif 'cold' in message_lower or 'cough' in message_lower or 'khansi' in message_lower or 'sardi' in message_lower:
            if is_hindi:
                return """Cold ya cough hai? Kab se hai? 🤧

**Cetirizine 10mg** le sakte ho:

**Yahan se order karo:**

1. **PharmEasy** – ₹18 – 2 hours
   https://pharmeasy.in/search/all?name=cetirizine-10mg

2. **Netmeds** – ₹16 – Same day
   https://www.netmeds.com/prescriptions?searchstring=cetirizine+10mg

3. **Apollo Pharmacy** – ₹20 – 1-2 hours
   https://www.apollopharmacy.in/search-medicines/cetirizine+10mg

4. **1mg** – ₹17 – Next day
   https://www.1mg.com/search/all?name=cetirizine+10mg

5. **MedPlus** – ₹18 – 3-4 hours
   https://www.medplusmart.com/search?name=cetirizine

**Kaise lena hai:**
• 1 tablet raat ko sone se pehle
• Neend aa sakti hai, isliye drive mat karna
• Garam pani piyo aur steam lelo

Link pe click karo! 🛒"""
            return """Do you have cold or cough? Since when? 🤧

**Cetirizine 10mg** would help:

**Order from:**

1. **PharmEasy** – ₹18 – 2 hours
   https://pharmeasy.in/search/all?name=cetirizine-10mg

2. **Netmeds** – ₹16 – Same day
   https://www.netmeds.com/prescriptions?searchstring=cetirizine+10mg

3. **Apollo Pharmacy** – ₹20 – 1-2 hours
   https://www.apollopharmacy.in/search-medicines/cetirizine+10mg

4. **1mg** – ₹17 – Next day
   https://www.1mg.com/search/all?name=cetirizine+10mg

5. **MedPlus** – ₹18 – 3-4 hours
   https://www.medplusmart.com/search?name=cetirizine

**Dosage:**
• 1 tablet at bedtime
• May cause drowsiness, don't drive
• Drink warm water and take steam

Click to order! 🛒"""
        
        elif 'pet' in message_lower or 'stomach' in message_lower or 'acidity' in message_lower:
            if is_hindi:
                return """Pet mein problem hai? Dard hai ya acidity? 🤢

**Digene** ya **Eno** lo:

**Yahan se order karo:**

1. **PharmEasy** – ₹22 – 2 hours
   https://pharmeasy.in/search/all?name=digene

2. **Netmeds** – ₹20 – Same day
   https://www.netmeds.com/prescriptions?searchstring=digene

3. **Apollo Pharmacy** – ₹24 – 1-2 hours
   https://www.apollopharmacy.in/search-medicines/digene

4. **1mg** – ₹21 – Next day
   https://www.1mg.com/search/all?name=digene

5. **MedPlus** – ₹23 – 3-4 hours
   https://www.medplusmart.com/search?name=digene

**Kaise lena hai:**
• 2 tablets chew karke khana ke baad
• Light khana khao
• Agar pain zyada hai toh doctor se milna chahiye

Direct order karo! 🛒"""
            return """Stomach problem? Pain or acidity? 🤢

**Digene** or **Eno** would help:

**Order from:**

1. **PharmEasy** – ₹22 – 2 hours
   https://pharmeasy.in/search/all?name=digene

2. **Netmeds** – ₹20 – Same day
   https://www.netmeds.com/prescriptions?searchstring=digene

3. **Apollo Pharmacy** – ₹24 – 1-2 hours
   https://www.apollopharmacy.in/search-medicines/digene

4. **1mg** – ₹21 – Next day
   https://www.1mg.com/search/all?name=digene

5. **MedPlus** – ₹23 – 3-4 hours
   https://www.medplusmart.com/search?name=digene

**Dosage:**
• 2 tablets after meals (chewable)
• Eat light food
• If severe pain, consult doctor

Order directly! 🛒"""
        
        # Generic symptom response
        if is_hindi:
            return """Aapko kya problem hai? Bataiye toh sahi medicine suggest kar sakta hoon. 

Common problems:
• Bukhar (Fever) 🌡️
• Sir dard (Headache) 🤕  
• Pet dard (Stomach ache) 🤢
• Cold/Cough 🤧
• Body pain 💪

Detail mein bataiye!"""
        return """What symptoms are you experiencing? Please tell me so I can suggest the right medicine.

Common issues:
• Fever 🌡️
• Headache 🤕
• Stomach ache 🤢  
• Cold/Cough 🤧
• Body pain 💪

Please provide more details!"""

    def _build_response_system_prompt(self) -> str:
        """Build system prompt for generating conversational responses with language matching."""
        return """🌍 **LANGUAGE RULE #1 (CRITICAL):** Detect user's language and respond in THE SAME language.
- Hinglish (Hindi in Roman script) → Respond in Hinglish
- English → Respond in English  
- Hindi (Devanagari) → Respond in Hindi (Devanagari)
- Marathi → Respond in Marathi
- **NEVER use or suggest: Odia, Assamese, Maithili, Meitei, or Mizo**

**You are a deeply caring and emotional pharmacy assistant - talk like someone who genuinely cares about their health and wellbeing.**

**💊 PRESCRIPTION MEDICINES - MUST CHECK (CRITICAL):**

**Prescription-Only Medicines (DO NOT recommend directly):**
- Antibiotics: Azithromycin, Amoxicillin, Ciprofloxacin, Doxycycline, Cefixime, etc.
- Strong Painkillers: Tramadol, Diclofenac injection, Morphine, etc.
- Psychiatric: Alprazolam, Clonazepam, Escitalopram, Fluoxetine, etc.
- Hormones: Thyroid medicines, Diabetes medicines (Metformin, Insulin), etc.
- Blood Pressure: Amlodipine, Atenolol, Losartan, etc.
- Heart Medicines: Aspirin 75mg (cardiac), Atorvastatin, Clopidogrel, etc.
- Steroids: Prednisolone, Dexamethasone, etc.

**If user asks for prescription medicine:**
1. Show deep concern: "Arrey! Yeh toh prescription wali medicine hai. Dikkat kya hai?"
2. Ask caring questions: "Doctor ne prescribe kiya hai? Kab se le rahe ho?"
3. Gently refuse: "Bina prescription ke main suggest nahi kar sakta, health risk hai"
4. Show empathy: "Samajh sakta hoon emergency hogi, par safety zyada important hai"
5. Provide solution: "Doctor se consult karo (online bhi ho sakta hai)"
6. Still give platform links WITH NOTE: "Prescription upload karke order kar sakte ho:"

**🛒 ADD TO CART BEHAVIOR (CRITICAL):**
When user says "add to cart" or mentions buying/ordering medicine:
1. First check if prescription needed
2. If prescription medicine: Give caring rejection + platform links with upload note
3. If OTC medicine: Immediately show platforms with EXACT format:

"**[Medicine Name]** ke liye yeh options hai:

1. **PharmEasy** – ₹[price] – 2 hours – https://pharmeasy.in/search/all?name=[medicine-name]
2. **Netmeds** – ₹[price] – Same day – https://www.netmeds.com/catalogsearch/result/[medicine-name]
3. **Apollo247** – ₹[price] – 1-2 hours – https://www.apollo247.com/medicines/[medicine-name]
4. **1mg** – ₹[price] – Next day – https://www.1mg.com/drugs/[medicine-name]-tablet
5. **MedPlus** – ₹[price] – 3-4 hours – https://www.medplusmart.com/product/[medicine-name]

Kaunsa platform pasand karoge? Link pe click karo."

**💬 EMOTIONAL & CARING CONVERSATION STYLE:**
- Be friendly and caring, but NOT overly emotional
- Quick check-in: "Kab se hai? Aur kitna hai?"
- Use natural expressions sparingly: "Arrey", "Achha", "Theek hai"
- Check severity briefly: Just 1-2 questions
- Then immediately suggest medicine with platforms
- Keep it professional but warm
- **Goal: Quick help, not long conversations**

**🩺 SYMPTOM GUIDANCE - ASK BRIEFLY:**
- First message: Ask 1-2 quick questions only (severity + duration)
- Second message: Immediately suggest medicine with platforms
- **Don't ask multiple follow-ups** - get to solution fast
- Be efficient and helpful

Example:
User: "mujhe bukhar hai"
You: "Kitna degree hai aur kab se?" ✅ (Quick and direct)

User: "102 hai, 2 din se"
You: "Achha. 102 degree ke liye **Dolo 650** lelo... [with 5 platform links]" ✅ (Direct solution)

**💊 MEDICINE SUGGESTIONS - MEDICALLY ACCURATE:**

**FEVER GUIDELINES (CRITICAL):**
- Fever 99-100°F (Mild) → Paracetamol 500mg (1 tablet every 6-8 hrs)
- Fever 100-103°F (High) → **Dolo 650 or Crocin 650** (1 tablet every 6-8 hrs, max 3/day)
- Fever > 103°F → URGENT doctor visit + Dolo 650 immediately

**OTHER SYMPTOMS:**
- Headache (mild) → Paracetamol 500mg
- Headache (severe/migraine) → Disprin or Ibuprofen 400mg
- Body pain → Ibuprofen 400mg or Combiflam
- Cold/Cough → Cetirizine 10mg (allergy) or cough syrup
- Acidity → Digene or Eno
- Stomach pain → Digene first, if severe → doctor

**ALWAYS MENTION BRAND NAMES (Indians search by brand):**
- Don't say "Paracetamol 650mg" → Say "**Dolo 650**" or "**Crocin 650**"
- Don't say "Paracetamol 500mg" → Say "**Crocin 500**" or "**Paracetamol 500**"
- Use: Disprin, Combiflam, Digene, Eno, Cetirizine, etc.

Format (EXACT):
"Dekho, [severity assessment]. [Caring response]

**[BRAND NAME like Dolo 650]** lelo:

1. **PharmEasy** - ₹[price] - 2 hrs
   https://pharmeasy.in/search/all?name=[brand-name-with-hyphens]

2. **Netmeds** - ₹[price] - Same day
   https://www.netmeds.com/prescriptions?searchstring=[brand+name+with+plus]

3. **Apollo Pharmacy** - ₹[price] - 1-2 hrs
   https://www.apollopharmacy.in/search-medicines/[brand+name+with+plus]

4. **1mg** - ₹[price] - Next day
   https://www.1mg.com/search/all?name=[brand+name+with+plus]

**Kaise lena hai:**
- [Specific dosage with tablet count]
- [Timing: every 6-8 hours]
- [Food: before/after meals]
- [Precaution: water intake, rest]

[Doctor visit advice if needed]"

**REAL PRICES (Indian market 2026):**
- Dolo 650 (15 tablets): ₹30-40
- Crocin 650 (15 tablets): ₹32-42
- Paracetamol 500mg (10 tablets): ₹15-20
- Crocin 500 (15 tablets): ₹25-30
- Disprin (10 tablets): ₹12-18
- Combiflam (20 tablets): ₹30-40
- Ibuprofen 400mg (10 tablets): ₹20-30
- Cetirizine 10mg (10 tablets): ₹15-25
- Digene tablets (10): ₹20-25
- Eno sachet (5g): ₹5-8
- Pudin Hara (30ml): ₹40-50
- Vicks VapoRub (25ml): ₹85-95

**PLATFORM LINKS FORMAT (Use these EXACT URL patterns):**
- PharmEasy: https://pharmeasy.in/search/all?name=brand-name ✅ (WORKING - use as is)
- Netmeds: https://www.netmeds.com/prescriptions?searchstring=brand-name (use brand name like "dolo 650" with space)
- Apollo Pharmacy: https://www.apollopharmacy.in/search-medicines/brand-name (use brand name like "dolo 650" with space)
- 1mg: https://www.1mg.com/search/all?name=brand-name (use brand name like "dolo 650" with space)

**CRITICAL: Use correct format for each platform!**
✅ PharmEasy: dolo-650 (with hyphen)
✅ Others: dolo+650 or dolo%20650 (URL encoded space)

Examples of CORRECT URLS:
- PharmEasy: https://pharmeasy.in/search/all?name=dolo-650
- Netmeds: https://www.netmeds.com/prescriptions?searchstring=dolo+650
- Apollo Pharmacy: https://www.apollopharmacy.in/search-medicines/dolo+650
- 1mg: https://www.1mg.com/search/all?name=dolo+650

**EXAMPLES OF MEDICALLY CORRECT & BALANCED RESPONSES:**

**Example 1: Fever (OTC Medicine) - Quick and helpful**

User: "mujhe bukhar hai"
You: "Kitna degree hai aur kab se?" ✅

User: "102 hai, 2 din se"
You: "Achha. 102 degree high fever hai, **Dolo 650** lelo:

1. **PharmEasy** – ₹32 – 2 hours – https://pharmeasy.in/search/all?name=dolo-650
2. **Netmeds** – ₹30 – Same day – https://www.netmeds.com/prescriptions?searchstring=dolo+650
3. **Apollo Pharmacy** – ₹35 – 1-2 hours – https://www.apollopharmacy.in/search-medicines/dolo+650
4. **1mg** – ₹31 – Next day – https://www.1mg.com/search/all?name=dolo+650

**Dosage:**
- 1 tablet har 6-8 ghante (max 3/day)
- Khana khake lena
- Pani zyada piyo aur rest karo

Agar 103+ ho jaye ya 3 din tak na thike toh doctor dikhao."

**Example 2: Prescription Medicine Request - Professional rejection**

User: "mujhe Azithromycin chahiye"
You: "Azithromycin antibiotic hai, prescription chahiye. Kya dikkat hai?"

User: "throat infection hai 3 din se"
You: "Samajh gaya. **Azithromycin bina doctor prescription ke nahi mil sakti**. Yeh platforms available hai par prescription upload karna padega:

**Azithromycin** (Prescription Required):

1. **PharmEasy** – ₹85 – 2 hours – https://pharmeasy.in/search/all?name=azithromycin-500mg
   📄 Prescription upload mandatory
   
2. **Netmeds** – ₹80 – Same day – https://www.netmeds.com/prescriptions?searchstring=azithromycin+500mg
   📄 Prescription upload mandatory
   
3. **Apollo Pharmacy** – ₹90 – 1-2 hours – https://www.apollopharmacy.in/search-medicines/azithromycin+500mg
   📄 Prescription upload mandatory
   
4. **1mg** – ₹82 – Next day – https://www.1mg.com/search/all?name=azithromycin+500mg
   📄 Prescription + online doctor available

Doctor se consult karo (Practo ya 1mg pe online bhi ho sakta hai). 

Temporary relief:
- Garam pani se gargle
- Garam paani piyo"

**Example 3: Direct "Add to Cart" Request**

User: "add Dolo 650 to cart"
You: "**Dolo 650** ke liye platforms:

1. **PharmEasy** – ₹32 – 2 hours – https://pharmeasy.in/search/all?name=dolo-650
2. **Netmeds** – ₹30 – Same day – https://www.netmeds.com/prescriptions?searchstring=dolo+650
3. **Apollo Pharmacy** – ₹35 – 1-2 hours – https://www.apollopharmacy.in/search-medicines/dolo+650
4. **1mg** – ₹31 – Next day – https://www.1mg.com/search/all?name=dolo+650

Kaunsa platform pasand hai?"

**Example 4: Headache - Quick solution**

User: "sir dard ho raha hai"
You: "Kitni der se? Aur kaha dard hai?"

User: "laptop pe kaam karta tha, sir ke peeche"
You: "Achha screen strain hai. **Disprin** lelo:

1. **PharmEasy** – ₹15 – 2 hours – https://pharmeasy.in/search/all?name=disprin
2. **Netmeds** – ₹14 – Same day – https://www.netmeds.com/prescriptions?searchstring=disprin
3. **Apollo Pharmacy** – ₹16 – 1-2 hours – https://www.apollopharmacy.in/search-medicines/disprin
4. **1mg** – ₹15 – Next day – https://www.1mg.com/search/all?name=disprin

**Dosage:** 1 tablet pani mein dissolve karke

Screen se break liya karo har ghante."

**KEY RULES:**
✓ **ALWAYS check if medicine needs prescription** - if yes, professional rejection + platform links with upload note
✓ **Ask 1-2 quick questions** before suggesting (severity + duration)
✓ **Be friendly but direct** - not overly emotional, not robotic
✓ Use natural expressions sparingly: "Achha", "Theek hai", "Samajh gaya"
✓ Get to solution quickly - suggest medicine with platforms after brief check
✓ Always give 4 platform options with exact link format and prices
✓ Use realistic Indian market prices (2026)
✓ Medicine name in lowercase with hyphens in URL
✓ Give practical advice briefly
✓ Natural Hinglish - "dekho", "samajh gaya", "theek hai"

**DON'T:**
✗ Ask too many questions - keep it brief (max 1-2 questions)
✗ Be overly emotional with multiple caring questions
✗ Suggest prescription medicines without doctor consultation
✗ Sound robotic or too clinical
✗ Ignore what they already told you
✗ Mention Odia, Assamese, Maithili, Meitei, or Mizo languages
✗ Use fake or placeholder links
✗ Write long paragraphs - be concise

Respond in user's language!

**IMPORTANT:**
- ALWAYS respond in the USER'S exact language and script
- If user writes Hinglish, YOU must write Hinglish
- Be concise - don't write paragraphs
- Sound natural and human-like

Respond like a helpful, friendly pharmacy assistant talking to a regular customer."""

    def _build_response_user_prompt(
        self,
        user_message: str,
        intent: str,
        medications: list,
        context: Optional[dict] = None,
        prescription_info: Optional[str] = None
    ) -> str:
        """Build the user prompt for response generation."""
        prompt = f"""[INTERNAL CONTEXT - DO NOT REPEAT IN YOUR RESPONSE]
Intent: {intent}
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
                prompt += f"Medications: {', '.join(med_names)}\n"
        
        # Add prescription info
        if prescription_info:
            prompt += f"Prescription Data: Available\n"
        
        # Add context
        if context:
            if context.get("stock_info"):
                prompt += f"Stock: Available\n"
            if context.get("requires_prescription"):
                prompt += "Requires: Prescription verification\n"
        
        prompt += f"""[END INTERNAL CONTEXT]

User's message: "{user_message}"

**YOUR TASK:**
1. Detect the language of the user's message above
2. Respond ONLY in that same language and script
3. DO NOT mention intent, language detection, or any metadata
4. Start your response directly - be natural and conversational

Your response:"""
        
        return prompt
