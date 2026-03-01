/**
 * API Service
 * 
 * Handles all HTTP requests to the backend API
 * Uses axios for HTTP requests
 */

import axios from 'axios';

// API Base URL - empty string uses proxy in development
// CRA proxy is configured in package.json
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// ========== REQUEST INTERCEPTOR ==========
api.interceptors.request.use(
  (config) => {
    // Add auth token to headers if available
    const token = localStorage.getItem('otp_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// ========== RESPONSE INTERCEPTOR ==========
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response?.data || error.message);
    
    // Handle 401 Unauthorized - clear auth and redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('otp_auth_token');
      localStorage.removeItem('otp_auth_user');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API FUNCTIONS
// ============================================

/**
 * Send OTP to phone number
 * 
 * @param {string} phone - Phone number with country code
 * @returns {Promise} API response
 */
export const sendOTP = async (phone) => {
  try {
    console.log('📡 API: Sending OTP request to backend...');
    console.log('📡 API: Phone:', phone);
    const response = await api.post('/api/auth/send-otp', { phone });
    console.log('📡 API: Full response:', response);
    console.log('📡 API: Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('📡 API: Error occurred:', error);
    console.error('📡 API: Error response:', error.response);
    console.error('📡 API: Error message:', error.message);
    throw error.response?.data || { message: 'Failed to send OTP' };
  }
};

/**
 * Verify OTP and login
 * 
 * @param {string} phone - Phone number
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - Optional user name
 * @returns {Promise} API response with token and user
 */
export const verifyOTP = async (phone, otp, name = '') => {
  try {
    const response = await api.post('/api/auth/verify-otp', { 
      phone, 
      otp,
      name 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to verify OTP' };
  }
};

/**
 * Get current user info
 * 
 * @returns {Promise} API response with user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get user' };
  }
};

/**
 * Update user profile
 * 
 * @param {object} data - Profile data { name, email }
 * @returns {Promise} API response with updated user
 */
export const updateProfile = async (data) => {
  try {
    const response = await api.put('/api/auth/update-profile', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update profile' };
  }
};

/**
 * Resend OTP
 * 
 * @param {string} phone - Phone number
 * @returns {Promise} API response
 */
export const resendOTP = async (phone) => {
  return sendOTP(phone);
};

// Export default api instance
export default api;
