/**
 * OTP Login Page Component
 * 
 * Handles phone number input and OTP verification
 * Two-step process:
 * 1. Enter phone number → Send OTP
 * 2. Enter OTP → Verify and Login
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendOTP, verifyOTP } from '../services/api';
import '../styles/OTPLogin.css';

const OTPLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ========== STATE ==========
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [demoOtp, setDemoOtp] = useState(''); // For demo mode
  const [timer, setTimer] = useState(0);

  // OTP input refs for auto-focus
  const otpRefs = useRef([]);

  // ========== OTP INPUT AUTO-FOCUS ==========
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  // ========== RESEND TIMER ==========
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // ========== HANDLE PHONE SUBMIT ==========
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate phone
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    console.log('📱 Starting OTP send...');

    try {
      // Format phone with country code if not present
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      console.log('📱 Formatted phone:', formattedPhone);
      
      const response = await sendOTP(formattedPhone);
      console.log('📱 API Response:', response);
      
      if (response.success) {
        setSuccess('OTP sent successfully!');
        setStep(2);
        setTimer(60); // 60 second resend timer
        
        // Store demo OTP if available (demo mode)
        if (response.demo && response.otp) {
          setDemoOtp(response.otp);
          console.log('📱 Demo OTP received:', response.otp);
        }
      }
    } catch (err) {
      console.error('❌ OTP Send Error:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ========== HANDLE OTP INPUT ==========
  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ========== HANDLE OTP VERIFY ==========
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otpString = otp.join('');
    
    // Validate OTP
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      const response = await verifyOTP(formattedPhone, otpString, name);
      
      if (response.success) {
        setSuccess(response.message);
        
        // Login user with token and data
        login(response.token, response.user);
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ========== HANDLE RESEND OTP ==========
  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    setError('');
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const response = await sendOTP(formattedPhone);
      
      if (response.success) {
        setSuccess('OTP resent successfully!');
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
        
        if (response.demo && response.otp) {
          setDemoOtp(response.otp);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER ==========
  return (
    <div className="otp-login-container">
      <div className="otp-login-card">
        {/* Header */}
        <div className="otp-login-header">
          <div className="logo">
            <span className="logo-icon">🔐</span>
            <h1>OTP Login</h1>
          </div>
          <p className="subtitle">
            {step === 1 
              ? 'Enter your phone number to receive OTP' 
              : 'Enter the 6-digit OTP sent to your phone'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="message error">
            <span className="message-icon">❌</span>
            {error}
          </div>
        )}
        {success && (
          <div className="message success">
            <span className="message-icon">✅</span>
            {success}
          </div>
        )}

        {/* Demo OTP Display */}
        {demoOtp && step === 2 && (
          <div className="demo-otp-box">
            <span className="demo-label">🧪 Demo Mode - Your OTP:</span>
            <span className="demo-otp">{demoOtp}</span>
            <span className="demo-note">(In production, this would be sent via SMS)</span>
          </div>
        )}

        {/* Step 1: Phone Number */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="otp-form">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="phone-input-wrapper">
                <span className="country-code">+91</span>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  maxLength={10}
                  autoComplete="tel"
                  required
                />
              </div>
              <span className="input-hint">Enter 10-digit mobile number</span>
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || phone.length < 10}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending OTP...
                </>
              ) : (
                <>
                  📱 Send OTP
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="otp-form">
            {/* OTP Inputs */}
            <div className="form-group">
              <label>Enter 6-Digit OTP</label>
              <div className="otp-inputs" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    ref={(el) => (otpRefs.current[index] = el)}
                    className="otp-digit"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              <span className="input-hint">
                OTP sent to +91{phone}
              </span>
            </div>

            {/* Optional Name Input */}
            <div className="form-group">
              <label htmlFor="name">Your Name (Optional)</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
              />
            </div>

            {/* Verify Button */}
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                <>
                  ✓ Verify OTP
                </>
              )}
            </button>

            {/* Resend OTP */}
            <div className="resend-section">
              {timer > 0 ? (
                <span className="resend-timer">
                  Resend OTP in {timer}s
                </span>
              ) : (
                <button 
                  type="button" 
                  className="btn-link"
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  Didn't receive OTP? Resend
                </button>
              )}
            </div>

            {/* Back Button */}
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => {
                setStep(1);
                setOtp(['', '', '', '', '', '']);
                setError('');
                setSuccess('');
                setDemoOtp('');
              }}
            >
              ← Change Phone Number
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="otp-login-footer">
          <p>Secure OTP Authentication</p>
          <p className="tech-stack">Node.js • Express • MongoDB • Twilio • React</p>
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;
