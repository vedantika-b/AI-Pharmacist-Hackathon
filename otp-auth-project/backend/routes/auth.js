/**
 * Authentication Routes
 * 
 * Handles OTP-based authentication:
 * - Send OTP to phone number
 * - Verify OTP and login/signup
 * - Get current user info
 */

const express = require('express');
const router = express.Router();

// Import models
const User = require('../models/User');
const OTP = require('../models/OTP');

// Import services and middleware
const { sendOTP } = require('../services/twilioService');
const { generateToken, authMiddleware } = require('../middleware/auth');

// ============================================
// IN-MEMORY STORAGE (for demo without MongoDB)
// ============================================
const inMemoryOTPs = new Map();  // phone -> { otp, expires, attempts }
const inMemoryUsers = new Map(); // phone -> user object

// Helper to generate OTP
const generateOTPCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// ============================================
// ROUTE: POST /api/auth/send-otp
// ============================================
/**
 * Send OTP to phone number
 * 
 * Request Body:
 * - phone: string (required) - Phone number with country code
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - demo: boolean (true if running in demo mode)
 * - otp: string (only in demo mode for testing)
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    // ========== VALIDATION ==========
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Basic phone validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?[1-9]\d{9,14}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Use format: +919876543210'
      });
    }

    // Format phone (ensure country code)
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    // ========== GENERATE OTP ==========
    console.log(`\n📱 Sending OTP request for: ${formattedPhone}`);

    let otp;
    let useMemory = false;

    try {
      // Try MongoDB first
      const otpDoc = await OTP.createOTP(formattedPhone);
      otp = otpDoc.otp;
    } catch (dbError) {
      // Fallback to in-memory storage
      console.log('Using in-memory OTP storage (MongoDB not available)');
      useMemory = true;
      otp = generateOTPCode();
      inMemoryOTPs.set(formattedPhone, {
        otp,
        expires: Date.now() + 5 * 60 * 1000, // 5 minutes
        attempts: 0
      });
    }

    // ========== SEND SMS ==========
    const smsResult = await sendOTP(formattedPhone, otp);

    // ========== RESPONSE ==========
    const response = {
      success: true,
      message: smsResult.demo 
        ? 'OTP sent successfully (Demo Mode - check server console)' 
        : 'OTP sent successfully to your phone',
      phone: formattedPhone,
      expiresIn: '5 minutes'
    };

    // Include OTP in response for demo mode (for easy testing)
    if (smsResult.demo) {
      response.demo = true;
      response.otp = otp; // REMOVE THIS IN PRODUCTION!
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.'
    });
  }
});

// ============================================
// ROUTE: POST /api/auth/verify-otp
// ============================================
/**
 * Verify OTP and login/signup user
 * 
 * Request Body:
 * - phone: string (required) - Phone number used to request OTP
 * - otp: string (required) - 6-digit OTP code
 * - name: string (optional) - User's name (for new users)
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - token: string (JWT token for authentication)
 * - user: object (user info)
 * - isNewUser: boolean
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    // ========== VALIDATION ==========
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be a 6-digit number'
      });
    }

    // Format phone
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    console.log(`\n🔐 Verifying OTP for: ${formattedPhone}`);

    // ========== VERIFY OTP ==========
    let verifyResult;
    let useMemory = false;

    try {
      // Try MongoDB first
      verifyResult = await OTP.verifyOTP(formattedPhone, otp);
    } catch (dbError) {
      // Fallback to in-memory verification
      console.log('Using in-memory OTP verification (MongoDB not available)');
      useMemory = true;
      const stored = inMemoryOTPs.get(formattedPhone);
      
      if (!stored) {
        verifyResult = { success: false, message: 'OTP expired or not found. Please request a new OTP.' };
      } else if (Date.now() > stored.expires) {
        inMemoryOTPs.delete(formattedPhone);
        verifyResult = { success: false, message: 'OTP expired. Please request a new OTP.' };
      } else if (stored.attempts >= 5) {
        inMemoryOTPs.delete(formattedPhone);
        verifyResult = { success: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
      } else if (stored.otp !== otp) {
        stored.attempts++;
        verifyResult = { success: false, message: `Invalid OTP. ${5 - stored.attempts} attempts remaining.` };
      } else {
        inMemoryOTPs.delete(formattedPhone);
        verifyResult = { success: true, message: 'OTP verified successfully!' };
      }
    }

    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
        attemptsRemaining: verifyResult.attemptsRemaining
      });
    }

    // ========== FIND OR CREATE USER ==========
    let user;
    let isNewUser = false;

    try {
      // Try MongoDB first
      user = await User.findOne({ phone: formattedPhone });

      if (!user) {
        user = await User.create({
          phone: formattedPhone,
          name: name || '',
          isProfileComplete: !!name
        });
        isNewUser = true;
        console.log(`✅ New user created: ${formattedPhone}`);
      } else {
        if (name && !user.name) {
          user.name = name;
        }
      }
      await user.recordLogin();
    } catch (dbError) {
      // Fallback to in-memory user storage
      console.log('Using in-memory user storage (MongoDB not available)');
      user = inMemoryUsers.get(formattedPhone);
      
      if (!user) {
        user = {
          _id: 'demo_' + Date.now(),
          phone: formattedPhone,
          name: name || '',
          email: '',
          isProfileComplete: !!name,
          loginCount: 1,
          lastLogin: new Date(),
          createdAt: new Date()
        };
        inMemoryUsers.set(formattedPhone, user);
        isNewUser = true;
        console.log(`✅ New user created (in-memory): ${formattedPhone}`);
      } else {
        user.loginCount = (user.loginCount || 0) + 1;
        user.lastLogin = new Date();
        if (name && !user.name) user.name = name;
      }
    }

    // ========== GENERATE JWT TOKEN ==========
    const token = generateToken(user);

    // ========== RESPONSE ==========
    return res.status(200).json({
      success: true,
      message: isNewUser 
        ? 'Account created and logged in successfully!' 
        : 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        isProfileComplete: user.isProfileComplete,
        loginCount: user.loginCount
      },
      isNewUser
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP. Please try again.'
    });
  }
});

// ============================================
// ROUTE: GET /api/auth/me
// ============================================
/**
 * Get current authenticated user info
 * Protected route - requires JWT token
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Response:
 * - success: boolean
 * - user: object (user info)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        phone: req.user.phone,
        name: req.user.name,
        email: req.user.email,
        isProfileComplete: req.user.isProfileComplete,
        loginCount: req.user.loginCount,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get User Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user info'
    });
  }
});

// ============================================
// ROUTE: PUT /api/auth/update-profile
// ============================================
/**
 * Update user profile
 * Protected route - requires JWT token
 * 
 * Request Body:
 * - name: string (optional)
 * - email: string (optional)
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - user: object (updated user info)
 */
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;

    // Check if profile is complete
    if (user.name) {
      user.isProfileComplete = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// ============================================
// ROUTE: POST /api/auth/resend-otp
// ============================================
/**
 * Resend OTP to phone number
 * Same as send-otp but intended for resending
 */
router.post('/resend-otp', async (req, res) => {
  // Reuse send-otp logic
  return router.handle(req, res, () => {
    req.url = '/send-otp';
  });
});

// Export router
module.exports = router;
