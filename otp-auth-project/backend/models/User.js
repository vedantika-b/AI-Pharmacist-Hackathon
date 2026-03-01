/**
 * User Model
 * 
 * MongoDB schema for storing user data
 * Users are identified by their phone number (unique)
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Phone number is the primary identifier (unique)
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    // Basic phone validation (10-15 digits)
    match: [/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number']
  },
  
  // User's name (optional, can be set after first login)
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  // Email (optional, for additional contact)
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  
  // Whether user has completed profile setup
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Last login timestamp
  lastLogin: {
    type: Date
  },
  
  // Login count for analytics
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Index for faster lookups by phone
userSchema.index({ phone: 1 });

// Pre-save middleware to format phone number
userSchema.pre('save', function(next) {
  // Remove spaces and format phone number
  if (this.phone) {
    this.phone = this.phone.replace(/\s/g, '');
  }
  next();
});

// Instance method to update last login
userSchema.methods.recordLogin = async function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  await this.save();
};

// Static method to find or create user by phone
userSchema.statics.findOrCreateByPhone = async function(phone) {
  let user = await this.findOne({ phone });
  
  if (!user) {
    user = await this.create({ phone });
    console.log(`New user created: ${phone}`);
  }
  
  return user;
};

// Export the model
module.exports = mongoose.model('User', userSchema);
