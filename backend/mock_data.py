"""
Mock data for development when Supabase is not available.
"""

from datetime import datetime, timedelta
from typing import List, Dict

# Mock medicines/products
MOCK_MEDICINES: List[Dict] = [
    {
        "id": "1",
        "name": "Aspirin",
        "generic_name": "Acetylsalicylic acid",
        "brand_name": "Aspirin",
        "dosage_form": "Tablet",
        "strength": "500mg",
        "category": "Pain Relief",
        "stock_quantity": 150,
        "price": 2.50,
        "prescription_required": False,
        "is_active": True,
    },
    {
        "id": "2",
        "name": "Ibuprofen",
        "generic_name": "Ibuprofen",
        "brand_name": "Advil",
        "dosage_form": "Tablet",
        "strength": "200mg",
        "category": "Pain Relief",
        "stock_quantity": 200,
        "price": 3.75,
        "prescription_required": False,
        "is_active": True,
    },
    {
        "id": "3",
        "name": "Amoxicillin",
        "generic_name": "Amoxicillin",
        "brand_name": "Amoxicillin",
        "dosage_form": "Capsule",
        "strength": "500mg",
        "category": "Antibiotics",
        "stock_quantity": 75,
        "price": 5.50,
        "prescription_required": True,
        "is_active": True,
    },
    {
        "id": "4",
        "name": "Metformin",
        "generic_name": "Metformin",
        "brand_name": "Glucophage",
        "dosage_form": "Tablet",
        "strength": "500mg",
        "category": "Diabetes",
        "stock_quantity": 300,
        "price": 4.25,
        "prescription_required": True,
        "is_active": True,
    },
    {
        "id": "5",
        "name": "Lisinopril",
        "generic_name": "Lisinopril",
        "brand_name": "Prinivil",
        "dosage_form": "Tablet",
        "strength": "10mg",
        "category": "Hypertension",
        "stock_quantity": 120,
        "price": 6.00,
        "prescription_required": True,
        "is_active": True,
    },
]

# Mock refill predictions
MOCK_REFILL_PREDICTIONS: List[Dict] = [
    {
        "id": "pred-1",
        "customer_id": "user-1",
        "medicine_id": "1",
        "medicine_name": "Aspirin",
        "current_stock": 5,
        "daily_consumption": 1,
        "predicted_refill_date": (datetime.now() + timedelta(days=3)).date().isoformat(),
        "days_remaining": 3,
        "status": "critical",
        "is_active": True,
    },
    {
        "id": "pred-2",
        "customer_id": "user-1",
        "medicine_id": "2",
        "medicine_name": "Ibuprofen",
        "current_stock": 10,
        "daily_consumption": 0.5,
        "predicted_refill_date": (datetime.now() + timedelta(days=14)).date().isoformat(),
        "days_remaining": 14,
        "status": "low",
        "is_active": True,
    },
    {
        "id": "pred-3",
        "customer_id": "user-1",
        "medicine_id": "4",
        "medicine_name": "Metformin",
        "current_stock": 50,
        "daily_consumption": 2,
        "predicted_refill_date": (datetime.now() + timedelta(days=20)).date().isoformat(),
        "days_remaining": 20,
        "status": "safe",
        "is_active": True,
    },
]

# Mock orders
MOCK_ORDERS: List[Dict] = [
    {
        "id": "order-1",
        "customer_id": "user-1",
        "order_date": (datetime.now() - timedelta(days=5)).isoformat(),
        "total_amount": 45.75,
        "status": "delivered",
        "items": [
            {"medicine_name": "Aspirin", "quantity": 2, "price": 2.50},
            {"medicine_name": "Ibuprofen", "quantity": 1, "price": 3.75},
        ]
    },
    {
        "id": "order-2",
        "customer_id": "user-1",
        "order_date": (datetime.now() - timedelta(days=2)).isoformat(),
        "total_amount": 28.50,
        "status": "processing",
        "items": [
            {"medicine_name": "Metformin", "quantity": 1, "price": 4.25},
        ]
    },
    {
        "id": "order-3",
        "customer_id": "user-1",
        "order_date": datetime.now().isoformat(),
        "total_amount": 12.00,
        "status": "pending",
        "items": [
            {"medicine_name": "Lisinopril", "quantity": 2, "price": 6.00},
        ]
    },
]

# Mock chat context
MOCK_CHAT_CONTEXT = {
    "user_id": "user-1",
    "recent_orders": 3,
    "active_medications": ["Aspirin", "Ibuprofen", "Metformin"],
    "refill_alerts": 2,
    "messages": []
}
