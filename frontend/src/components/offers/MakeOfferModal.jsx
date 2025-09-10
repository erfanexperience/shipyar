import React, { useState } from 'react';
import { apiService } from '../../services/api';

const MakeOfferModal = ({ isOpen, onClose, order, onOfferCreated }) => {
  const [formData, setFormData] = useState({
    message: '',
    proposed_delivery_date: '',
    proposed_reward_amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const offerData = {
        message: formData.message,
        proposed_delivery_date: formData.proposed_delivery_date || null,
        proposed_reward_amount: formData.proposed_reward_amount ? parseFloat(formData.proposed_reward_amount) : null
      };

      await apiService.createOffer(order.id, offerData);
      
      // Reset form
      setFormData({
        message: '',
        proposed_delivery_date: '',
        proposed_reward_amount: ''
      });
      
      onOfferCreated && onOfferCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create offer. Please try again.');
      console.error('Error creating offer:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Make an Offer</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-lg mb-2">{order.product_name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><span className="font-medium">Destination:</span> {order.destination_country}</p>
                <p><span className="font-medium">Deadline:</span> {formatDate(order.deadline_date)}</p>
                {order.weight_estimate && (
                  <p><span className="font-medium">Weight:</span> {order.weight_estimate} kg</p>
                )}
              </div>
              <div>
                <p><span className="font-medium">Current Reward:</span> {formatCurrency(order.reward_amount, order.reward_currency)}</p>
                {order.product_price && (
                  <p><span className="font-medium">Product Cost:</span> {formatCurrency(order.product_price, order.product_currency)}</p>
                )}
                {order.size_description && (
                  <p><span className="font-medium">Size:</span> {order.size_description}</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Reward Amount ({order.reward_currency || 'USD'})
              </label>
              <input
                type="number"
                name="proposed_reward_amount"
                value={formData.proposed_reward_amount}
                onChange={handleChange}
                placeholder={`Current: ${formatCurrency(order.reward_amount, order.reward_currency)}`}
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to accept the current reward, or propose a different amount if needed.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message / Proposal <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe your travel plans, experience, and why you're the right person for this delivery..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about your travel dates, route, and any relevant experience.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Delivery Date
              </label>
              <input
                type="date"
                name="proposed_delivery_date"
                value={formData.proposed_delivery_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                max={order.deadline_date}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                When do you plan to deliver this item? (Optional, but recommended)
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.message.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Offer...
                  </>
                ) : (
                  'Submit Offer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MakeOfferModal;