#!/usr/bin/env python3
"""
Quick setup script for Google Authenticator 2FA implementation.

This script:
1. Checks dependencies
2. Provides database migration instructions
3. Verifies backend configuration
4. Runs test suite
"""

import sys
import subprocess
import importlib.util

def check_dependency(package_name, import_name=None):
    """Check if a Python package is installed."""
    if import_name is None:
        import_name = package_name
    
    spec = importlib.util.find_spec(import_name)
    return spec is not None

def print_header(text):
    print(f"\n{'='*60}")
    print(f"{text}")
    print(f"{'='*60}\n")

def check_dependencies():
    """Check if all required dependencies are installed."""
    print_header("Checking Dependencies")
    
    required_packages = [
        ("pyotp", "pyotp"),
        ("qrcode", "qrcode"),
        ("bcrypt", "bcrypt"),
        ("PyJWT", "jwt"),
        ("requests", "requests"),
    ]
    
    missing = []
    
    for package, import_name in required_packages:
        if check_dependency(package, import_name):
            print(f"✓ {package} is installed")
        else:
            print(f"✗ {package} is NOT installed")
            missing.append(package)
    
    if missing:
        print(f"\n⚠ Missing packages: {', '.join(missing)}")
        print(f"\nTo install missing packages, run:")
        print(f"  pip install {' '.join(missing)}")
        return False
    else:
        print("\n✓ All dependencies are installed!")
        return True

def show_database_migration_instructions():
    """Show instructions for database migration."""
    print_header("Database Migration")
    
    print("To add the 2FA column to your users table, run the following SQL:")
    print("\n--- SQL Migration Script ---")
    print("ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;")
    print("CREATE INDEX IF NOT EXISTS idx_users_totp_secret ON users(totp_secret) WHERE totp_secret IS NOT NULL;")
    print("COMMENT ON COLUMN users.totp_secret IS 'TOTP secret for Google Authenticator 2FA';")
    print("---------------------------\n")
    
    print("Options to run this migration:")
    print("1. Supabase Dashboard:")
    print("   - Go to Database > SQL Editor")
    print("   - Paste the SQL above")
    print("   - Click 'Run'")
    print("\n2. Command line (psql):")
    print("   psql -U your_user -d your_database -f database/add_2fa_column.sql")
    print("\n3. Python script:")
    print("   python database/setup_database.py")

def verify_backend_config():
    """Verify backend configuration."""
    print_header("Backend Configuration")
    
    print("Please verify the following:")
    print("1. Backend server is running on http://localhost:8000")
    print("2. Database connection is configured in .env")
    print("3. JWT_SECRET_KEY is set in environment variables")
    print("4. Supabase credentials are configured")
    
    print("\nTo start the backend server:")
    print("  cd backend")
    print("  python run.py")
    
    response = input("\nIs the backend server running? (y/n): ").lower()
    return response == 'y'

def run_tests():
    """Run the 2FA test suite."""
    print_header("Running 2FA Test Suite")
    
    try:
        subprocess.run([sys.executable, "test_2fa.py"], check=True)
        return True
    except subprocess.CalledProcessError:
        print("✗ Tests failed")
        return False
    except FileNotFoundError:
        print("✗ test_2fa.py not found")
        return False

def show_manual_testing_instructions():
    """Show manual testing instructions."""
    print_header("Manual Testing Instructions")
    
    print("Frontend Testing:")
    print("\n1. Start the frontend:")
    print("   cd frontend")
    print("   npm run dev")
    
    print("\n2. Test Signup Flow:")
    print("   - Navigate to http://localhost:3000/auth/signup")
    print("   - Create a new account")
    print("   - You should see a QR code screen")
    print("   - Install Google Authenticator on your phone")
    print("   - Scan the QR code")
    print("   - The app will show a 6-digit code")
    
    print("\n3. Test Login Flow:")
    print("   - Navigate to http://localhost:3000/auth/login")
    print("   - Enter your email and password")
    print("   - You should be prompted for a 2FA code")
    print("   - Open Google Authenticator")
    print("   - Enter the current 6-digit code")
    print("   - You should be logged in successfully")
    
    print("\n4. Test Invalid 2FA Code:")
    print("   - Try logging in with an incorrect code (e.g., 000000)")
    print("   - Login should be rejected")

def show_implementation_summary():
    """Show summary of what was implemented."""
    print_header("Implementation Summary")
    
    print("Backend Changes:")
    print("✓ auth.py: Added 2FA support to login and signup endpoints")
    print("✓ Added TOTP secret generation and verification")
    print("✓ Added QR code generation for Google Authenticator")
    print("✓ requirements.txt: Added pyotp and qrcode dependencies")
    
    print("\nFrontend Changes:")
    print("✓ signup/page.tsx: Added QR code display after signup")
    print("✓ login/page.tsx: Added 2FA code input screen")
    print("✓ AuthContext.tsx: Updated to handle 2FA flow")
    
    print("\nDatabase Changes:")
    print("✓ users table: Added totp_secret column")
    
    print("\nDocumentation:")
    print("✓ 2FA_IMPLEMENTATION_GUIDE.md: Comprehensive guide")
    print("✓ test_2fa.py: Automated test suite")

def main():
    """Main setup function."""
    print_header("Google Authenticator 2FA Setup")
    print("AI Pharmacist - Two-Factor Authentication Implementation")
    
    # Step 1: Check dependencies
    if not check_dependencies():
        print("\n⚠ Please install missing dependencies before continuing")
        return
    
    # Step 2: Database migration
    show_database_migration_instructions()
    response = input("\nHave you run the database migration? (y/n): ").lower()
    if response != 'y':
        print("\n⚠ Please run the database migration before proceeding")
        return
    
    # Step 3: Verify backend
    if not verify_backend_config():
        print("\n⚠ Please start the backend server before running tests")
        return
    
    # Step 4: Run automated tests
    response = input("\nRun automated tests? (y/n): ").lower()
    if response == 'y':
        run_tests()
    
    # Step 5: Show manual testing instructions
    show_manual_testing_instructions()
    
    # Step 6: Show implementation summary
    show_implementation_summary()
    
    print_header("Setup Complete!")
    print("✓ All setup steps completed")
    print("\nNext steps:")
    print("1. Review the comprehensive guide: 2FA_IMPLEMENTATION_GUIDE.md")
    print("2. Test the signup and login flows manually")
    print("3. Verify 2FA works with Google Authenticator app")
    print("\nFor troubleshooting, see the guide's Troubleshooting section")

if __name__ == "__main__":
    main()
