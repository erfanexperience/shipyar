import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import OrderCard from './OrderCard';

const OrderList = ({ asShopper = true, showCreateButton = true }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, asShopper, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyOrders(asShopper, statusFilter || null);
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = () => {
    loadOrders();
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to view your orders</p>
      </div>
    );
  }

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'purchased', label: 'Purchased' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {asShopper ? 'My Orders' : 'Orders I\'m Delivering'}
        </h1>
        {showCreateButton && asShopper && (
          <button
            onClick={() => window.location.href = '/orders/create'}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Create New Order
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-4h2m-4 0a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {asShopper ? 'No orders yet' : 'No delivery orders yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {asShopper 
              ? 'Start by creating your first order to get items delivered.' 
              : 'Browse available orders to start earning by delivering.'}
          </p>
          {asShopper && (
            <button
              onClick={() => window.location.href = '/orders/create'}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Create Your First Order
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              asShopper={asShopper}
              onUpdate={handleOrderUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;