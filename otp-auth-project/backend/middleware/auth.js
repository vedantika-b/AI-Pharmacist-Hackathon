/**
 * JWT Authentication Middleware
 * 
 * Handles JWT token generation and verification
 * Protects routes that require authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret (use a strong secret in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // Token valid for 7 days

/**
 * Generate JWT token for a user
 * 
 * @param {object} user - User document from MongoDB
 * @returns {string} - Signed JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id,
    phone: user.phone
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return token;
};

/**
 * Verify JWT token
 * 
 * @param {string} token - JWT token to verify
 * @returns {object} - Decoded payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Authentication Middleware
 * 
 * Protects routes by verifying JWT token
 * Attaches user to request if valid
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    // Find user by ID from token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

/**
 * Optional Auth Middleware
 * 
 * Similar to authMiddleware but doesn't block if no token
 * Useful for routes that work both with and without auth
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      }
    }

    next();
  } catch (error) {
    // Don't block on error, just continue without user
    next();
  }
};

// Export functions and middleware
module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware
};
