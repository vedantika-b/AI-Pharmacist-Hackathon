"""
Create users table using Supabase client (simpler approach).
"""
import asyncio
from core.database import get_supabase_client
from dotenv import load_dotenv

load_dotenv()

async def create_users_table():
    """Create users table using Supabase client's SQL RPC."""
    
    print("📋 Setting up users table via Supabase...")
    print()
    
    # SQL to create users table
    create_table_sql = """
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

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;
    """
    
    try:
        supabase = get_supabase_client()
        
        # Note: Supabase Python client doesn't support direct SQL execution
        # You need to run this in the Supabase SQL Editor
        
        print("⚠️  Supabase Python client doesn't support direct DDL execution.")
        print()
        print("Please follow these steps:")
        print()
        print("1. Open your Supabase dashboard:")
        print("   https://app.supabase.com/project/ymqwourldnmrapisunly")
        print()
        print("2. Go to SQL Editor (left sidebar)")
        print()
        print("3. Create a new query and paste this SQL:")
        print()
        print("-" * 60)
        print(create_table_sql)
        print("-" * 60)
        print()
        print("4. Click 'Run' to execute")
        print()
        print("5. Then come back here and run: python create_demo_user.py")
        print()
        
        # Save SQL to file for easy access
        with open("create_users_table.sql", "w") as f:
            f.write(create_table_sql)
        
        print("✅ SQL saved to create_users_table.sql")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_users_table())
