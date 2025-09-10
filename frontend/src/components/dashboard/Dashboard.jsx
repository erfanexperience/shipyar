import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import OrderCard from '../orders/OrderCard';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myOrders: { total: 0, pending: 0, active: 0, completed: 0 },
    myDeliveries: { total: 0, pending: 0, active: 0, completed: 0 }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent orders and deliveries in parallel
      const [myOrdersData, myDeliveriesData] = await Promise.all([
        apiService.getMyOrders(true),   // as shopper
        apiService.getMyOrders(false)   // as traveler
      ]);

      // Calculate stats for orders
      const orderStats = calculateStats(myOrdersData);
      const deliveryStats = calculateStats(myDeliveriesData);

      setStats({
        myOrders: orderStats,
        myDeliveries: deliveryStats
      });

      // Set recent orders (last 3)
      setRecentOrders(myOrdersData.slice(0, 3));
      setRecentDeliveries(myDeliveriesData.slice(0, 3));

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const active = orders.filter(o => ['accepted', 'purchased', 'shipped'].includes(o.status)).length;
    const completed = orders.filter(o => ['delivered', 'completed'].includes(o.status)).length;
    
    return { total, pending, active, completed };
  };

  const StatCard = ({ title, value, subtitle, colorClass = "blue", onClick }) => (
    <div 
      onClick={onClick}
      className={`stat-card ${colorClass}`}
    >
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="text-center">
          <h2 className="dashboard-welcome">Please log in to view your dashboard</h2>
          <button
            onClick={() => navigate('/login')}
            className="empty-state-btn blue"
            style={{ marginTop: '1rem' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-welcome">
            Welcome back, <span className="dashboard-welcome-name">{user.first_name || user.email.split('@')[0]}</span>!
          </h1>
          <p className="dashboard-subtitle">Here's what's happening with your orders and deliveries.</p>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions-grid">
          <button
            onClick={() => navigate('/')}
            className="quick-action-btn primary"
          >
            <div className="quick-action-content">
              <div className="quick-action-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="quick-action-text">
                <h3>Create New Order</h3>
                <p>Request a new delivery from Amazon</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/traveler-search-results')}
            className="quick-action-btn secondary"
          >
            <div className="quick-action-content">
              <div className="quick-action-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="quick-action-text">
                <h3>Browse Orders</h3>
                <p>Find orders to deliver and earn</p>
              </div>
            </div>
          </button>
        </div>

        {/* My Orders Stats */}
        <div className="stats-section">
          <div className="stats-header">
            <h2 className="stats-title">My Orders</h2>
            <a
              href="/orders/my"
              onClick={(e) => { e.preventDefault(); navigate('/orders/my'); }}
              className="view-all-link"
            >
              View All →
            </a>
          </div>
          
          <div className="stats-grid">
            <StatCard
              title="Total Orders"
              value={stats.myOrders.total}
              colorClass="blue"
              onClick={() => navigate('/orders/my')}
            />
            <StatCard
              title="Pending"
              value={stats.myOrders.pending}
              subtitle="Awaiting offers"
              colorClass="orange"
              onClick={() => navigate('/orders/my?status=pending')}
            />
            <StatCard
              title="Active"
              value={stats.myOrders.active}
              subtitle="In progress"
              colorClass="purple"
              onClick={() => navigate('/orders/my?status=active')}
            />
            <StatCard
              title="Completed"
              value={stats.myOrders.completed}
              colorClass="green"
              onClick={() => navigate('/orders/my?status=completed')}
            />
          </div>

          {recentOrders.length > 0 ? (
            <div className="recent-items">
              <h3 className="recent-items-header">Recent Orders</h3>
              <div className="recent-items-list">
                {recentOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    asShopper={true}
                    onUpdate={loadDashboardData}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="empty-state-title">No orders yet</h3>
              <p className="empty-state-text">Create your first order to get started</p>
              <button
                onClick={() => navigate('/')}
                className="empty-state-btn blue"
              >
                Create Order
              </button>
            </div>
          )}
        </div>

        {/* My Deliveries Stats */}
        <div className="stats-section">
          <div className="stats-header">
            <h2 className="stats-title">My Deliveries</h2>
            <a
              href="/deliveries/my"
              onClick={(e) => { e.preventDefault(); navigate('/deliveries/my'); }}
              className="view-all-link"
              style={{ color: '#FAA43A' }}
            >
              View All →
            </a>
          </div>
          
          <div className="stats-grid">
            <StatCard
              title="Total Deliveries"
              value={stats.myDeliveries.total}
              colorClass="orange"
              onClick={() => navigate('/deliveries/my')}
            />
            <StatCard
              title="Pending"
              value={stats.myDeliveries.pending}
              subtitle="Awaiting acceptance"
              colorClass="blue"
              onClick={() => navigate('/deliveries/my?status=pending')}
            />
            <StatCard
              title="Active"
              value={stats.myDeliveries.active}
              subtitle="In progress"
              colorClass="purple"
              onClick={() => navigate('/deliveries/my?status=active')}
            />
            <StatCard
              title="Completed"
              value={stats.myDeliveries.completed}
              colorClass="green"
              onClick={() => navigate('/deliveries/my?status=completed')}
            />
          </div>

          {recentDeliveries.length > 0 ? (
            <div className="recent-items">
              <h3 className="recent-items-header">Recent Deliveries</h3>
              <div className="recent-items-list">
                {recentDeliveries.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    asShopper={false}
                    onUpdate={loadDashboardData}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="empty-state-title">No deliveries yet</h3>
              <p className="empty-state-text">Browse available orders to start earning</p>
              <button
                onClick={() => navigate('/traveler-search-results')}
                className="empty-state-btn orange"
              >
                Browse Orders
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;