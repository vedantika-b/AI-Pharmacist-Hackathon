"""
Script to create patient_feedback table in Supabase
"""

import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def create_feedback_table():
    """Create patient_feedback table in Supabase"""
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Read the SQL file
    with open("../database/patient_feedback.sql", "r") as f:
        sql = f.read()
    
    print("Creating patient_feedback table...")
    print("Please run the following SQL directly in Supabase SQL Editor:")
    print("\n" + "="*80)
    print(sql)
    print("="*80 + "\n")
    
    print("Instructions:")
    print("1. Go to your Supabase project: https://app.supabase.com")
    print("2. Navigate to SQL Editor")
    print("3. Copy and paste the SQL above")
    print("4. Click 'Run'")
    print("\nAlternatively, you can run this SQL using psql or any PostgreSQL client.")

if __name__ == "__main__":
    create_feedback_table()
