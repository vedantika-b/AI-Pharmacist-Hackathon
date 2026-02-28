"""
Create users table - auto-builds PostgreSQL connection from Supabase URL.
"""
import os
from dotenv import load_dotenv
import psycopg2
import sys

load_dotenv()

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;
"""


def build_database_url_from_supabase():
    """Build PostgreSQL connection URL from Supabase URL."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url:
        return None
    
    # Extract project reference from Supabase URL
    # Format: https://PROJECT_REF.supabase.co
    if "supabase.co" in supabase_url:
        project_ref = supabase_url.replace("https://", "").replace(".supabase.co", "").split("/")[0]
        
        # Build PostgreSQL connection string
        # Supabase format: postgresql://postgres:[YOUR-PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres
        
        # Try to get password from DATABASE_URL if it exists
        database_url = os.getenv("DATABASE_URL")
        if database_url and ":" in database_url:
            # Extract password from existing DATABASE_URL
            try:
                password_part = database_url.split("postgres:")[1].split("@")[0]
                return f"postgresql://postgres.{project_ref}:{password_part}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
            except:
                pass
        
        print("⚠️  Cannot auto-build DATABASE_URL without password.")
        print()
        print("Please set DATABASE_URL in your .env file:")
        print(f"DATABASE_URL=postgresql://postgres.{project_ref}:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")
        print()
        print("You can find your database password in:")
        print("Supabase Dashboard > Project Settings > Database > Connection String")
        return None
    
    return None


def create_users_table():
    """Create users table using PostgreSQL connection."""
    
    print("📋 Creating users table...")
    print()
    
    # Try to get DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        # Try to build from Supabase URL
        print("DATABASE_URL not found in .env, attempting to build from SUPABASE_URL...")
        database_url = build_database_url_from_supabase()
        
        if not database_url:
            print()
            print("❌ DATABASE_URL is required but not set.")
            sys.exit(1)
    
    try:
        # Connect to database
        print(f"🔌 Connecting to database...")
        conn = psycopg2.connect(database_url, connect_timeout=10)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Execute SQL
        print("⚙️  Creating users table...")
        cursor.execute(CREATE_USERS_TABLE_SQL)
        
        # Verify table was created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        """)
        
        result = cursor.fetchone()
        
        if result:
            print("✅ Users table created successfully!")
            print()
            
            # Show table structure
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            """)
            
            print("📋 Table Structure:")
            print("-" * 60)
            for row in cursor.fetchall():
                nullable = "NULL" if row[2] == "YES" else "NOT NULL"
                print(f"   {row[0]:<20} {row[1]:<20} {nullable}")
            print("-" * 60)
            print()
            print("✅ Setup complete! Now run: python create_demo_user.py")
        else:
            print("⚠️  Table may not have been created. Check database permissions.")
        
        cursor.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection error: {e}")
        print()
        print("Troubleshooting:")
        print("1. Check your DATABASE_URL in .env is correct")
        print("2. Verify the database password is correct")
        print("3. Make sure you're using the connection pooler port (6543)")
        print()
        print("Expected format:")
        print("DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")
        sys.exit(1)
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        print()
        print("The table might already exist. Try running: python create_demo_user.py")
        sys.exit(1)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    create_users_table()
