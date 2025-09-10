import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const MyOffers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user) {
      loadOffers();
    }
  }, [user]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await apiService.getMyOffers();
      setOffers(data);
    } catch (err) {
      setError('Failed to load your offers');
      console.error('Error loading offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to withdraw this offer?')) {
      return;
    }

    try {
      await apiService.withdrawOffer(offerId);
      loadOffers(); // Reload offers
    } catch (err) {
      setError('Failed to withdraw offer');
      console.error('Error withdrawing offer:', err);
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

  const getOfferStatusColor = (status) => {
    const colors = {
      active: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      withdrawn: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOffers = offers.filter(offer => {
    if (filterStatus === 'all') return true;
    return offer.status === filterStatus;
  });

  const getOfferStats = () => {
    return {
      total: offers.length,
      active: offers.filter(o => o.status === 'active').length,
      accepted: offers.filter(o => o.status === 'accepted').length,
      withdrawn: offers.filter(o => o.status === 'withdrawn').length
    };
  };

  const stats = getOfferStats();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your offers</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
        <p className="text-gray-600 mt-1">Manage your shipping offers and track their status.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Total Offers</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold text-yellow-600">{stats.active}</p>
          <p className="text-sm text-gray-600">Active</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
          <p className="text-sm text-gray-600">Accepted</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold text-gray-600">{stats.withdrawn}</p>
          <p className="text-sm text-gray-600">Withdrawn</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="font-medium text-gray-700">Filter by status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Offers</option>
            <option value="active">Active</option>
            <option value="accepted">Accepted</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading your offers...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterStatus === 'all' ? 'No offers yet' : `No ${filterStatus} offers`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filterStatus === 'all' 
              ? 'Start browsing orders and making offers to earn rewards!' 
              : `You don't have any ${filterStatus} offers at the moment.`}
          </p>
          <button
            onClick={() => navigate('/orders/browse')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Browse Orders
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map(offer => (
            <div key={offer.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Order: {offer.order_product_name || 'Product Name'}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOfferStatusColor(offer.status)}`}>
                      {offer.status.toUpperCase()}
                    </span>
                    <span>Offer #{offer.id.slice(0, 8)}</span>
                    <span>Submitted: {formatDate(offer.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    Reward: {formatCurrency(offer.order_reward_amount, offer.order_reward_currency)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Destination: {offer.order_destination_country}
                  </div>
                  <div className="text-sm text-gray-600">
                    Deadline: {formatDate(offer.order_deadline_date)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Your Offer</h4>
                <p className="text-sm text-gray-700 mb-2">{offer.message}</p>
                
                {offer.proposed_reward_amount && offer.proposed_reward_amount !== offer.order_reward_amount && (
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Your Proposed Reward: </span>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(offer.proposed_reward_amount, offer.order_reward_currency)}
                    </span>
                    {offer.proposed_reward_amount > offer.order_reward_amount && (
                      <span className="text-xs text-orange-600 ml-2">
                        (Higher than original: {formatCurrency(offer.order_reward_amount, offer.order_reward_currency)})
                      </span>
                    )}
                  </div>
                )}
                
                {offer.proposed_delivery_date && (
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Proposed Delivery: </span>
                    {formatDate(offer.proposed_delivery_date)}
                  </div>
                )}

                {offer.expires_at && (
                  <div className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Expires: </span>
                    {formatDate(offer.expires_at)}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/orders/${offer.order_id}`)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    View Order
                  </button>
                </div>

                <div className="flex space-x-2">
                  {offer.status === 'active' && (
                    <button
                      onClick={() => handleWithdrawOffer(offer.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Withdraw Offer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {offers.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/orders/browse')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Browse More Orders
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              View Active Offers
            </button>
            <button
              onClick={() => setFilterStatus('accepted')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              View Accepted Offers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOffers;