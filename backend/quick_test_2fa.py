"""Quick test for 2FA signup endpoint"""
import requests
import json

# Test signup with 2FA
print("Testing 2FA Signup Endpoint...")
print("-" * 50)

response = requests.post(
    'http://localhost:8000/api/v1/auth/signup',
    json={
        'email': 'quicktest2fa@example.com',
        'password': 'test123456',
        'full_name': 'Quick Test User'
    }
)

print(f"Status Code: {response.status_code}")
print("\nResponse:")
print(json.dumps(response.json(), indent=2))

if response.status_code == 200:
    data = response.json()
    if 'qr_code' in data:
        print("\n✓ QR Code received! Length:", len(data['qr_code']))
        print("✓ 2FA is working!")
    else:
        print("\n✗ No QR code in response")
        print("✗ 2FA may not be configured properly")
else:
    print("\n✗ Signup failed!")
