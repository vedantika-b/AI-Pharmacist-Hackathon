from supabase import create_client, Client
import os

# 🔹 Replace with your actual Supabase credentials
SUPABASE_URL = "https://hcibzlnjflinaemjsxyf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjaWJ6bG5qZmxpbmFlbWpzeHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDIxMzQsImV4cCI6MjA4NjkxODEzNH0.cgL1EdHo1bHJBfzKYKpTjfKnIBH-k5laRzLFcy83bDE"

try:
    # Create client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Simple test query (use any existing table from your schema)
    response = supabase.table("roles").select("*").limit(1).execute()

    print("✅ Supabase connection successful!")
    print("Sample data:", response.data)

except Exception as e:
    print("❌ Supabase connection failed!")
    print("Error:", str(e))