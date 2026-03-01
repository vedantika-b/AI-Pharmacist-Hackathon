'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Demo credentials for offline/demo login (bypasses Supabase)
const DEMO_USER = {
  id: 'demo-user-001',
  email: 'vedantikabhoyar135@gmail.com',
  name: 'Vedantika Bhoyar',
  password: 'admin123'
};

const DEMO_STORAGE_KEY = 'ai_pharmacist_demo_user';

interface User {
  id: string;
  email: string;
  name?: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, totpCode?: string) => Promise<{ requires_2fa?: boolean }>;
  signUp: (email: string, password: string, fullName: string, phoneNumber?: string) => Promise<{ qr_code?: string; requires_2fa?: boolean; otp_sent?: boolean; otp_code_demo?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        // First check for demo user in localStorage
        const demoUserData = localStorage.getItem(DEMO_STORAGE_KEY);
        if (demoUserData) {
          const parsedUser = JSON.parse(demoUserData);
          setUser(parsedUser);
          setLoading(false);
          return;
        }

        // Check for backend auth user
        const authUser = localStorage.getItem('auth_user');
        const authToken = localStorage.getItem('auth_token');
        if (authUser && authToken) {
          const parsedUser = JSON.parse(authUser);
          setUser(parsedUser);
          setLoading(false);
          return;
        }

        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email,
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Skip if demo user is active
          if (localStorage.getItem(DEMO_STORAGE_KEY)) {
            return;
          }
          
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email,
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string, totpCode?: string) => {
    // Check for demo credentials first (works offline)
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      const demoUser = {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
      };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return {};
    }

    // Try backend API login first
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          totp_code: totpCode 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if 2FA is required
        if (data.requires_2fa && !totpCode) {
          return { requires_2fa: true };
        }
        
        const user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.full_name || data.user.email,
        };
        // Store token and user
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        setUser(user);
        return {};
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }
    } catch (backendError: any) {
      console.log('Backend login failed:', backendError);
      // If backend fails with specific error, throw it
      if (backendError.message && !backendError.message.includes('fetch')) {
        throw backendError;
      }
    }

    // Fall back to Supabase auth if backend fails
    if (!supabase) {
      throw new Error('Invalid credentials. Please check your email and password.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
    
    return {};
  };

  const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
    // Allow demo user "signup" (just logs in)
    if (email === DEMO_USER.email) {
      const demoUser = {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        name: fullName || DEMO_USER.name,
      };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return {};
    }

    // Try backend API signup first
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName,
          phone_number: phoneNumber || null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.full_name || data.user.email,
          phone_number: data.user.phone_number,
        };
        // Store token and user
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        setUser(user);
        
        // Return QR code, 2FA status, and OTP info
        return {
          qr_code: data.qr_code,
          requires_2fa: data.requires_2fa,
          otp_sent: data.otp_sent,
          otp_code_demo: data.otp_code_demo
        };
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || errorData.message || 'Signup failed';
        
        // Handle specific error cases
        if (errorMessage.toLowerCase().includes('already registered') || 
            errorMessage.toLowerCase().includes('already exists')) {
          throw new Error('This email is already registered. Please login instead or use a different email.');
        }
        throw new Error(errorMessage);
      }
    } catch (backendError: any) {
      console.log('Backend signup error:', backendError);
      // If backend fails with specific error, throw it
      if (backendError.message && !backendError.message.includes('fetch')) {
        throw backendError;
      }
    }

    // Fall back to Supabase auth if backend fails
    if (!supabase) {
      throw new Error('Cannot create account. Please try again.');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw error;
    }
    
    return {};
  };

  const signOut = async () => {
    // Clear all auth data
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);

    // Also sign out from Supabase if configured
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Supabase signout error:', error);
      }
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Send reset email with redirect to our reset-password page
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    } as any);

    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      loading: false,
      signIn: async () => { throw new Error('Auth not available'); },
      signUp: async () => { throw new Error('Auth not available'); },
      signOut: async () => { throw new Error('Auth not available'); },
      resetPassword: async () => { throw new Error('Auth not available'); },
    };
  }
  return context;
}
