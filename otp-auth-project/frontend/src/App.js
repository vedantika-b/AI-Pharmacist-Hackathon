/**
 * Main App Component
 * 
 * Sets up routing for the application:
 * - / → OTP Login page
 * - /dashboard → Protected dashboard
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import pages
import OTPLogin from './pages/OTPLogin';
import Dashboard from './pages/Dashboard';
import OrderHistory from './pages/OrderHistory';

/**
 * Protected Route Component
 * 
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Public Route Component
 * 
 * Redirects to dashboard if user is already authenticated
 */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Main App Component
 */
function App() {
  return (
    <div className="app">
      <Routes>
        {/* Public route - OTP Login */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <OTPLogin />
            </PublicRoute>
          } 
        />
        
        {/* Protected route - Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected route - Order History */}
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
