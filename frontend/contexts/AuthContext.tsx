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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
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

  const signIn = async (email: string, password: string) => {
    // Check for demo credentials first (works offline)
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      const demoUser = {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
      };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return;
    }

    // Fall back to Supabase auth
    if (!supabase) {
      throw new Error('Supabase not configured. Use demo credentials to login.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Allow demo user "signup" (just logs in)
    if (email === DEMO_USER.email) {
      const demoUser = {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        name: fullName || DEMO_USER.name,
      };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return;
    }

    if (!supabase) {
      throw new Error('Supabase not configured. Use demo credentials to signup.');
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
  };

  const signOut = async () => {
    // Clear demo user if present
    localStorage.removeItem(DEMO_STORAGE_KEY);
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

    const { error } = await supabase.auth.resetPasswordForEmail(email as any);

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
