/**
 * Auth Context
 * 
 * Provides authentication state and methods throughout the app:
 * - user: Current logged in user
 * - login: Login with token and user data
 * - logout: Clear authentication
 * - loading: Auth state loading
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create Auth Context
const AuthContext = createContext(null);

// Storage keys
const TOKEN_KEY = 'otp_auth_token';
const USER_KEY = 'otp_auth_user';

/**
 * Auth Provider Component
 * 
 * Wraps the app and provides auth state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ========== INITIALIZE AUTH STATE ==========
  useEffect(() => {
    // Check for stored auth data on mount
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          console.log('Auth restored from storage');
        }
      } catch (error) {
        console.error('Error restoring auth:', error);
        // Clear invalid data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ========== LOGIN ==========
  /**
   * Login user with token and user data
   * 
   * @param {string} authToken - JWT token from server
   * @param {object} userData - User object from server
   */
  const login = (authToken, userData) => {
    // Store in state
    setToken(authToken);
    setUser(userData);

    // Store in localStorage for persistence
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    console.log('User logged in:', userData.phone);
  };

  // ========== LOGOUT ==========
  /**
   * Logout user and clear all auth data
   */
  const logout = () => {
    // Clear state
    setToken(null);
    setUser(null);

    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    console.log('User logged out');
  };

  // ========== UPDATE USER ==========
  /**
   * Update user data (e.g., after profile update)
   * 
   * @param {object} userData - Updated user object
   */
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  // ========== CONTEXT VALUE ==========
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * 
 * Custom hook to access auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
