import React, { useState } from 'react';
import { apiService } from '../../services/api';
import MakeOfferModal from '../offers/MakeOfferModal';

const OrderCard = ({ order, asShopper = true, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-blue-100 text-blue-800',
      purchased: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      disputed: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayName = (status) => {
    const names = {
      draft: 'Draft',
      active: 'Active',
      matched: 'Matched',
      purchased: 'Purchased',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
      disputed: 'Disputed'
    };
    return names[status] || status;
  };

  const canCancelOrder = () => {
    return asShopper && ['draft', 'active'].includes(order.status);
  };

  const canMarkAsReceived = () => {
    return asShopper && order.status === 'delivered';
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.updateOrderStatus(order.id, 'cancelled');
      onUpdate && onUpdate();
    } catch (err) {
      setError('Failed to cancel order');
      console.error('Error cancelling order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReceived = async () => {
    if (!window.confirm('Confirm that you have received this order?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.updateOrderStatus(order.id, 'completed');
      onUpdate && onUpdate();
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating order status:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {order.product_name}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {getStatusDisplayName(order.status)}
            </span>
            <span>Order #{order.id.slice(0, 8)}</span>
            <span>Created: {formatDate(order.created_at)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-green-600">
            Reward: {formatCurrency(order.reward_amount, order.reward_currency)}
          </div>
          {order.product_price && (
            <div className="text-sm text-gray-600">
              Product: {formatCurrency(order.product_price, order.product_currency)}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Product Details</h4>
          <div className="space-y-1 text-sm text-gray-600">
            {order.product_url && (
              <div>
                <span className="font-medium">URL:</span>{' '}
                <a 
                  href={order.product_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  {order.product_url}
                </a>
              </div>
            )}
            <div><span className="font-medium">Quantity:</span> {order.quantity}</div>
            {order.weight_estimate && (
              <div><span className="font-medium">Weight:</span> {order.weight_estimate} kg</div>
            )}
            {order.size_description && (
              <div><span className="font-medium">Size:</span> {order.size_description}</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Delivery Details</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">Destination:</span>{' '}
              {order.destination_city ? `${order.destination_city.name}, ` : ''}{order.destination_country}
            </div>
            {order.destination_address && (
              <div><span className="font-medium">Address:</span> {order.destination_address}</div>
            )}
            <div><span className="font-medium">Deadline:</span> {formatDate(order.deadline_date)}</div>
            {order.preferred_delivery_date && (
              <div><span className="font-medium">Preferred:</span> {formatDate(order.preferred_delivery_date)}</div>
            )}
          </div>
        </div>
      </div>

      {order.product_description && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
          <p className="text-sm text-gray-600">{order.product_description}</p>
        </div>
      )}

      {order.special_instructions && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
          <p className="text-sm text-gray-600">{order.special_instructions}</p>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.href = `/orders/${order.id}`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            View Details
          </button>
          
          {!asShopper && order.status === 'active' && (
            <button
              onClick={() => setShowOfferModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Offer to Ship
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          {canMarkAsReceived() && (
            <button
              onClick={handleMarkAsReceived}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 text-sm"
            >
              {loading ? 'Updating...' : 'Mark as Received'}
            </button>
          )}

          {canCancelOrder() && (
            <button
              onClick={handleCancelOrder}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300 text-sm"
            >
              {loading ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        order={order}
        onOfferCreated={() => {
          onUpdate && onUpdate();
          setError('');
        }}
      />
    </div>
  );
};

export default OrderCard;