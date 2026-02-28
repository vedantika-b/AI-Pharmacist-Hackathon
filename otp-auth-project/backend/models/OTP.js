/**
 * OTP Model
 * 
 * MongoDB schema for storing OTP codes
 * OTPs expire after a set time and are deleted after verification
 */

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  // Phone number the OTP was sent to
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  
  // 6-digit OTP code
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    minlength: 6,
    maxlength: 6
  },
  
  // Number of verification attempts (for rate limiting)
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts
  },
  
  // Whether OTP has been verified
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Creation timestamp (for expiry calculation)
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL index - automatically delete after 5 minutes (300 seconds)
    expires: 300
  }
});

// Compound index for efficient lookups
otpSchema.index({ phone: 1, otp: 1 });

// Index on createdAt for TTL
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

// Static method to generate a 6-digit OTP
otpSchema.statics.generateOTP = function() {
  // Generate random 6-digit number (100000-999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create and save new OTP
otpSchema.statics.createOTP = async function(phone) {
  // Delete any existing OTPs for this phone number
  await this.deleteMany({ phone });
  
  // Generate new OTP
  const otp = this.generateOTP();
  
  // Create and save new OTP document
  const otpDoc = await this.create({ phone, otp });
  
  console.log(`OTP created for ${phone}: ${otp}`);
  
  return otpDoc;
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(phone, otp) {
  // Find OTP document for this phone
  const otpDoc = await this.findOne({ phone, isVerified: false });
  
  // Check if OTP exists
  if (!otpDoc) {
    return { 
      success: false, 
      message: 'OTP expired or not found. Please request a new OTP.' 
    };
  }
  
  // Check if max attempts exceeded
  if (otpDoc.attempts >= 5) {
    await otpDoc.deleteOne();
    return { 
      success: false, 
      message: 'Maximum attempts exceeded. Please request a new OTP.' 
    };
  }
  
  // Increment attempt counter
  otpDoc.attempts += 1;
  await otpDoc.save();
  
  // Check if OTP matches
  if (otpDoc.otp !== otp) {
    return { 
      success: false, 
      message: `Invalid OTP. ${5 - otpDoc.attempts} attempts remaining.`,
      attemptsRemaining: 5 - otpDoc.attempts
    };
  }
  
  // OTP verified successfully - mark as verified and delete
  otpDoc.isVerified = true;
  await otpDoc.save();
  await otpDoc.deleteOne();
  
  return { 
    success: true, 
    message: 'OTP verified successfully!' 
  };
};

// Export the model
module.exports = mongoose.model('OTP', otpSchema);
