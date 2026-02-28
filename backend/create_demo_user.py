"""
Create demo user with hashed password for testing login.
"""

import os
import sys
from dotenv import load_dotenv
import bcrypt
from datetime import datetime

# Load environment variables
load_dotenv()

# Import Supabase client
from supabase import create_client

# Demo user credentials (matching frontend)
DEMO_USER = {
    "email": "vedantikabhoyar135@gmail.com",
    "password": "admin123",  # Plain text password
    "full_name": "Vedantika Bhoyar"
}


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_demo_user():
    """Create or update demo user in database."""
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        sys.exit(1)
    
    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)
    
    print("🔐 Creating demo user...")
    print(f"   Email: {DEMO_USER['email']}")
    print(f"   Password: {DEMO_USER['password']}")
    print(f"   Name: {DEMO_USER['full_name']}")
    print()
    
    # Hash password
    password_hash = hash_password(DEMO_USER['password'])
    print(f"✅ Password hashed: {password_hash[:50]}...")
    print()
    
    # Check if user already exists
    try:
        result = supabase.table("users").select("*").eq("email", DEMO_USER['email']).execute()
        
        if result.data and len(result.data) > 0:
            print("⚠️  User already exists. Updating password hash...")
            
            # Update existing user
            update_result = supabase.table("users").update({
                "password_hash": password_hash,
                "full_name": DEMO_USER['full_name']
            }).eq("email", DEMO_USER['email']).execute()
            
            if update_result.data:
                print("✅ Demo user updated successfully!")
                print(f"   User ID: {update_result.data[0]['id']}")
            else:
                print("❌ Failed to update user")
                sys.exit(1)
        else:
            print("📝 Creating new user...")
            
            # Create new user
            new_user = {
                "email": DEMO_USER['email'],
                "password_hash": password_hash,
                "full_name": DEMO_USER['full_name'],
                "created_at": datetime.utcnow().isoformat()
            }
            
            insert_result = supabase.table("users").insert(new_user).execute()
            
            if insert_result.data:
                print("✅ Demo user created successfully!")
                print(f"   User ID: {insert_result.data[0]['id']}")
            else:
                print("❌ Failed to create user")
                sys.exit(1)
    
    except Exception as e:
        print(f"❌ Database error: {e}")
        print()
        print("📋 Make sure your 'users' table exists with this schema:")
        print("""
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
        """)
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("✅ Setup complete! You can now login with:")
    print(f"   Email: {DEMO_USER['email']}")
    print(f"   Password: {DEMO_USER['password']}")
    print("=" * 60)


if __name__ == "__main__":
    create_demo_user()
