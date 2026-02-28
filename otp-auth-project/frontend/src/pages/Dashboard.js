/**
 * Dashboard Page Component
 * 
 * Protected page shown after successful login
 * Displays user info and provides logout functionality
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  // ========== STATE ==========
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ========== HANDLE LOGOUT ==========
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ========== HANDLE PROFILE UPDATE ==========
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await updateProfile({ name, email });
      
      if (response.success) {
        updateUser(response.user);
        setEditMode(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER ==========
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🏠</span>
            <h1>Dashboard</h1>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Card */}
        <div className="welcome-card">
          <div className="welcome-icon">👋</div>
          <h2>Welcome{user?.name ? `, ${user.name}` : ''}!</h2>
          <p>You are successfully logged in via OTP</p>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* User Info Card */}
        <div className="info-card">
          <div className="card-header">
            <h3>👤 Your Profile</h3>
            {!editMode && (
              <button 
                className="btn-edit"
                onClick={() => setEditMode(true)}
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleUpdateProfile} className="edit-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setEditMode(false);
                    setName(user?.name || '');
                    setEmail(user?.email || '');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">📱 Phone</span>
                <span className="info-value">{user?.phone || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">👤 Name</span>
                <span className="info-value">{user?.name || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">📧 Email</span>
                <span className="info-value">{user?.email || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">🔢 Login Count</span>
                <span className="info-value">{user?.loginCount || 0} times</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-content">
              <span className="stat-value">Active</span>
              <span className="stat-label">Account Status</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔐</span>
            <div className="stat-content">
              <span className="stat-value">OTP</span>
              <span className="stat-label">Auth Method</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📱</span>
            <div className="stat-content">
              <span className="stat-value">Verified</span>
              <span className="stat-label">Phone Status</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="info-card">
          <h3>⚡ Quick Actions</h3>
          <div className="quick-actions">
            <button 
              className="action-btn orders-btn"
              onClick={() => navigate('/orders')}
            >
              <span className="action-icon">📦</span>
              <span className="action-text">Order History</span>
              <span className="action-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Features Card */}
        <div className="info-card">
          <h3>🚀 What's Next?</h3>
          <ul className="feature-list">
            <li>✅ OTP-based login working</li>
            <li>✅ JWT authentication enabled</li>
            <li>✅ Profile management available</li>
            <li>✅ Order History available</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>OTP Authentication Demo • Built with Node.js, Express, MongoDB, React</p>
      </footer>
    </div>
  );
};

export default Dashboard;
