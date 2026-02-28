/**
 * OTP Authentication Backend Server
 * 
 * This server handles OTP-based authentication using:
 * - Express.js for REST API
 * - MongoDB for data storage
 * - Twilio for sending SMS OTPs
 * - JWT for session management
 */

// Load environment variables from .env file
require('dotenv').config();

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import routes
const authRoutes = require('./routes/auth');

// Initialize Express app
const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Enable CORS for all origins (configure for production)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parse JSON request bodies
app.use(bodyParser.json());

// Parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// DATABASE CONNECTION
// ============================================

// In-memory storage for demo (when MongoDB not available)
let useInMemoryDB = false;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/otp_auth_db';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠️ MongoDB not available - using IN-MEMORY storage for demo');
    console.warn('   Install MongoDB or use MongoDB Atlas for production');
    useInMemoryDB = true;
  }
};

// Connect to database
connectDB();

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'OTP Authentication API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Auth routes (send-otp, verify-otp)
app.use('/api/auth', authRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   OTP Authentication Server Started    ║
  ╠════════════════════════════════════════╣
  ║   Port: ${PORT}                            ║
  ║   Mode: ${process.env.NODE_ENV || 'development'}                   ║
  ╚════════════════════════════════════════╝
  
  API Endpoints:
  - POST /api/auth/send-otp    → Send OTP to phone
  - POST /api/auth/verify-otp  → Verify OTP & login
  - GET  /api/auth/me          → Get current user (protected)
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
