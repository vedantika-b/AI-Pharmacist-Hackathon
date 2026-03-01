/**
 * Order History Page Component
 * 
 * Displays user's order history with filtering and search
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/OrderHistory.css';

// Mock order data (replace with API call)
const mockOrders = [
  {
    id: 'ORD-001',
    date: '2024-02-28',
    items: [
      { name: 'Paracetamol 500mg', quantity: 2, price: 50 },
      { name: 'Vitamin C 1000mg', quantity: 1, price: 120 }
    ],
    total: 220,
    status: 'delivered',
    deliveryDate: '2024-03-01'
  },
  {
    id: 'ORD-002',
    date: '2024-02-25',
    items: [
      { name: 'Cough Syrup 100ml', quantity: 1, price: 85 },
      { name: 'Throat Lozenges', quantity: 2, price: 40 }
    ],
    total: 165,
    status: 'delivered',
    deliveryDate: '2024-02-27'
  },
  {
    id: 'ORD-003',
    date: '2024-02-20',
    items: [
      { name: 'Blood Pressure Monitor', quantity: 1, price: 1500 },
      { name: 'Digital Thermometer', quantity: 1, price: 250 }
    ],
    total: 1750,
    status: 'delivered',
    deliveryDate: '2024-02-23'
  },
  {
    id: 'ORD-004',
    date: '2024-03-01',
    items: [
      { name: 'Multivitamin Tablets', quantity: 1, price: 350 },
      { name: 'Calcium + D3', quantity: 1, price: 280 }
    ],
    total: 630,
    status: 'processing',
    deliveryDate: null
  },
  {
    id: 'ORD-005',
    date: '2024-02-15',
    items: [
      { name: 'First Aid Kit', quantity: 1, price: 500 },
      { name: 'Bandages Pack', quantity: 2, price: 80 },
      { name: 'Antiseptic Liquid', quantity: 1, price: 120 }
    ],
    total: 780,
    status: 'delivered',
    deliveryDate: '2024-02-18'
  }
];

const OrderHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ========== STATE ==========
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  // ========== LOAD ORDERS ==========
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setLoading(false);
    }, 500);
  }, []);

  // ========== FILTER ORDERS ==========
  useEffect(() => {
    let result = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(term) ||
        order.items.some(item => item.name.toLowerCase().includes(term))
      );
    }

    setFilteredOrders(result);
  }, [orders, statusFilter, searchTerm]);

  // ========== HELPER FUNCTIONS ==========
  const getStatusBadge = (status) => {
    const statusMap = {
      delivered: { label: 'Delivered', class: 'status-delivered', icon: '✅' },
      processing: { label: 'Processing', class: 'status-processing', icon: '⏳' },
      shipped: { label: 'Shipped', class: 'status-shipped', icon: '🚚' },
      cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: '❌' }
    };
    return statusMap[status] || { label: status, class: '', icon: '📦' };
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // ========== RENDER ==========
  return (
    <div className="order-history-container">
      {/* Header */}
      <header className="order-header">
        <div className="header-content">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/dashboard')}>
              ← Back
            </button>
            <div className="logo">
              <span className="logo-icon">📦</span>
              <h1>Order History</h1>
            </div>
          </div>
          <div className="user-info">
            <span>👤 {user?.name || user?.phone || 'User'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="order-main">
        {/* Stats Summary */}
        <div className="order-stats">
          <div className="stat-item">
            <span className="stat-number">{orders.length}</span>
            <span className="stat-text">Total Orders</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {orders.filter(o => o.status === 'delivered').length}
            </span>
            <span className="stat-text">Delivered</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {orders.filter(o => o.status === 'processing').length}
            </span>
            <span className="stat-text">Processing</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {formatPrice(orders.reduce((sum, o) => sum + o.total, 0))}
            </span>
            <span className="stat-text">Total Spent</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search orders by ID or item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>
                ✕
              </button>
            )}
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => setStatusFilter('delivered')}
            >
              Delivered
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('processing')}
            >
              Processing
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
              onClick={() => setStatusFilter('shipped')}
            >
              Shipped
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>No orders found</h3>
              <p>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'You haven\'t placed any orders yet'}
              </p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const status = getStatusBadge(order.status);
              const isExpanded = expandedOrder === order.id;

              return (
                <div 
                  key={order.id} 
                  className={`order-card ${isExpanded ? 'expanded' : ''}`}
                >
                  {/* Order Header */}
                  <div 
                    className="order-card-header"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="order-info">
                      <div className="order-id-date">
                        <span className="order-id">{order.id}</span>
                        <span className="order-date">{formatDate(order.date)}</span>
                      </div>
                      <span className={`status-badge ${status.class}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <div className="order-summary">
                      <span className="item-count">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </span>
                      <span className="order-total">{formatPrice(order.total)}</span>
                      <span className={`expand-icon ${isExpanded ? 'rotated' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Order Details (Expandable) */}
                  {isExpanded && (
                    <div className="order-details">
                      <div className="items-list">
                        <h4>Order Items</h4>
                        {order.items.map((item, index) => (
                          <div key={index} className="item-row">
                            <div className="item-info">
                              <span className="item-name">{item.name}</span>
                              <span className="item-qty">x{item.quantity}</span>
                            </div>
                            <span className="item-price">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="order-footer">
                        <div className="delivery-info">
                          {order.deliveryDate ? (
                            <>
                              <span className="delivery-label">Delivered on:</span>
                              <span className="delivery-date">
                                {formatDate(order.deliveryDate)}
                              </span>
                            </>
                          ) : (
                            <span className="delivery-pending">
                              🚚 Estimated delivery in 2-3 days
                            </span>
                          )}
                        </div>
                        <div className="order-actions">
                          <button className="btn-reorder">🔄 Reorder</button>
                          <button className="btn-details">📄 Invoice</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="order-footer">
        <p>Need help? Contact us at support@pharmacy.com</p>
      </footer>
    </div>
  );
};

export default OrderHistory;
