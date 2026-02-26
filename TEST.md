# AI Pharmacist - Testing Guide

**Project**: AI Pharmacist
**Date**: February 22, 2026
**Status**: Ready for Testing

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Environment Setup](#test-environment-setup)
3. [Manual Testing](#manual-testing)
4. [API Testing](#api-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Test Scenarios by Feature](#test-scenarios-by-feature)
8. [Error Handling Tests](#error-handling-tests)
9. [Performance Testing](#performance-testing)
10. [Security Testing](#security-testing)
11. [Regression Testing](#regression-testing)
12. [Test Data](#test-data)
13. [CI/CD Integration](#cicd-integration)

---

## Quick Start

### 1. Start Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python run.py
# Backend runs at http://localhost:8000
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

### 3. Access the App
- Main app: http://localhost:3000
- Swagger API docs: http://localhost:8000/docs
- ReDoc API docs: http://localhost:8000/redoc

### 4. Test Credentials
```
Email: test@example.com 
Password: TestPassword123!
```

---

## Test Environment Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn
- PostgreSQL (or Supabase account)
- Git
- Postman or Insomnia (optional, for API testing)

### Environment Configuration

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=<your-test-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-test-anon-key>
```

#### Backend (.env)
```
GROQ_API_KEY=<your-test-groq-key>
SUPABASE_URL=<your-test-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-test-service-key>
DATABASE_URL=<your-test-database-url>
LOG_LEVEL=DEBUG
```

### Database Reset
```bash
# Connect to Supabase and run:
# database/schema.sql - to reset schema
# database/setup_database.py - to initialize

python database/setup_database.py
```

---

## Manual Testing

### 1. Authentication Flow

#### Test Case 1.1: User Signup
**Steps:**
1. Navigate to http://localhost:3000
2. Click "Sign Up" button
3. Enter email: `test.signup@example.com`
4. Enter password: `SecurePass123!`
5. Confirm password: `SecurePass123!`
6. Click "Sign Up"

**Expected Results:**
- ✅ Success message displayed
- ✅ User created in Supabase
- ✅ Redirect to dashboard after 2 seconds
- ✅ User can see their profile name

**Alternate Cases:**
- Invalid email → Show error message
- Passwords don't match → Show error message
- Password < 6 chars → Show error message
- Existing email → Show error message

#### Test Case 1.2: User Login
**Steps:**
1. Navigate to http://localhost:3000/auth/login
2. Enter email: `test@example.com`
3. Enter password: `TestPassword123!`
4. Click "Login"

**Expected Results:**
- ✅ Redirect to dashboard
- ✅ User data loaded
- ✅ Can access all pages
- ✅ JWT token stored in browser

**Alternate Cases:**
- Wrong password → Show error "Invalid credentials"
- Non-existent email → Show error "Invalid credentials"
- Empty fields → Show validation error

#### Test Case 1.3: User Logout
**Steps:**
1. Login successfully
2. Click user menu in top-right
3. Click "Logout"

**Expected Results:**
- ✅ Redirect to login page
- ✅ Session cleared
- ✅ Cannot access dashboard without login

---

### 2. Dashboard Page Testing

#### Test Case 2.1: Dashboard Loads
**Steps:**
1. Login successfully
2. Navigate to dashboard home

**Expected Results:**
- ✅ Stats cards load (Orders, Patients, Stock, Revenue)
- ✅ Recent orders table displays
- ✅ AI insights section shows recommendations
- ✅ No console errors
- ✅ All data properly formatted

**Performance:**
- Page should load in < 2 seconds
- All 3 API calls should complete in < 3 seconds

#### Test Case 2.2: Dashboard Refresh
**Steps:**
1. Navigate to dashboard
2. Click browser refresh
3. Verify data reloads

**Expected Results:**
- ✅ Data refetches
- ✅ Stats update correctly
- ✅ No stale data displayed
- ✅ Loading states display properly

---

### 3. Chat Page Testing

#### Test Case 3.1: Send Message
**Steps:**
1. Navigate to Chat page
2. Type: "I need my blood pressure medication"
3. Click Send

**Expected Results:**
- ✅ Message appears in chat history
- ✅ Typing indicator shows
- ✅ LLM response received in < 3 seconds
- ✅ Response shows extracted intent, medication, quantity
- ✅ Confidence score displayed

**Expected Output Structure:**
```json
{
  "intent": "refill",
  "medication": "Blood Pressure Medication",
  "confidence": 0.95,
  "suggestion": "Order approved - Ready for pickup"
}
```

#### Test Case 3.2: Various Message Types
**Messages to Test:**
- "I need metformin" → Extract medication
- "Refill my insulin" → Extract medication type
- "I have diabetes and need my meds" → Extract condition + medication
- "What medicines do you have?" → Handle non-order request
- Empty message → Show validation error
- Very long message (1000+ chars) → Handle gracefully

#### Test Case 3.3: Chat History
**Steps:**
1. Send multiple messages
2. Refresh page
3. Verify conversation persists

**Expected Results:**
- ✅ All messages displayed
- ✅ Correct order maintained
- ✅ Timestamps shown

---

### 4. Medicines (Products) Page Testing

#### Test Case 4.1: Search Medicines
**Steps:**
1. Navigate to Medicines page
2. Type "metformin" in search box
3. Wait 500ms (debounce)

**Expected Results:**
- ✅ Only Metformin results shown
- ✅ Product cards display: name, strength, price, stock
- ✅ No more than 50 results (pagination)
- ✅ Search is case-insensitive

#### Test Case 4.2: Filter by Category
**Steps:**
1. Navigate to Medicines page
2. Select category from dropdown
3. View results

**Expected Results:**
- ✅ Only selected category items shown
- ✅ Search and filter work together
- ✅ "All" option shows everything

**Categories to Test:**
- Cardiovascular
- Diabetes
- Antibiotics
- Pain Relief
- All

#### Test Case 4.3: No Results
**Steps:**
1. Search for "xyzabc123"

**Expected Results:**
- ✅ Empty state message displayed
- ✅ Suggests searching again
- ✅ No errors

---

### 5. Alerts (Predictions) Page Testing

#### Test Case 5.1: View Refill Alerts
**Steps:**
1. Navigate to Alerts page
2. View all medications with predictions

**Expected Results:**
- ✅ List shows medicines with predictions
- ✅ Cards color-coded by status:
  - 🔴 Red: Critical (≤5 days)
  - 🟡 Yellow: Low (6-14 days)
  - 🟢 Green: Safe (>14 days)
- ✅ Days remaining calculated correctly
- ✅ Confidence scores displayed

#### Test Case 5.2: Filter by Status
**Steps:**
1. Click filter dropdown
2. Select "Critical"

**Expected Results:**
- ✅ Only medications with ≤5 days shown
- ✅ Other statuses hidden
- ✅ Count badge updates

**Filter Tests:**
- Critical (≤5 days)
- Low (6-14 days)
- Safe (>14 days)

---

### 6. Settings Page Testing

#### Test Case 6.1: Update Profile
**Steps:**
1. Navigate to Settings
2. Change Full Name to "John Smith"
3. Change Phone to "+1234567890"
4. Click "Save Changes"

**Expected Results:**
- ✅ Loading state shows
- ✅ Success message displays
- ✅ Data saved to database
- ✅ Refresh page → changes persist

#### Test Case 6.2: Update Health Profile
**Steps:**
1. Navigate to Settings
2. In "Health Profile" section:
   - Allergies: Type "Penicillin, Shellfish"
   - Chronic Conditions: Type "Diabetes, Hypertension"
3. Click "Save Health Profile"

**Expected Results:**
- ✅ Data saved
- ✅ Success message
- ✅ Data persists on refresh
- ✅ Used in validation checks

#### Test Case 6.3: Notification Preferences
**Steps:**
1. Navigate to Settings
2. Toggle each notification type:
   - Refill Alerts
   - Low Stock Alerts
   - Email Notifications
   - Controlled Substance Warnings

**Expected Results:**
- ✅ Each toggle saves immediately
- ✅ Success message displays
- ✅ Preferences persist on refresh
- ✅ UI reflects current state

#### Test Case 6.4: Error Handling
**Steps:**
1. Disconnect network
2. Try to save changes
3. Wait for error message

**Expected Results:**
- ✅ Error message displayed
- ✅ Changes not lost
- ✅ Can retry when network restored

---

## API Testing

### 1. Using Swagger UI

**Steps:**
1. Run backend: `python run.py`
2. Open http://localhost:8000/docs
3. Click on any endpoint to expand
4. Enter required parameters
5. Click "Try it out"

### 2. Using Postman/Insomnia

#### Test Case API 1: Create Order
**Endpoint:** `POST /api/v1/orders`

**Request Body:**
```json
{
  "message": "I need my metformin refilled",
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Expected Response (200):**
```json
{
  "order_id": "ORD-123456",
  "status": "approved",
  "items": [
    {
      "medicine": "Metformin 500mg",
      "quantity": 90,
      "price": 25.00
    }
  ],
  "total": 25.00,
  "estimated_ready": "2024-02-24"
}
```

#### Test Case API 2: Get Products
**Endpoint:** `GET /api/v1/products?search=metformin&category=Diabetes`

**Expected Response (200):**
```json
[
  {
    "id": "prod-123",
    "name": "Metformin",
    "generic_name": "Metformin Hydrochloride",
    "strength": "500mg",
    "category": "Diabetes",
    "price": 15.00,
    "stock_quantity": 150
  }
]
```

#### Test Case API 3: Get Refill Predictions
**Endpoint:** `GET /api/v1/predictions/refills?status=critical&user_id=user-123`

**Expected Response (200):**
```json
[
  {
    "id": "pred-456",
    "medicine_name": "Insulin",
    "days_remaining": 3,
    "status": "critical",
    "predicted_refill_date": "2024-02-23",
    "confidence_score": 0.92
  }
]
```

#### Test Case API 4: Send Chat Message
**Endpoint:** `POST /api/v1/chat`

**Request:**
```json
{
  "message": "I need refill please",
  "user_id": "user-123"
}
```

**Expected Response (200):**
```json
{
  "intent": "refill",
  "confidence": 0.88,
  "extracted_medications": ["Generic Medication"],
  "suggestions": ["Order approved"]
}
```

#### Test Case API 5: Get AI Logs
**Endpoint:** `GET /api/v1/ai-logs?user_id=user-123&limit=10`

**Expected Response (200):**
```json
[
  {
    "id": "log-123",
    "user_id": "user-123",
    "decision_type": "chat",
    "input_data": { "message": "..." },
    "output_data": { "intent": "..." },
    "model_version": "groq-llama3.1",
    "confidence_score": 0.92,
    "execution_time_ms": 1250,
    "tokens_used": 150,
    "cost_estimate": 0.00015,
    "created_at": "2024-02-22T10:30:00Z"
  }
]
```

#### Test Case API 6: Update User Profile
**Endpoint:** `PUT /api/v1/users/{userId}/profile`

**Request:**
```json
{
  "profile": {
    "full_name": "John Doe",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-01"
  }
}
```

**Expected Response (200):**
```json
{
  "user_id": "user-123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "updated_at": "2024-02-22T10:35:00Z"
}
```

#### Test Case API 7: Get Dashboard Stats
**Endpoint:** `GET /api/v1/dashboard/stats`

**Expected Response (200):**
```json
{
  "active_orders": 45,
  "total_customers": 230,
  "medicines_stock": 1850,
  "revenue_today": 2150.00,
  "critical_alerts": 3,
  "last_updated": "2024-02-22T10:40:00Z"
}
```

#### Test Case API 8: Check Health
**Endpoint:** `GET /health`

**Expected Response (200):**
```json
{
  "status": "healthy",
  "service": "AI Pharmacist",
  "version": "1.0.0",
  "timestamp": "2024-02-22T10:45:00Z"
}
```

---

## Integration Testing

### 1. Authentication → Dashboard Flow
**Scenario:** User logs in and sees personalized data

**Steps:**
1. Signup with new email
2. Login with credentials
3. Dashboard loads with user-specific data
4. Settings page shows user's profile

**Test Points:**
- ✅ Supabase auth working
- ✅ User data fetched correctly
- ✅ Token managed properly
- ✅ No cross-user data leakage

### 2. Chat → Order Processing Flow
**Scenario:** User sends message → AI extracts info → Order created

**Steps:**
1. Login
2. Go to Chat
3. Send: "I need my diabetes medicine, 90 pills"
4. Verify response shows correct extraction
5. Check that order would be created if submitted

**Test Points:**
- ✅ LLM intent extraction works
- ✅ Validation rules applied
- ✅ Inventory checked
- ✅ Health profile considered

### 3. Search → Order Creation Flow
**Scenario:** User searches medicine → Orders it → Confirmation

**Steps:**
1. Navigate to Medicines
2. Search "Metformin"
3. Click a medicine
4. (Feature: Order button)

**Test Points:**
- ✅ Products API returns correct data
- ✅ Medicine details accurate
- ✅ Stock levels updated

### 4. Predictions → Alerts Flow
**Scenario:** ML predictions calculated → Alerts displayed

**Steps:**
1. Go to Alerts page
2. Verify predictions show correct status
3. Filter by critical

**Test Points:**
- ✅ ML model predictions accurate
- ✅ Days remaining calculated right
- ✅ Status categorization correct

### 5. Settings → User Data Flow
**Scenario:** Update profile → Data persists → Used in other pages

**Steps:**
1. Go to Settings
2. Update profile
3. Change health profile (add allergies)
4. Go to Chat
5. Send message about medication user is allergic to

**Test Points:**
- ✅ Data saved correctly
- ✅ Data retrieved in other flows
- ✅ Validation uses health data

---

## End-to-End Testing

### E2E Test 1: Complete Order Flow
**Scenario:** New user signs up and places their first order

**Steps:**
1. Signup: `newe2e@test.com` / `TestPass123!`
2. Fill profile: Name = "Test User", Phone = "+1234567890"
3. Add health info: Allergy = "Penicillin"
4. Go to Chat
5. Send: "I need my blood pressure meds"
6. Verify order extracted correctly
7. Go to Dashboard
8. Verify new order shows in recent orders
9. Go to AI Logs
10. Verify decision logged

**Expected Journey:**
- ✅ Signup successful
- ✅ Profile created
- ✅ Chat processes request
- ✅ Order created (if implemented)
- ✅ Appears in dashboard
- ✅ Logged in AI logs

### E2E Test 2: User with Existing Data
**Scenario:** Existing user with history uses system

**Steps:**
1. Login as existing user
2. Dashboard shows personalized stats
3. Check Alerts → Should show their medications
4. Go to Chat → Ask for refill
5. Check Settings → Shows their health profile
6. Change notification preferences
7. Export orders as CSV

**Expected Journey:**
- ✅ All user data loads
- ✅ Personalized experience
- ✅ Settings changes persist
- ✅ Export works

### E2E Test 3: Multi-Step Interaction
**Scenario:** User interacts with multiple parts of system

**Steps:**
1. Login
2. Search for medicine in Medicines page
3. Get alert about low stock
4. Send chat message about needing it
5. Check AI logs to see decision
6. Export logs as JSON

**Expected Journey:**
- ✅ Data from all modules integrated
- ✅ Consistent experience
- ✅ Data flow works

---

## Test Scenarios by Feature

### Feature: Natural Language Processing

#### Test 1: NLP Intent Extraction
**Input:** "I need my diabetes medicine, 90 pills, my name is john"
**Expected:**
- ✅ Intent: "refill"
- ✅ Medication: "diabetes medicine"
- ✅ Quantity: 90
- ✅ Confidence: > 0.8

#### Test 2: NLP Ambiguity
**Input:** "I need something"
**Expected:**
- ✅ Intent unclear
- ✅ Ask for clarification
- ✅ Confidence < 0.7

#### Test 3: NLP Multiple Medications
**Input:** "I need refills for my insulin, metformin, and blood pressure pills"
**Expected:**
- ✅ Extract all 3 medications
- ✅ Intent: "refill"
- ✅ Handle list parsing

### Feature: Prescription Validation

#### Test 1: Valid Prescription
**Scenario:**
- Prescription exists
- Not expired
- Refills remaining
- Dosage within limits

**Expected:**
- ✅ Validation passes
- ✅ Order approved

#### Test 2: Expired Prescription
**Scenario:**
- Prescription older than 1 year

**Expected:**
- ✅ Validation fails
- ✅ Message: "Prescription expired"
- ✅ Suggest contacting doctor

#### Test 3: No Refills Remaining
**Scenario:**
- Prescription exists
- But refills = 0

**Expected:**
- ✅ Validation fails
- ✅ Message: "No refills remaining"
- ✅ Suggest contacting doctor

#### Test 4: Too Soon to Refill
**Scenario:**
- Last filled 5 days ago
- Minimum interval is 21 days

**Expected:**
- ✅ Validation fails
- ✅ Message: "Too soon to refill, can refill in 16 days"

#### Test 5: Dosage Exceeds Safe Limit
**Scenario:**
- Prescription: 500mg daily
- Request: 2000mg (4x normal)

**Expected:**
- ✅ Validation fails
- ✅ Message: "Dosage exceeds safe limits"

### Feature: ML Refill Prediction

#### Test 1: Accurate Prediction
**Scenario:**
- Medicine with clear usage pattern
- 6 months history available

**Expected:**
- ✅ Prediction within ±3 days of actual refill
- ✅ Confidence > 0.85

#### Test 2: New User (No History)
**Scenario:**
- User just started medication
- No refill history

**Expected:**
- ✅ Returns default prediction (based on days_supply)
- ✅ Lower confidence (0.6-0.7)

#### Test 3: Irregular Pattern
**Scenario:**
- Medicine refilled on inconsistent schedule

**Expected:**
- ✅ Returns prediction with ranges
- ✅ Lower confidence (0.5-0.7)

### Feature: Inventory Management

#### Test 1: Stock Check Passes
**Scenario:**
- Medicine stock > requested quantity

**Expected:**
- ✅ Order approved
- ✅ Stock updated

#### Test 2: Stock Check Fails
**Scenario:**
- Medicine stock < requested quantity

**Expected:**
- ✅ Order rejected
- ✅ Message: "Only X units in stock"
- ✅ Suggest reduced quantity

#### Test 3: Stock Update on Order
**Scenario:**
- Initial stock: 100
- Order: 30
- After order should be 70

**Expected:**
- ✅ Stock decrements correctly
- ✅ Audit trail recorded

### Feature: AI Decision Logging

#### Test 1: Log Created
**Scenario:**
- Send chat message
- Order processed

**Expected:**
- ✅ Log entry created in ai_logs table
- ✅ Contains: input, output, model, confidence, time, cost

#### Test 2: Log Retrieval
**Scenario:**
- Query /api/v1/ai-logs

**Expected:**
- ✅ All logs returned
- ✅ Pagination works
- ✅ User filtering works

#### Test 3: Log Detail
**Scenario:**
- Get specific log by ID

**Expected:**
- ✅ Full log details returned
- ✅ All metadata present

#### Test 4: Log Statistics
**Scenario:**
- Query /api/v1/ai-logs/stats/summary

**Expected:**
- ✅ Statistics calculated
- ✅ Confidence ranges shown
- ✅ Cost breakdown provided

---

## Error Handling Tests

### Test 1: Network Errors
**Scenario:** Backend is down

**Expected Results:**
- ✅ Frontend shows error message: "Unable to connect to server"
- ✅ User can see last cached data (if available)
- ✅ Retry button available
- ✅ No infinite loading

### Test 2: Invalid Input
**Scenario:** Send invalid data to API

**Examples:**
- Email without @ symbol
- Password < 6 characters
- Negative quantity
- Empty required field

**Expected Results:**
- ✅ Validation error message
- ✅ Clear instruction on what's wrong
- ✅ Field highlighted
- ✅ Not submitted to backend

### Test 3: Unauthorized Access
**Scenario:** Try to access other user's data

**Steps:**
1. Login as user A
2. Try to access user B's orders (if implemented)

**Expected Results:**
- ✅ 403 Forbidden error
- ✅ Error message displayed
- ✅ Redirected to safe page

### Test 4: Database Error
**Scenario:** Query database fails

**Expected Results:**
- ✅ Generic error message (not DB-specific)
- ✅ Logging includes error details
- ✅ User can retry
- ✅ Graceful degradation

### Test 5: Timeout
**Scenario:** API takes > 30 seconds to respond

**Expected Results:**
- ✅ Request times out
- ✅ Error message shown
- ✅ User can retry
- ✅ No frozen UI

### Test 6: Rate Limiting
**Scenario:** Send 100 requests in 10 seconds

**Expected Results:**
- ✅ After limit: 429 Too Many Requests
- ✅ Error message with retry-after
- ✅ Clear explanation
- ✅ Graceful degradation

---

## Performance Testing

### Test 1: Page Load Time
**Metrics to Measure:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

**Targets:**
- FCP: < 1.5s
- LCP: < 2.5s
- CLS: < 0.1
- TTI: < 3.5s

**How to Test:**
```bash
# Using Chrome DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Click "Analyze page load"
4. Check results
```

### Test 2: API Response Time
**Endpoints to Test:**
- GET /health → < 100ms
- GET /api/v1/products → < 500ms
- POST /api/v1/chat → < 3000ms (includes LLM)
- GET /api/v1/dashboard/stats → < 1000ms
- GET /api/v1/predictions/refills → < 1000ms

**How to Test:**
```bash
# Using curl
curl -w "Time: %{time_total}s\n" http://localhost:8000/health

# Using Apache Bench
ab -n 100 -c 10 http://localhost:8000/health
```

### Test 3: Database Query Performance
**Queries to Test:**
- Get user profile → < 50ms
- Search products → < 200ms
- Get refill predictions → < 500ms
- Get AI logs → < 300ms

**How to Test:**
```python
# In backend, add timing
import time
start = time.time()
result = supabase.table("products").select("*").execute()
duration = time.time() - start
print(f"Query took {duration*1000}ms")
```

### Test 4: Load Testing
**Tool:** Apache Bench or Locust

**Scenario:** 100 concurrent users

```bash
# Using Apache Bench
ab -n 1000 -c 100 http://localhost:8000/health

# Expect:
# - Request rate > 100 req/sec
# - Error rate < 1%
# - Avg response < 500ms
```

### Test 5: Memory Usage
**How to Monitor:**
```bash
# Backend
ps aux | grep python  # Check VSZ and RSS columns

# Frontend (DevTools)
1. Open DevTools
2. Performance tab
3. Take heap snapshot
4. Check for leaks
```

### Test 6: Bundle Size
**How to Check:**
```bash
# Frontend
npm run build
du -sh .next/

# Target: < 500KB
```

---

## Security Testing

### Test 1: SQL Injection
**Attempt:**
- Search: `'; DROP TABLE users; --`

**Expected:**
- ✅ No error
- ✅ Treated as literal string
- ✅ No data loss

### Test 2: XSS (Cross-Site Scripting)
**Attempt:**
- Chat message: `<script>alert('xss')</script>`

**Expected:**
- ✅ Rendered as text (escaped)
- ✅ No script execution
- ✅ Safe display

### Test 3: CSRF (Cross-Site Request Forgery)
**How Supabase handles:**
- ✅ Token-based authentication
- ✅ SameSite cookies
- ✅ Origin validation

**Test:**
- Create request from different origin
- Should be rejected

### Test 4: Unauthorized Access
**Attempt:**
- Login as user A
- Manually change URL to user B's data

**Expected:**
- ✅ 403 Forbidden
- ✅ Cannot access
- ✅ Logged for security

### Test 5: Password Security
**Test Cases:**
- Password hashing: ✅ Handled by Supabase
- No password in logs: ✅ Verify logs
- SSL/TLS: ✅ Should be enabled in production
- Password requirements: ✅ Min 6 chars

**How to Test:**
```bash
# Check logs don't contain passwords
grep -i "password" backend.log
# Should not show actual passwords
```

### Test 6: Token Expiration
**Scenario:**
1. Login
2. Wait for token to expire (or manually expire)
3. Try to make authenticated request

**Expected:**
- ✅ 401 Unauthorized
- ✅ Redirected to login
- ✅ New login required

### Test 7: API Key Security
**Checks:**
- ✅ API keys not in code
- ✅ API keys in .env file
- ✅ .env in .gitignore
- ✅ Different keys for dev/prod
- ✅ Groq key won't work with invalid requests

**How to Test:**
```bash
# Check git history
git log -S "GROQ_API_KEY"
# Should not find commits with hardcoded key
```

---

## Regression Testing

### Purpose
Ensure new changes don't break existing functionality.

### When to Run
- After every code merge
- Before production deployment
- After bug fixes
- When updating dependencies

### Regression Test Suite

#### Core Features Regression
```
1. Authentication
   - Signup ✅
   - Login ✅
   - Logout ✅
   - Session persistence ✅

2. Dashboard
   - Stats load ✅
   - Recent orders display ✅
   - Insights render ✅

3. Chat
   - Send message ✅
   - LLM response ✅
   - Message history ✅

4. Products
   - Search works ✅
   - Filter works ✅
   - Detail view ✅

5. Alerts
   - Predictions display ✅
   - Status colors correct ✅
   - Filter works ✅

6. Settings
   - Profile updates ✅
   - Notifications toggle ✅
   - Health profile saves ✅
```

#### API Regression
```
GET /health
GET /api/v1/products
POST /api/v1/chat
GET /api/v1/predictions/refills
GET /api/v1/dashboard/stats
GET /api/v1/users/{id}/profile
PUT /api/v1/users/{id}/profile
GET /api/v1/ai-logs
```

#### Database Regression
```
- User accounts still accessible ✅
- Data consistency maintained ✅
- No data loss ✅
- Indexes working ✅
- Triggers firing ✅
```

---

## Test Data

### Sample Users
```
User 1 (Demo User):
  Email: demo@example.com
  Password: DemoPass123!
  Full Name: Demo User
  Allergies: None
  Conditions: None

User 2 (Test User):
  Email: test@example.com
  Password: TestPassword123!
  Full Name: Test User
  Allergies: Penicillin
  Conditions: Diabetes

User 3 (Health User):
  Email: patient@example.com
  Password: PatientPass123!
  Full Name: Patient
  Allergies: Shellfish, Latex
  Conditions: Hypertension, Diabetes
```

### Sample Medications
```
1. Metformin
   Strength: 500mg
   Category: Diabetes
   Stock: 150
  Price: ₹15.00

2. Lisinopril
   Strength: 10mg
   Category: Cardiovascular
   Stock: 200
  Price: ₹12.00

3. Insulin
   Strength: 100 units/mL
   Category: Diabetes
   Stock: 50
  Price: ₹45.00

4. Amoxicillin
   Strength: 500mg
   Category: Antibiotics
   Stock: 100
  Price: ₹8.00

5. Ibuprofen
   Strength: 200mg
   Category: Pain Relief
   Stock: 500
  Price: ₹5.00
```

### Sample Messages for Chat Testing
```
1. "I need my metformin refilled"
   Expected: Intent=refill, Medication=Metformin

2. "Can I get 90 pills of my diabetes medicine?"
   Expected: Intent=refill, Quantity=90, Medication=diabetes medicine

3. "I have a headache"
   Expected: Intent=other, Medication=None

4. "What medicines do you have?"
   Expected: Intent=query, Medication=None

5. "Refill insulin ASAP, 3 vials"
   Expected: Intent=refill, Medication=Insulin, Quantity=3
```

---

## CI/CD Integration

### GitHub Actions Setup

#### Test on Commit
Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          python -m pytest tests/
      - name: Check linting
        run: |
          cd backend
          pip install flake8
          flake8 . --count --select=E9,F63,F7,F82 --show-source

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Build frontend
        run: |
          cd frontend
          npm run build
      - name: Run ESLint
        run: |
          cd frontend
          npm run lint
```

### Manual Testing Checklist Before Deployment

```
BACKEND:
- [ ] python run.py starts without errors
- [ ] http://localhost:8000/health returns 200
- [ ] http://localhost:8000/docs loads
- [ ] All endpoints in /docs are documented
- [ ] No console errors in backend
- [ ] Database connection works
- [ ] Environment variables set correctly

FRONTEND:
- [ ] npm run dev starts without errors
- [ ] http://localhost:3000 loads
- [ ] No console errors in browser
- [ ] Signup works
- [ ] Login works
- [ ] All 7 pages load
- [ ] All forms submit
- [ ] No TypeScript errors
- [ ] Responsive on mobile

INTEGRATION:
- [ ] Frontend can connect to backend
- [ ] All API calls return data
- [ ] data persists on database
- [ ] No CORS errors
- [ ] No auth errors

PERFORMANCE:
- [ ] Dashboard loads in < 2s
- [ ] Chat responds in < 3s
- [ ] Search responds in < 1s
- [ ] No memory leaks
- [ ] No performance warnings

SECURITY:
- [ ] No hardcoded credentials
- [ ] .env not in git
- [ ] HTTPS enabled (production)
- [ ] CORS properly configured
- [ ] Input validation working
```

---

## Quick Test Commands

### Backend
```bash
# Run backend
cd backend && python run.py

# Run tests
cd backend && python -m pytest tests/

# Check health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

### Frontend
```bash
# Run frontend
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Lint code
cd frontend && npm run lint

# Check TypeScript
cd frontend && npm run type-check
```

### Full Stack Test
```bash
# Terminal 1: Start backend
cd backend && python run.py

# Terminal 2: Start frontend
cd frontend && npm run dev

# Terminal 3: Run tests
npm run test

# Open http://localhost:3000
```

---

## Testing Schedule

### Daily
- Manual smoke testing (5 min)
- Health checks pass

### Per Sprint
- Full regression test suite
- Performance benchmarks
- Security scan

### Pre-Release
- Full E2E test suite
- Load testing
- Security audit
- Accessibility check

### Production
- Post-deployment verification
- Monitor error logs
- Track performance metrics

---

## Conclusion

This comprehensive testing guide covers all aspects of testing the AI Pharmacist system from unit tests to end-to-end flows. Follow these guidelines to ensure reliability, performance, and security.

**Next Steps:**
1. Set up test environment using [Test Environment Setup](#test-environment-setup)
2. Start with manual testing following [Manual Testing](#manual-testing)
3. Run API tests using [API Testing](#api-testing)
4. Create regression test suite
5. Integrate tests into CI/CD

Happy testing! 🧪
