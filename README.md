# 🏥 AI Pharmacist

> An intelligent, production-ready agentic AI platform for autonomous digital pharmacy operations

AI Pharmacist is a comprehensive healthcare solution that combines natural language processing, machine learning, and OCR technology to enable autonomous medicine ordering, intelligent refill predictions, prescription scanning, and transparent AI decision-making.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Groq](https://img.shields.io/badge/Groq-LLM-FF6B6B)

---

## ✨ Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **💬 Natural Language Ordering** | Conversational interface for medicine ordering using Groq LLM (llama-3.1-8b-instant) |
| **📷 Prescription OCR** | Scan and extract medications from prescription images using EasyOCR |
| **🛡️ Safety Validation** | Rule-based prescription verification, refill logic, and dosage validation |
| **📊 ML Refill Prediction** | scikit-learn RandomForest model predicts optimal refill dates |
| **📦 Inventory Management** | Real-time stock tracking with low-stock alerts |
| **📝 AI Decision Logging** | Complete audit trail of all AI decisions for compliance |

### Additional Features

- **🔐 User Authentication** - Secure signup/login with Supabase Auth
- **🌍 Multi-language Support** - Internationalization with i18next
- **🎤 Voice Input/Output** - Speech recognition and text-to-speech
- **🔔 Proactive Refill Alerts** - Automatic notifications before medicines run out
- **🌓 Dark/Light Theme** - Responsive UI with theme switching
- **📤 Data Export** - Export orders and AI logs in CSV/JSON format

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │Dashboard│  │  Chat   │  │Medicines│  │  OCR    │            │
│  │ (Stats) │  │Interface│  │ Browser │  │ Scanner │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                        Routers                             │  │
│  │  orders │ chat │ predictions │ products │ prescriptions   │  │
│  │  users  │ health │ dashboard  │ export  │ ai_logs         │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       Services                             │  │
│  │  LLM Service │ ML Service │ Validation │ OCR Processor    │  │
│  │      (Groq)  │ (sklearn)  │  Service   │   (EasyOCR)      │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Repositories                           │  │
│  │  order │ product │ prescription │ inventory │ ai_log      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                         │
│   user_profiles │ medicines │ prescriptions │ orders │ ai_logs  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ai-pharmacist/
├── backend/                    # FastAPI Python Backend
│   ├── core/                   # Infrastructure (config, database, middleware)
│   ├── models/                 # Pydantic schemas & ML models
│   ├── repositories/           # Data access layer
│   ├── routers/                # API endpoints
│   ├── services/               # Business logic
│   │   ├── llm_service.py      # Groq LLM integration
│   │   ├── ml_service.py       # Refill prediction ML
│   │   ├── ocr_processor.py    # Prescription image processing
│   │   └── validation_service.py # Safety validation rules
│   ├── main.py                 # FastAPI app entry point
│   ├── requirements.txt        # Python dependencies
│   └── train_model.py          # ML model training script
│
├── frontend/                   # Next.js 14 React Frontend
│   ├── app/                    # App Router pages
│   │   ├── auth/               # Login/Signup pages
│   │   └── dashboard/          # Main application
│   │       ├── chat/           # AI chat interface
│   │       ├── medicines/      # Medicine browser
│   │       ├── ocr/            # Prescription scanner
│   │       ├── alerts/         # Refill alerts
│   │       └── settings/       # User settings
│   ├── components/             # Reusable UI components
│   ├── contexts/               # React contexts (Auth, Language)
│   └── hooks/                  # Custom React hooks
│
├── ocr/                        # OCR Module
│   ├── ocr_engine.py           # EasyOCR text extraction
│   ├── ocr_service.py          # Full OCR pipeline
│   ├── parser.py               # Medication parsing
│   └── drug_database.py        # Drug name matching
│
├── database/                   # Database Setup
│   ├── schema.sql              # Complete PostgreSQL schema
│   ├── rls_policies.sql        # Row Level Security policies
│   └── setup_database.py       # Database setup script
│
├── data/                       # Sample Data
│   ├── products-export.csv     # Medicine catalog
│   └── Consumer Order History.csv # Historical orders
│
└── docs/                       # Documentation
```

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- **Supabase** account (free tier works)
- **Groq** API key (free tier available)

### 1. Clone Repository

```bash
git clone https://github.com/vedantika-b/AI-Pharmacist-Hackathon.git
cd AI-Pharmacist-Hackathon
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.\.venv\Scripts\activate
# Activate (Linux/Mac)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create `.env` file in `/backend`:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Groq LLM
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant

# App Settings
ENVIRONMENT=development
DEBUG=true
HOST=0.0.0.0
PORT=8000
```

Start the backend:

```bash
python run.py
# Or with uvicorn directly
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key" >> .env.local

# Start development server
npm run dev
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the SQL from `database/schema.sql` in Supabase SQL Editor
3. Enable Row Level Security with `database/rls_policies.sql`

---

## 📡 API Endpoints

### Core APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/chat/message` | POST | Send message to AI pharmacist |
| `/api/v1/chat/message-with-image` | POST | Send message with prescription image |
| `/api/v1/prescriptions/upload` | POST | Upload prescription for OCR |
| `/api/v1/orders` | GET/POST | Manage orders |
| `/api/v1/products` | GET | Browse medicines |
| `/api/v1/predictions/refill` | GET | Get refill predictions |
| `/api/v1/dashboard/stats` | GET | Dashboard statistics |
| `/api/v1/ai-logs` | GET | AI decision audit logs |
| `/api/v1/export/orders` | GET | Export orders (CSV/JSON) |
| `/api/v1/health` | GET | Health check |

### Chat Intent Types

The AI understands these intent types:
- `ORDER_NEW` - New medication order
- `ORDER_REFILL` - Prescription refill
- `INFO_REQUEST` - Medication information
- `STOCK_CHECK` - Inventory queries
- `PRESCRIPTION_QUERY` - Questions about scanned prescriptions
- `GREETING` - General greetings

---

## 🔧 Configuration

### Backend Settings (`core/config.py`)

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_MODEL` | llama-3.1-8b-instant | LLM model for intent extraction |
| `GROQ_TEMPERATURE` | 0.1 | LLM temperature (lower = more deterministic) |
| `MIN_REFILL_DAYS` | 21 | Minimum days between refills |
| `MAX_DAILY_DOSAGE_MULTIPLIER` | 2.0 | Safety limit for dosage validation |
| `ML_PREDICTION_THRESHOLD` | 0.7 | ML confidence threshold |

### Safety Validation Rules

1. **Prescription Verification** - Checks prescription exists and is valid
2. **Refill Logic** - Validates refills remaining and enforces 21-day interval
3. **Dosage Validation** - Prevents dangerous dosages (2x multiplier rule)
4. **Controlled Substance Monitoring** - Special handling for scheduled medications

---

## 🤖 AI/ML Components

### 1. LLM Service (Groq)
- Uses `llama-3.1-8b-instant` model
- Extracts intent, medications, quantities from natural language
- Returns confidence scores for validation
- JSON mode for structured output

### 2. ML Refill Prediction (scikit-learn)
- RandomForest model trained on historical refill patterns
- Features: days_supply, refill_interval, historical patterns
- Outputs predicted refill date with confidence score
- Status indicators: critical (≤5 days), low (6-14 days), safe (>14 days)

### 3. OCR Pipeline (EasyOCR)
- Processes prescription images (JPG, PNG, PDF)
- Image quality assessment (blur detection)
- Drug name matching against database
- Extracts dosage, frequency, duration patterns

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=.

# Run specific test
pytest tests/test_services.py -v

# Test API endpoints
python test_api.py
```

---

## 📊 Sample Data

The project includes sample data for development:

- **products-export.csv** - 10,000+ medicines with pricing, stock, and regulatory info
- **Consumer Order History.csv** - Historical order data for ML training

---

## 🔐 Security Features

- **Supabase Auth** - JWT-based authentication
- **Row Level Security (RLS)** - Database-level access control
- **Input Validation** - Pydantic schemas for all inputs
- **CORS Configuration** - Restricted origins
- **Error Handling** - Structured error responses without sensitive data
- **Audit Logging** - Complete AI decision trail

---

## 📈 Monitoring

- **Request Logging** - Structured logs with request IDs
- **Response Time Tracking** - Performance monitoring middleware
- **Sentry Integration** - Error tracking (optional)
- **Health Endpoint** - `/api/v1/health` for uptime monitoring

---

## 🛠️ Development

### Code Quality Tools

```bash
# Format code
black .

# Lint
ruff check .

# Type checking
mypy .
```

### Train ML Model

```bash
cd backend
python train_model.py
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) - Fast LLM inference
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [EasyOCR](https://github.com/JaidedAI/EasyOCR) - OCR engine
- [Next.js](https://nextjs.org/) - React framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

<p align="center">
  Built with ❤️ for better healthcare
</p>
