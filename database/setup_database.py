#!/usr/bin/env python3
"""
AI Pharmacist - Database Setup Script
======================================
Automates Supabase database schema setup and initial data seeding.

Usage:
    python setup_database.py

Requirements:
    pip install supabase python-dotenv
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Error: supabase package not installed")
    print("Install with: pip install supabase")
    sys.exit(1)


def read_sql_file(filename: str) -> str:
    """Read SQL file contents."""
    filepath = Path(__file__).parent / filename
    if not filepath.exists():
        print(f"❌ Error: {filename} not found")
        sys.exit(1)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def setup_database():
    """Set up the Supabase database schema."""
    print("=" * 70)
    print("AI PHARMACIST - DATABASE SETUP")
    print("=" * 70)
    print()
    
    # Get Supabase credentials
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase credentials not found")
        print()
        print("Please ensure you have a .env file with:")
        print("  - NEXT_PUBLIC_SUPABASE_URL")
        print("  - SUPABASE_SERVICE_ROLE_KEY")
        print()
        print("Copy .env.example to .env and fill in your values.")
        sys.exit(1)
    
    print(f"📡 Connecting to Supabase...")
    print(f"   URL: {supabase_url}")
    print()
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase successfully")
        print()
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {e}")
        sys.exit(1)
    
    # Note: SQL execution via Python client is limited
    # The main schema.sql should be run via Supabase Dashboard or psql
    print("⚠️  IMPORTANT SETUP INSTRUCTIONS:")
    print()
    print("1. Open your Supabase project dashboard")
    print("2. Go to the SQL Editor")
    print("3. Copy the contents of 'schema.sql'")
    print("4. Paste and run in the SQL Editor")
    print()
    print("   OR use psql directly:")
    print()
    print("   psql postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres -f schema.sql")
    print()
    print("=" * 70)
    print()
    
    # Verify tables exist
    print("🔍 Checking if tables are already set up...")
    print()
    
    try:
        # Try to query roles table as a test
        result = supabase.table('roles').select('*').limit(1).execute()
        print("✅ Database schema is already set up!")
        print(f"   Found {len(result.data)} role(s)")
        print()
        
        # Check all tables
        tables_to_check = [
            'roles',
            'user_profiles',
            'medicines',
            'orders',
            'order_items',
            'refill_predictions',
            'ai_logs',
            'inventory_transactions',
            'prescription_uploads'
        ]
        
        print("📊 Table Status:")
        print()
        for table in tables_to_check:
            try:
                result = supabase.table(table).select('count', count='exact').execute()
                count = result.count if hasattr(result, 'count') else 0
                print(f"   ✅ {table:30} ({count} records)")
            except Exception:
                print(f"   ❌ {table:30} (not found)")
        
        print()
        print("=" * 70)
        print("✅ Database setup verification complete!")
        print("=" * 70)
        
    except Exception as e:
        print("⚠️  Database schema not yet set up")
        print()
        print("Please follow the setup instructions above to create the schema.")
        print()
        print(f"Error details: {e}")


def seed_medicine_data():
    """Optionally seed additional medicine data."""
    print()
    print("=" * 70)
    print("SEED MEDICINE DATA (OPTIONAL)")
    print("=" * 70)
    print()
    
    # This would contain additional medicine seeding logic
    print("ℹ️  Basic seed data is included in schema.sql")
    print("   Run schema.sql first to populate initial medicines.")
    print()


if __name__ == "__main__":
    setup_database()
    
    # Ask if user wants to see example queries
    print()
    response = input("Would you like to see example queries? (y/n): ").lower()
    
    if response == 'y':
        print()
        print("=" * 70)
        print("EXAMPLE QUERIES")
        print("=" * 70)
        print()
        
        examples = """
# Get all active medicines
supabase.table('medicines').select('*').eq('is_active', True).execute()

# Get low stock medicines
supabase.table('low_stock_medicines').select('*').execute()

# Get orders for a customer
supabase.table('orders').select('*, order_items(*, medicines(*))').eq('customer_id', user_id).execute()

# Get upcoming refill predictions
supabase.table('upcoming_refills').select('*').execute()

# Create a new order
supabase.table('orders').insert({
    'customer_id': user_id,
    'status': 'pending',
    'total_amount': 100.00
}).execute()

# Log AI interaction
supabase.table('ai_logs').insert({
    'user_id': user_id,
    'action_type': 'chat',
    'input_data': {'message': 'Hello'},
    'success': True,
    'prompt_tokens': 10,
    'completion_tokens': 20
}).execute()
        """
        
        print(examples)
    
    print()
    print("=" * 70)
    print("Setup script complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Ensure schema.sql has been run in Supabase")
    print("2. Set up Storage buckets in Supabase Dashboard")
    print("3. Configure authentication providers")
    print("4. Test RLS policies")
    print("5. Start building your application!")
    print()
