/**
 * Twilio SMS Service
 * 
 * Handles sending SMS messages via Twilio API
 * Supports both production (Twilio) and demo mode
 */

// Import Twilio SDK
const twilio = require('twilio');

// Check if Twilio credentials are configured
const isTwilioConfigured = () => {
  return (
    process.env.TWILIO_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE
  );
};

// Initialize Twilio client (if configured)
let twilioClient = null;

if (isTwilioConfigured()) {
  twilioClient = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log('✅ Twilio client initialized');
} else {
  console.log('⚠️ Twilio not configured - running in DEMO mode');
  console.log('   OTPs will be logged to console instead of SMS');
}

/**
 * Send OTP via SMS using Twilio
 * 
 * @param {string} phone - Recipient phone number (with country code)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<object>} - Result object with success status
 */
const sendOTP = async (phone, otp) => {
  // Validate inputs
  if (!phone || !otp) {
    throw new Error('Phone number and OTP are required');
  }

  // Format phone number (ensure it has country code)
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

  // Message content
  const message = `Your OTP verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

  // ============================================
  // DEMO MODE (No Twilio configured)
  // ============================================
  if (!twilioClient) {
    console.log('\n' + '='.repeat(50));
    console.log('📱 DEMO MODE - OTP SMS');
    console.log('='.repeat(50));
    console.log(`To: ${formattedPhone}`);
    console.log(`OTP: ${otp}`);
    console.log(`Message: ${message}`);
    console.log('='.repeat(50) + '\n');

    return {
      success: true,
      demo: true,
      message: 'OTP sent successfully (Demo Mode - check console)',
      otp: otp // Return OTP in demo mode for testing
    };
  }

  // ============================================
  // PRODUCTION MODE (Twilio configured)
  // ============================================
  try {
    // Send SMS via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: formattedPhone
    });

    console.log(`✅ SMS sent successfully to ${formattedPhone}`);
    console.log(`   Message SID: ${result.sid}`);

    return {
      success: true,
      demo: false,
      message: 'OTP sent successfully via SMS',
      sid: result.sid
    };

  } catch (error) {
    console.error('❌ Twilio SMS Error:', error.message);
    
    // Handle specific Twilio errors
    if (error.code === 21211) {
      throw new Error('Invalid phone number format');
    }
    if (error.code === 21608) {
      throw new Error('Phone number not verified with Twilio trial account');
    }
    if (error.code === 20003) {
      throw new Error('Twilio authentication failed - check credentials');
    }
    
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Verify Twilio configuration
 * 
 * @returns {Promise<object>} - Verification result
 */
const verifyTwilioConfig = async () => {
  if (!twilioClient) {
    return {
      configured: false,
      message: 'Twilio not configured - running in demo mode'
    };
  }

  try {
    // Test API access by fetching account info
    const account = await twilioClient.api.accounts(process.env.TWILIO_SID).fetch();
    
    return {
      configured: true,
      status: account.status,
      friendlyName: account.friendlyName,
      message: 'Twilio configured and working'
    };
  } catch (error) {
    return {
      configured: true,
      error: error.message,
      message: 'Twilio configured but connection failed'
    };
  }
};

// Export functions
module.exports = {
  sendOTP,
  verifyTwilioConfig,
  isTwilioConfigured
};
