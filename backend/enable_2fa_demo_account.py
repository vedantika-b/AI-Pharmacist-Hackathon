"""
Enable 2FA for Demo Account
This script enables two-factor authentication for the demo user account.
"""

import pyotp
import qrcode
import io
import base64
from supabase import create_client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Demo user credentials
DEMO_EMAIL = "vedantikabhoyar135@gmail.com"

def generate_totp_secret() -> str:
    """Generate a new TOTP secret."""
    return pyotp.random_base32()

def generate_qr_code(email: str, secret: str, issuer: str = "AI Pharmacist") -> str:
    """Generate QR code URL for Google Authenticator."""
    # Create TOTP URI
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=issuer
    )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

def main():
    """Enable 2FA for demo account."""
    print("\n" + "="*60)
    print("2FA SETUP FOR DEMO ACCOUNT")
    print("="*60 + "\n")
    
    # Initialize Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Check if demo user exists
    result = supabase.table("users").select("*").eq("email", DEMO_EMAIL).execute()
    
    if not result.data:
        print(f"❌ Demo user not found: {DEMO_EMAIL}")
        print("\nPlease create the demo account first by signing up at:")
        print("http://localhost:3000/auth/signup")
        return
    
    user = result.data[0]
    user_id = user.get("id")
    existing_secret = user.get("totp_secret")
    
    if existing_secret:
        print(f"ℹ️  Demo user already has 2FA enabled")
        print(f"   Email: {DEMO_EMAIL}")
        print(f"   Existing TOTP Secret: {existing_secret}")
        
        # Show current QR code
        qr_code = generate_qr_code(DEMO_EMAIL, existing_secret)
        
        print("\n📱 Scan this QR code with Google Authenticator:")
        print("   (QR code will open in browser)")
        
        # Save QR code to HTML file for viewing
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Demo Account 2FA QR Code</title>
            <style>
                body {{
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }}
                .container {{
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    color: #333;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }}
                h1 {{
                    color: #667eea;
                }}
                img {{
                    margin: 20px 0;
                    border: 5px solid #667eea;
                    border-radius: 10px;
                }}
                .secret {{
                    background: #f7f7f7;
                    padding: 10px;
                    border-radius: 5px;
                    font-family: monospace;
                    font-size: 14px;
                    margin: 10px 0;
                }}
                .instructions {{
                    text-align: left;
                    margin: 20px 0;
                    line-height: 1.8;
                }}
                .instructions li {{
                    margin: 10px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔐 AI Pharmacist - Demo Account 2FA</h1>
                <p><strong>Email:</strong> {DEMO_EMAIL}</p>
                <p><strong>Password:</strong> admin123</p>
                
                <img src="{qr_code}" alt="QR Code" />
                
                <p><strong>TOTP Secret (Manual Entry):</strong></p>
                <div class="secret">{existing_secret}</div>
                
                <div class="instructions">
                    <h3>Setup Instructions:</h3>
                    <ol>
                        <li>Download <strong>Google Authenticator</strong> on your phone</li>
                        <li>Open the app and tap the <strong>+</strong> button</li>
                        <li>Choose <strong>Scan QR Code</strong></li>
                        <li>Scan the QR code above</li>
                        <li>Your 6-digit code will appear in the app</li>
                        <li>Use this code when logging in to AI Pharmacist</li>
                    </ol>
                </div>
                
                <p style="color: #e74c3c; font-weight: bold; margin-top: 20px;">
                    ⚠️ Keep your authenticator app safe!<br>
                    You'll need it every time you login.
                </p>
            </div>
        </body>
        </html>
        """
        
        with open("demo_account_2fa_qr.html", "w") as f:
            f.write(html_content)
        
        print("\n✅ QR code saved to: demo_account_2fa_qr.html")
        print("   Opening in browser...")
        
        import webbrowser
        webbrowser.open("demo_account_2fa_qr.html")
        
    else:
        print(f"⚠️  Demo user does NOT have 2FA enabled yet")
        print(f"   Email: {DEMO_EMAIL}")
        print("\n🔧 Enabling 2FA now...")
        
        # Generate new TOTP secret
        totp_secret = generate_totp_secret()
        
        # Update user with TOTP secret
        update_result = supabase.table("users").update({
            "totp_secret": totp_secret
        }).eq("id", user_id).execute()
        
        if update_result.data:
            print(f"✅ 2FA enabled successfully!")
            print(f"   TOTP Secret: {totp_secret}")
            
            # Generate and show QR code
            qr_code = generate_qr_code(DEMO_EMAIL, totp_secret)
            
            # Save QR code to HTML file
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Demo Account 2FA QR Code - NEW</title>
                <style>
                    body {{
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        font-family: Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }}
                    .container {{
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        text-align: center;
                        color: #333;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }}
                    h1 {{
                        color: #667eea;
                    }}
                    img {{
                        margin: 20px 0;
                        border: 5px solid #667eea;
                        border-radius: 10px;
                    }}
                    .secret {{
                        background: #f7f7f7;
                        padding: 10px;
                        border-radius: 5px;
                        font-family: monospace;
                        font-size: 14px;
                        margin: 10px 0;
                    }}
                    .instructions {{
                        text-align: left;
                        margin: 20px 0;
                        line-height: 1.8;
                    }}
                    .instructions li {{
                        margin: 10px 0;
                    }}
                    .new-badge {{
                        background: #2ecc71;
                        color: white;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: bold;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <span class="new-badge">🆕 NEWLY GENERATED</span>
                    <h1>🔐 AI Pharmacist - Demo Account 2FA</h1>
                    <p><strong>Email:</strong> {DEMO_EMAIL}</p>
                    <p><strong>Password:</strong> admin123</p>
                    
                    <img src="{qr_code}" alt="QR Code" />
                    
                    <p><strong>TOTP Secret (Manual Entry):</strong></p>
                    <div class="secret">{totp_secret}</div>
                    
                    <div class="instructions">
                        <h3>Setup Instructions:</h3>
                        <ol>
                            <li>Download <strong>Google Authenticator</strong> on your phone</li>
                            <li>Open the app and tap the <strong>+</strong> button</li>
                            <li>Choose <strong>Scan QR Code</strong></li>
                            <li>Scan the QR code above</li>
                            <li>Your 6-digit code will appear in the app</li>
                            <li>Use this code when logging in to AI Pharmacist</li>
                        </ol>
                    </div>
                    
                    <p style="color: #e74c3c; font-weight: bold; margin-top: 20px;">
                        ⚠️ Keep your authenticator app safe!<br>
                        You'll need it every time you login.
                    </p>
                </div>
            </body>
            </html>
            """
            
            with open("demo_account_2fa_qr.html", "w") as f:
                f.write(html_content)
            
            print("\n✅ QR code saved to: demo_account_2fa_qr.html")
            print("   Opening in browser...")
            
            import webbrowser
            webbrowser.open("demo_account_2fa_qr.html")
        else:
            print("❌ Failed to enable 2FA")
    
    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("="*60)
    print("1. Scan the QR code with Google Authenticator app")
    print("2. Login at http://localhost:3000/auth/login")
    print(f"3. Email: {DEMO_EMAIL}")
    print("4. Password: admin123")
    print("5. Enter the 6-digit code from Google Authenticator when prompted")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
