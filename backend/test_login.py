"""
Test the login endpoint to verify authentication works correctly.
"""

import requests
import json

# API endpoint
BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"

# Demo credentials
DEMO_USER = {
    "email": "vedantikabhoyar135@gmail.com",
    "password": "admin123"
}


def test_login():
    """Test the login endpoint."""
    
    print("🧪 Testing Login Endpoint")
    print("=" * 60)
    print(f"Endpoint: {LOGIN_ENDPOINT}")
    print(f"Email: {DEMO_USER['email']}")
    print(f"Password: {DEMO_USER['password']}")
    print()
    
    # Prepare request
    payload = {
        "email": DEMO_USER['email'],
        "password": DEMO_USER['password']
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("📤 Sending login request...")
    
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json=payload,
            headers=headers
        )
        
        print(f"📥 Response Status: {response.status_code}")
        print()
        
        if response.status_code == 200:
            print("✅ LOGIN SUCCESSFUL!")
            print()
            
            data = response.json()
            print("Response Data:")
            print(json.dumps(data, indent=2))
            print()
            
            # Check token
            if "access_token" in data:
                token = data["access_token"]
                print(f"🔑 Access Token: {token[:50]}...")
                print(f"   Token Type: {data.get('token_type', 'N/A')}")
                print()
            
            # Check user data
            if "user" in data:
                user = data["user"]
                print("👤 User Information:")
                print(f"   ID: {user.get('id')}")
                print(f"   Email: {user.get('email')}")
                print(f"   Name: {user.get('full_name')}")
                print()
            
            print("=" * 60)
            print("✅ All authentication checks passed!")
            print("=" * 60)
            
        elif response.status_code == 401:
            print("❌ LOGIN FAILED - Invalid credentials")
            print()
            print("Response:")
            print(json.dumps(response.json(), indent=2))
            print()
            print("🔍 Troubleshooting:")
            print("1. Make sure you ran: python create_demo_user.py")
            print("2. Check your Supabase database has a 'users' table")
            print("3. Verify the password hash was created correctly")
            
        elif response.status_code == 404:
            print("❌ LOGIN ENDPOINT NOT FOUND")
            print()
            print("Response:")
            print(response.text)
            print()
            print("🔍 Troubleshooting:")
            print("1. Make sure the backend server is running")
            print("2. Check if the auth router is registered in main.py")
            print("3. Verify the endpoint URL is correct")
            
        else:
            print(f"❌ UNEXPECTED ERROR: {response.status_code}")
            print()
            print("Response:")
            try:
                print(json.dumps(response.json(), indent=2))
            except:
                print(response.text)
    
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR")
        print()
        print("Backend server is not running!")
        print()
        print("Start it with:")
        print("  cd backend")
        print("  python run.py")
    
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


def test_wrong_password():
    """Test with wrong password."""
    
    print()
    print("🧪 Testing Wrong Password")
    print("=" * 60)
    
    payload = {
        "email": DEMO_USER['email'],
        "password": "wrongpassword123"
    }
    
    try:
        response = requests.post(LOGIN_ENDPOINT, json=payload)
        
        if response.status_code == 401:
            print("✅ Correctly rejected wrong password")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            print(response.json())
    
    except Exception as e:
        print(f"❌ Error: {e}")


def test_nonexistent_user():
    """Test with nonexistent user."""
    
    print()
    print("🧪 Testing Nonexistent User")
    print("=" * 60)
    
    payload = {
        "email": "nonexistent@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(LOGIN_ENDPOINT, json=payload)
        
        if response.status_code == 401:
            print("✅ Correctly rejected nonexistent user")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            print(response.json())
    
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    # Run tests
    test_login()
    test_wrong_password()
    test_nonexistent_user()
    
    print()
    print("=" * 60)
    print("🎉 Testing complete!")
    print("=" * 60)
