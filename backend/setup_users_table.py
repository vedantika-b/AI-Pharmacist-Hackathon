"""
Create users table in Supabase database.
"""

import os
from dotenv import load_dotenv
from supabase import create_client
import sys

load_dotenv()

# SQL to create users table
CREATE_USERS_TABLE_SQL = """
-- Create users table for backend authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on active users
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;
"""


def create_users_table():
    """Create users table in Supabase."""
    
    print("📋 Creating users table in Supabase...")
    print()
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        sys.exit(1)
    
    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)
    
    try:
        # Execute SQL using Supabase RPC or direct SQL
        # Note: Supabase Python client doesn't support direct SQL execution easily
        # We'll use the REST API to execute SQL
        
        print("⚠️  Note: You need to run this SQL in your Supabase SQL Editor:")
        print()
        print("=" * 60)
        print(CREATE_USERS_TABLE_SQL)
        print("=" * 60)
        print()
        print("Steps:")
        print("1. Go to https://app.supabase.com/project/ymqwourldnmrapisunly/sql/new")
        print("2. Copy the SQL above")
        print("3. Paste it into the SQL editor")
        print("4. Click 'Run'")
        print()
        print("After running the SQL, run: python create_demo_user.py")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    create_users_table()
