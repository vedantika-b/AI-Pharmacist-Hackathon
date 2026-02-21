"""
Quick Start Script for AI Pharmacist Backend
Run this to start the development server with all checks.
"""

import os
import sys
from pathlib import Path

def check_env_file():
    """Check if .env file exists."""
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ .env file not found!")
        print("   1. Copy .env.example to .env")
        print("   2. Fill in your API keys and database credentials")
        print("\n   cp .env.example .env\n")
        return False
    print("✓ .env file found")
    return True

def check_dependencies():
    """Check if required packages are installed."""
    try:
        import fastapi
        import supabase
        import groq
        import sklearn
        print("✓ Dependencies installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("  Install with: pip install -r requirements.txt\n")
        return False

def check_ml_models():
    """Check if ML models exist."""
    model_path = Path("models/ml/refill_predictor.joblib")
    if not model_path.exists():
        print("⚠️  ML model not found")
        print("   Train the model with: python train_model.py")
        print("   (Server will use fallback prediction if model missing)\n")
    else:
        print("✓ ML model found")

def main():
    """Run startup checks and start server."""
    print("=" * 60)
    print("AI Pharmacist Backend - Quick Start")
    print("=" * 60)
    print()
    
    # Run checks
    checks_passed = True
    checks_passed &= check_env_file()
    checks_passed &= check_dependencies()
    check_ml_models()
    
    print()
    
    if not checks_passed:
        print("❌ Some checks failed. Please fix the issues above.")
        sys.exit(1)
    
    print("✓ All critical checks passed!")
    print()
    print("=" * 60)
    print("Starting FastAPI server...")
    print("=" * 60)
    print()
    print("Server will be available at:")
    print("  - API: http://localhost:8000")
    print("  - Docs: http://localhost:8000/docs")
    print("  - Health: http://localhost:8000/health")
    print()
    print("Press CTRL+C to stop the server")
    print()
    
    # Start server
    os.system("uvicorn main:app --reload --port 8000")

if __name__ == "__main__":
    main()
