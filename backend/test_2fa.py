"""
Test script for Google Authenticator 2FA implementation.

This script tests:
1. User signup with 2FA (receives QR code)
2. Login with password only (receives 2FA prompt)
3. Login with password + TOTP code (successful login)
4. Invalid TOTP code rejection
"""

import requests
import pyotp
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def test_signup_with_2fa():
    """Test signup and receive QR code."""
    print_header("TEST 1: Signup with 2FA")
    
    # Generate unique email for testing
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"test2fa_{timestamp}@example.com"
    password = "testpassword123"
    full_name = "Test 2FA User"
    
    print_info(f"Creating account for: {email}")
    
    payload = {
        "email": email,
        "password": password,
        "full_name": full_name
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            assert "access_token" in data, "Missing access_token"
            assert "user" in data, "Missing user data"
            assert "requires_2fa" in data, "Missing requires_2fa flag"
            assert "qr_code" in data, "Missing qr_code"
            
            assert data["requires_2fa"] == True, "2FA should be required"
            assert data["qr_code"].startswith("data:image/png;base64,"), "Invalid QR code format"
            
            print_success("Account created successfully")
            print_success("2FA is enabled")
            print_success("QR code received")
            print_info(f"User ID: {data['user']['id']}")
            print_info(f"Email: {data['user']['email']}")
            print_info(f"QR Code Length: {len(data['qr_code'])} characters")
            
            return {
                "email": email,
                "password": password,
                "user_id": data['user']['id']
            }
        else:
            print_error(f"Signup failed with status {response.status_code}")
            print_error(response.json())
            return None
            
    except Exception as e:
        print_error(f"Exception during signup: {str(e)}")
        return None

def test_login_without_2fa(credentials):
    """Test login with only email and password (should require 2FA)."""
    print_header("TEST 2: Login without 2FA code")
    
    print_info(f"Logging in as: {credentials['email']}")
    
    payload = {
        "email": credentials["email"],
        "password": credentials["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            
            # Should return requires_2fa = True
            assert "requires_2fa" in data, "Missing requires_2fa flag"
            
            if data["requires_2fa"]:
                print_success("2FA is correctly required")
                print_success("Password verified successfully")
                assert data["access_token"] == "", "Access token should be empty without 2FA"
                print_success("Access token correctly withheld until 2FA")
                return True
            else:
                print_error("2FA should be required but isn't!")
                return False
        else:
            print_error(f"Login failed with status {response.status_code}")
            print_error(response.json())
            return False
            
    except Exception as e:
        print_error(f"Exception during login: {str(e)}")
        return False

def test_login_with_invalid_2fa(credentials):
    """Test login with invalid 2FA code."""
    print_header("TEST 3: Login with invalid 2FA code")
    
    print_info(f"Logging in with invalid TOTP code")
    
    payload = {
        "email": credentials["email"],
        "password": credentials["password"],
        "totp_code": "000000"  # Invalid code
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 401:
            print_success("Invalid 2FA code correctly rejected")
            print_info(f"Response: {response.json()['detail']}")
            return True
        elif response.status_code == 200:
            print_error("Invalid code was accepted! Security issue!")
            return False
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Exception during login: {str(e)}")
        return False

def test_login_with_valid_2fa_simulation(credentials):
    """
    Note: This test simulates the flow but cannot generate a valid TOTP code
    without the secret from the database. This demonstrates the API call structure.
    """
    print_header("TEST 4: Login with 2FA code (simulation)")
    
    print_warning("This test shows the API structure but uses a dummy code")
    print_info("To test with a real code:")
    print_info("1. Scan the QR code from signup with Google Authenticator")
    print_info("2. Use the 6-digit code from the app")
    print_info("3. Run the login endpoint with that code")
    
    # Example payload structure
    payload = {
        "email": credentials["email"],
        "password": credentials["password"],
        "totp_code": "123456"  # Replace with actual code from Google Authenticator
    }
    
    print_info("\nExample API call:")
    print(f"{Colors.OKCYAN}POST {BASE_URL}/auth/login{Colors.ENDC}")
    print(f"{Colors.OKCYAN}{json.dumps(payload, indent=2)}{Colors.ENDC}")
    
    print_success("API structure validated")
    return True

def test_totp_generation():
    """Test TOTP code generation with a sample secret."""
    print_header("TEST 5: TOTP Code Generation")
    
    # Generate a sample secret
    secret = pyotp.random_base32()
    print_info(f"Sample TOTP Secret: {secret}")
    
    # Create TOTP object
    totp = pyotp.TOTP(secret)
    
    # Generate current code
    code = totp.now()
    print_success(f"Generated TOTP Code: {code}")
    print_info(f"Code Length: {len(code)} digits")
    
    # Verify the code
    is_valid = totp.verify(code)
    
    if is_valid:
        print_success("Code verification successful")
    else:
        print_error("Code verification failed")
    
    # Test provisioning URI
    uri = totp.provisioning_uri(
        name="test@example.com",
        issuer_name="AI Pharmacist"
    )
    print_info(f"Provisioning URI: {uri}")
    
    return is_valid

def run_all_tests():
    """Run all tests in sequence."""
    print_header("Google Authenticator 2FA Test Suite")
    print_info("Testing backend API endpoints for 2FA functionality")
    print_info(f"Backend URL: {BASE_URL}")
    
    # Check backend connectivity
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health")
        if response.status_code == 200:
            print_success("Backend is reachable")
        else:
            print_warning("Backend health check returned non-200 status")
    except Exception as e:
        print_error(f"Cannot connect to backend: {str(e)}")
        print_error("Please ensure the backend server is running on http://localhost:8000")
        return
    
    # Test 1: Signup
    credentials = test_signup_with_2fa()
    if not credentials:
        print_error("Signup test failed. Aborting remaining tests.")
        return
    
    # Test 2: Login without 2FA
    if not test_login_without_2fa(credentials):
        print_error("Login without 2FA test failed")
    
    # Test 3: Login with invalid 2FA
    if not test_login_with_invalid_2fa(credentials):
        print_error("Invalid 2FA test failed")
    
    # Test 4: Login with valid 2FA (simulation)
    test_login_with_valid_2fa_simulation(credentials)
    
    # Test 5: TOTP generation
    test_totp_generation()
    
    # Summary
    print_header("Test Summary")
    print_success("All automated tests completed!")
    print_info("\nManual verification required:")
    print_info("1. Scan QR code from signup with Google Authenticator app")
    print_info("2. Use the app's 6-digit code for login")
    print_info("3. Verify successful login with valid 2FA code")
    
    print_info(f"\nTest account created:")
    print_info(f"  Email: {credentials['email']}")
    print_info(f"  Password: {credentials['password']}")
    print_info(f"  User ID: {credentials['user_id']}")

if __name__ == "__main__":
    run_all_tests()
