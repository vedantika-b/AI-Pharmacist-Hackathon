"""
Comprehensive 2FA Test Script
Tests signup and login with Google Authenticator 2FA
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_success(text):
    print(f"✓ {text}")

def print_error(text):
    print(f"✗ {text}")

def print_info(text):
    print(f"ℹ {text}")

# Test 1: Create account with 2FA
print_header("TEST 1: Signup with 2FA")

timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
test_email = f"test2fa_{timestamp}@example.com"
test_password = "testpass123"
test_name = "Test 2FA User"

print_info(f"Creating account: {test_email}")

try:
    response = requests.post(
        f"{BASE_URL}/auth/signup",
        json={
            "email": test_email,
            "password": test_password,
            "full_name": test_name
        },
        timeout=10
    )
    
    print_info(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print_success("Account created successfully!")
        
        # Check for required fields
        if "access_token" in data:
            print_success("Access token received")
        else:
            print_error("Missing access token")
            
        if "user" in data:
            print_success(f"User data received: {data['user']['email']}")
        else:
            print_error("Missing user data")
            
        if "requires_2fa" in data and data["requires_2fa"]:
            print_success("2FA is enabled ✓")
        else:
            print_error("2FA not enabled")
            
        if "qr_code" in data:
            qr_len = len(data["qr_code"])
            print_success(f"QR code received! (Length: {qr_len} characters)")
            if data["qr_code"].startswith("data:image/png;base64,"):
                print_success("QR code format is correct (base64 PNG)")
            else:
                print_error("QR code format is incorrect")
        else:
            print_error("No QR code received - 2FA may not be working!")
            
        print("\n" + "-"*60)
        print("Full Response:")
        print(json.dumps({k: v for k, v in data.items() if k != 'qr_code'}, indent=2))
        
    else:
        print_error(f"Signup failed with status {response.status_code}")
        print_error(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print_error("Cannot connect to backend!")
    print_error("Make sure backend is running on http://localhost:8000")
    exit(1)
except Exception as e:
    print_error(f"Error: {str(e)}")
    exit(1)

# Test 2: Login without 2FA code (should prompt for 2FA)
print_header("TEST 2: Login without 2FA code")

print_info("Attempting login with only email/password...")

try:
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": test_email,
            "password": test_password
        },
        timeout=10
    )
    
    print_info(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        if "requires_2fa" in data and data["requires_2fa"]:
            print_success("2FA prompt is working correctly!")
            print_success("Password verified, now requesting 2FA code")
            
            if data.get("access_token") == "":
                print_success("Access token correctly withheld until 2FA")
            else:
                print_error("Access token should be empty without 2FA")
                
        else:
            print_error("Should require 2FA but doesn't!")
            
        print("\n" + "-"*60)
        print("Response:")
        print(json.dumps(data, indent=2))
        
    else:
        print_error(f"Login failed with status {response.status_code}")
        print_error(f"Response: {response.text}")
        
except Exception as e:
    print_error(f"Error: {str(e)}")

# Test 3: Test invalid 2FA code
print_header("TEST 3: Login with invalid 2FA code")

print_info("Testing with invalid code (000000)...")

try:
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": test_email,
            "password": test_password,
            "totp_code": "000000"
        },
        timeout=10
    )
    
    print_info(f"Status Code: {response.status_code}")
    
    if response.status_code == 401:
        print_success("Invalid 2FA code correctly rejected!")
        data = response.json()
        print_info(f"Error message: {data.get('detail', 'N/A')}")
    else:
        print_error("Invalid code should be rejected with 401!")
        print_error(f"Got status: {response.status_code}")
        
except Exception as e:
    print_error(f"Error: {str(e)}")

# Summary
print_header("TEST SUMMARY")

print("\n📋 What was tested:")
print("  1. Signup endpoint - Creates user with 2FA")
print("  2. QR code generation - For Google Authenticator")
print("  3. Login flow - Password verification")
print("  4. 2FA requirement - Prompts for code")
print("  5. Invalid code rejection - Security check")

print("\n📱 Next Steps for Manual Testing:")
print("  1. Go to http://localhost:3000/auth/signup")
print("  2. Create a new account")
print("  3. You should see a QR code on screen")
print("  4. Scan it with Google Authenticator app")
print("  5. Try logging in - you'll be prompted for the 6-digit code")
print("  6. Enter the code from Google Authenticator")
print("  7. You should be logged in successfully!")

print(f"\n🔐 Test Account Created:")
print(f"  Email: {test_email}")
print(f"  Password: {test_password}")
print(f"\nYou can use this account to test 2FA in the browser!")

print("\n" + "="*60)
