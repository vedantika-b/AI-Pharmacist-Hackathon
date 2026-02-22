#!/usr/bin/env python
"""
Test script to debug API endpoint errors
"""
import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("Testing /api/v1/products endpoint...")
response = client.get("/api/v1/products")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
