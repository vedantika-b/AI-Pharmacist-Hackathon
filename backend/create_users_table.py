"""
Create users table directly via PostgreSQL connection.
"""

import os
from dotenv import load_dotenv
import psycopg2
import sys

load_dotenv()

# Updated SQL to create users table
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
    """Create users table using direct PostgreSQL connection."""
    
    print("📋 Creating users table...")
    print()
    
    # Get Database URL
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ Error: DATABASE_URL must be set in .env")
        print()
        print("Your .env file should have:")
        print("DATABASE_URL=postgresql://postgres:password@host:5432/postgres")
        sys.exit(1)
    
    try:
        # Connect to database
        print(f"🔌 Connecting to database...")
        conn = psycopg2.connect(database_url)
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
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        print()
        print("Troubleshooting:")
        print("1. Check your DATABASE_URL in .env is correct")
        print("2. Verify you have permission to create tables")
        print("3. Check if the database is accessible")
        sys.exit(1)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    create_users_table()
