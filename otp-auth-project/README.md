# 🔐 OTP Authentication Project

A complete OTP-based login/signup system built with **Node.js, Express, MongoDB, Twilio, and React**.

![OTP Login Flow](https://via.placeholder.com/800x400?text=OTP+Login+System)

## 📋 Features

- ✅ Phone number based OTP authentication
- ✅ 6-digit OTP with auto-expiry (5 minutes)
- ✅ Twilio SMS integration (with demo mode)
- ✅ JWT token-based session management
- ✅ User profile management
- ✅ Protected routes
- ✅ Beautiful responsive UI
- ✅ Auto-focus OTP inputs
- ✅ Rate limiting on OTP attempts

---

## 🏗️ Project Structure

```
otp-auth-project/
├── backend/                    # Node.js Backend
│   ├── server.js              # Express server entry point
│   ├── package.json           # Backend dependencies
│   ├── .env.example           # Environment variables template
│   ├── models/
│   │   ├── User.js            # User MongoDB schema
│   │   └── OTP.js             # OTP MongoDB schema
│   ├── routes/
│   │   └── auth.js            # Authentication routes
│   ├── services/
│   │   └── twilioService.js   # Twilio SMS service
│   └── middleware/
│       └── auth.js            # JWT authentication middleware
│
└── frontend/                   # React Frontend
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── index.js           # React entry point
    │   ├── App.js             # Main app with routes
    │   ├── context/
    │   │   └── AuthContext.js # Auth state management
    │   ├── pages/
    │   │   ├── OTPLogin.js    # Login/Signup page
    │   │   └── Dashboard.js   # Protected dashboard
    │   ├── services/
    │   │   └── api.js         # API service with axios
    │   └── styles/
    │       ├── index.css      # Global styles
    │       ├── OTPLogin.css   # Login page styles
    │       └── Dashboard.css  # Dashboard styles
    └── package.json           # Frontend dependencies
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Twilio account (optional - demo mode available)

### 1️⃣ Clone & Install Backend

```bash
# Navigate to backend folder
cd otp-auth-project/backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env
```

### 2️⃣ Configure Environment Variables

Edit `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/otp_auth_db

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# Twilio (optional - leave blank for demo mode)
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE=+1234567890

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3️⃣ Install & Run Frontend

```bash
# Navigate to frontend folder
cd ../frontend

# Install dependencies
npm install
```

### 4️⃣ Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 5️⃣ Open in Browser

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 📱 How to Use

### Demo Mode (No Twilio)

If Twilio is not configured, the app runs in **Demo Mode**:

1. Enter your phone number
2. Click "Send OTP"
3. **OTP will be shown in a yellow box on screen** (and server console)
4. Enter the OTP
5. Click "Verify OTP"
6. You're logged in! 🎉

### Production Mode (With Twilio)

1. Configure Twilio credentials in `.env`
2. Enter your phone number
3. Click "Send OTP"
4. **OTP will be sent via SMS to your phone**
5. Enter the OTP from SMS
6. Click "Verify OTP"
7. You're logged in! 🎉

---

## 📡 API Endpoints

### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "phone": "+919876543210",
  "expiresIn": "5 minutes",
  "demo": true,
  "otp": "123456"  // Only in demo mode
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456",
  "name": "John Doe"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged in successfully!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "phone": "+919876543210",
    "name": "John Doe"
  },
  "isNewUser": false
}
```

### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Update Profile (Protected)
```http
PUT /api/auth/update-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "email@example.com"
}
```

---

## 🧪 Testing with Postman

1. **Send OTP:**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/send-otp`
   - Body: `{ "phone": "+919876543210" }`

2. **Verify OTP:**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/verify-otp`
   - Body: `{ "phone": "+919876543210", "otp": "123456" }`

3. **Get User (with token):**
   - Method: GET
   - URL: `http://localhost:5000/api/auth/me`
   - Headers: `Authorization: Bearer <your_token>`

---

## 🔧 Configuration

### MongoDB Setup

**Local MongoDB:**
```env
MONGO_URI=mongodb://localhost:27017/otp_auth_db
```

**MongoDB Atlas:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/otp_auth_db
```

### Twilio Setup

1. Create account at [Twilio](https://www.twilio.com)
2. Get your Account SID and Auth Token from Console
3. Get a phone number (or use trial number)
4. Add credentials to `.env`:

```env
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE=+1234567890
```

**Note:** With Twilio trial account, you can only send SMS to verified phone numbers.

---

## 🚀 Production Improvements

For production deployment, consider:

### 1. Redis for OTP Storage
```javascript
// Instead of MongoDB, use Redis for faster OTP storage
const redis = require('redis');
const client = redis.createClient();

// Store OTP with 5 minute expiry
await client.setEx(`otp:${phone}`, 300, otp);
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many OTP requests, please try again later'
});

app.use('/api/auth/send-otp', otpLimiter);
```

### 3. Input Validation
```javascript
const { body, validationResult } = require('express-validator');

router.post('/send-otp', [
  body('phone').isMobilePhone('any').withMessage('Invalid phone number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... rest of code
});
```

### 4. Helmet for Security
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 5. HTTPS in Production
```javascript
// Use HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 📝 License

MIT License - feel free to use for your projects!

---

## 🤝 Support

If you have any questions or issues, feel free to open an issue or contact us.

---

**Built with ❤️ using Node.js, Express, MongoDB, Twilio, and React**
