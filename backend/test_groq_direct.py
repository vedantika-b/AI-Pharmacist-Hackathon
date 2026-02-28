"""
Direct test of Groq API to isolate the issue.
"""
import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key loaded: {api_key[:20]}..." if api_key else "API Key NOT FOUND")

if not api_key:
    print("ERROR: GROQ_API_KEY not found in environment!")
    exit(1)

try:
    print("\n🔍 Testing Groq API connection...")
    client = Groq(api_key=api_key)
    
    print("📡 Sending test request...")
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a helpful assistant. Respond in JSON format with a 'test' field."},
            {"role": "user", "content": "Say hello"}
        ],
        temperature=0.1,
        max_tokens=100,
        response_format={"type": "json_object"},
        timeout=10
    )
    
    print("✅ Response received!")
    print(f"Content: {response.choices[0].message.content}")
    print("\n✅ Groq API is working correctly!")
    
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {str(e)}")
    import traceback
    print(traceback.format_exc())
