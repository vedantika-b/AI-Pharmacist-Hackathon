# AI Pharmacist Backend

Production-ready FastAPI backend with multi-agent AI architecture.

## Architecture

```
backend/
├── main.py                      # FastAPI application entry point
├── core/                        # Core configuration
│   ├── config.py               # Settings management
│   └── database.py             # Supabase connection
├── routers/                     # API endpoints
│   └── orders.py               # POST /api/v1/orders
├── services/                    # Business logic layer
│   ├── llm_service.py          # Groq LLM intent extraction
│   ├── validation_service.py   # Prescription validation
│   ├── ml_service.py           # Refill prediction (sklearn)
│   └── inventory_service.py    # Inventory management
├── repositories/                # Data access layer
│   ├── order_repository.py
│   ├── prescription_repository.py
│   ├── product_repository.py
│   ├── inventory_repository.py
│   └── ai_log_repository.py
└── models/
    ├── schemas.py              # Pydantic models
    └── ml/                     # ML model files (.joblib)
```

## Features

### 1. **Multi-Agent Architecture**
- **Conversation Agent**: Groq llama-3.1-8b-instant for intent extraction
- **Safety Agent**: Rule-based prescription validation
- **Refill Prediction Agent**: scikit-learn ML model
- **Action Agent**: Database operations and inventory updates

### 2. **Order Processing Flow**
```
User Order → LLM Intent Extraction → Fetch Products/Prescriptions
    ↓
Safety Validation → Inventory Check → Refill Prediction
    ↓
Create Order → Update Inventory → Update Prescriptions → Log AI Decisions
    ↓
Return Response with AI Insights
```

### 3. **Audit Logging**
All AI decisions logged to `ai_logs` table:
- Intent detected
- LLM raw output
- Validation results
- Predictions made
- Processing time

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Service role key (backend operations)
- `DATABASE_URL`: PostgreSQL connection string
- `GROQ_API_KEY`: Groq API key for LLM

### 3. Database Setup

Required tables in Supabase:
- `products` - Medication catalog
- `prescriptions` - User prescriptions
- `orders` - Order records
- `order_items` - Order line items
- `inventory` - Stock levels
- `ai_logs` - AI decision audit trail

See main architecture doc for complete schema.

### 4. Run the Server

```bash
# Development
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### POST /api/v1/orders

Create a new order with AI processing.

**Request:**
```json
{
  "user_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 30,
      "prescription_id": "uuid"
    }
  ],
  "delivery_method": "pickup",
  "notes": "I need to refill my blood pressure medication"
}
```

**Response:**
```json
{
  "order_id": "uuid",
  "order_number": "ORD-2026-0216-001",
  "status": "pending",
  "items": [...],
  "total": 45.99,
  "intent_detected": "ORDER_REFILL",
  "llm_confidence": 0.95,
  "safety_check": {
    "approved": true,
    "warnings": []
  },
  "refill_predictions": [
    {
      "predicted_refill_date": "2026-03-18",
      "confidence_score": 0.87
    }
  ],
  "message": "Order confirmed! Ready for pickup at 2:30 PM."
}
```

### GET /api/v1/orders/{order_id}

Retrieve order details.

### GET /health

Health check endpoint.

## Services

### LLM Service (`services/llm_service.py`)
- Uses Groq llama-3.1-8b-instant
- Structured JSON output via Pydantic
- Intent extraction with confidence scores
- Few-shot examples for consistency

### Validation Service (`services/validation_service.py`)
- Prescription requirement checking
- Expiration validation
- Refill eligibility (21-day rule)
- Dosage limit enforcement
- Drug interaction warnings

### ML Service (`services/ml_service.py`)
- Load scikit-learn models from disk
- Feature engineering from prescription history
- Refill date prediction
- Fallback to rule-based if model unavailable

### Inventory Service (`services/inventory_service.py`)
- Stock availability checking
- Inventory adjustment
- Low stock alerts
- Transaction logging

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=. --cov-report=html
```

## Production Considerations

1. **Security**
   - Use service role key only on backend (never expose to frontend)
   - Implement JWT authentication
   - Enable HTTPS
   - Rate limiting

2. **Performance**
   - Connection pooling configured (5-20 connections)
   - LLM response caching for common queries
   - Async/await throughout

3. **Monitoring**
   - All requests logged with timing
   - AI decisions tracked in database
   - Health check endpoint for uptime monitoring

4. **Error Handling**
   - Comprehensive exception handling
   - User-friendly error messages
   - Detailed logs for debugging

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Service role key | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GROQ_API_KEY` | Groq LLM API key | Yes |
| `GROQ_MODEL` | Model name | No (default: llama-3.1-8b-instant) |
| `MIN_REFILL_DAYS` | Days between refills | No (default: 21) |
| `ML_MODEL_PATH` | Path to trained model | No |

## License

See LICENSE file in root directory.
