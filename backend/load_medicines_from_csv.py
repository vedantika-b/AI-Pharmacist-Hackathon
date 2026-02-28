"""
Script to load medicines from CSV file into Supabase database.
Run this to populate the medicines table with all products.
"""

import csv
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import sys

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Initialize Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        sys.exit(1)
    
    return create_client(url, key)

def load_medicines_from_csv(csv_path: str):
    """Load medicines from CSV file into Supabase."""
    
    print("=" * 60)
    print("Loading Medicines from CSV to Supabase")
    print("=" * 60)
    print()
    
    # Initialize Supabase client
    try:
        supabase = get_supabase_client()
        print("✓ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return
    
    # Read CSV file
    medicines = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                # Map CSV columns to database schema
                medicine = {
                    'name': row['product name'],
                    'generic_name': row['product name'],
                    'brand_name': row['product name'],
                    'description': row['descriptions'],
                    'price': float(row['price rec'].replace(',', '.')) if row['price rec'] else 0.0,
                    'category': extract_category(row['descriptions']),
                    'stock_quantity': 100,  # Default stock
                    'prescription_required': is_prescription_required(row['descriptions']),
                    'is_active': True,
                    'strength': extract_strength(row['product name']),
                    'form': extract_dosage_form(row['product name']),
                }
                medicines.append(medicine)
        
        print(f"✓ Read {len(medicines)} medicines from CSV")
    except Exception as e:
        print(f"❌ Failed to read CSV: {e}")
        return
    
    # Insert medicines into Supabase
    success_count = 0
    error_count = 0
    
    print()
    print("Inserting medicines into database...")
    print()
    
    for idx, medicine in enumerate(medicines, 1):
        try:
            # Check if medicine already exists
            existing = supabase.table('medicines').select('id').eq('name', medicine['name']).execute()
            
            if existing.data:
                # Update existing medicine
                supabase.table('medicines').update(medicine).eq('name', medicine['name']).execute()
                print(f"  ✓ Updated: {medicine['name']}")
            else:
                # Insert new medicine
                supabase.table('medicines').insert(medicine).execute()
                print(f"  ✓ Inserted: {medicine['name']}")
            
            success_count += 1
        except Exception as e:
            print(f"  ❌ Failed to insert {medicine['name']}: {e}")
            error_count += 1
    
    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"✓ Successfully processed: {success_count}")
    print(f"❌ Errors: {error_count}")
    print(f"Total: {len(medicines)}")
    print()

def extract_category(description: str) -> str:
    """Extract category from description."""
    keywords = {
        'Pain Relief': ['schmerz', 'pain', 'ibuprofen', 'paracetamol'],
        'Vitamins': ['vitamin', 'b12', 'multivitamin'],
        'Digestive': ['darm', 'verdauung', 'magen', 'durchfall', 'verstopfung'],
        'Respiratory': ['husten', 'atemweg', 'nasen', 'sinupret'],
        'Skin Care': ['haut', 'salbe', 'creme', 'gel', 'skin', 'wund'],
        'Eye Care': ['augen', 'augentropfen', 'eye'],
        'Allergy': ['allergi', 'antihistamin', 'cetirizin'],
        'Supplements': ['omega', 'probiotik', 'nahrungsergänzung'],
        'Heart': ['herz', 'ramipril', 'bluthochdruck'],
    }
    
    description_lower = description.lower()
    for category, terms in keywords.items():
        if any(term in description_lower for term in terms):
            return category
    
    return 'General Health'

def is_prescription_required(description: str) -> bool:
    """Determine if prescription is required."""
    prescription_keywords = ['verschreibungspflichtig', 'arzneimittel']
    return any(keyword in description.lower() for keyword in prescription_keywords)

def extract_strength(name: str) -> str:
    """Extract strength/dosage from product name."""
    import re
    # Look for patterns like "500 mg", "10 mg/ml", etc.
    match = re.search(r'\d+\.?\d*\s*(mg|g|ml|mcg|iu|%)', name, re.IGNORECASE)
    return match.group(0) if match else None

def extract_dosage_form(name: str) -> str:
    """Extract dosage form from product name."""
    forms = {
        'tablet': ['tabletten', 'dragées'],
        'liquid': ['tropfen', 'lösung'],
        'cream': ['salbe', 'creme'],
        'capsule': ['kapseln', 'hartkapseln'],
        'syrup': ['saft'],
        'ointment': ['gel'],
        'inhaler': ['spray', 'inhal'],
    }
    
    name_lower = name.lower()
    for form, keywords in forms.items():
        if any(keyword in name_lower for keyword in keywords):
            return form
    
    return 'other'

if __name__ == "__main__":
    csv_file_path = "../data/products-export.csv"
    load_medicines_from_csv(csv_file_path)
