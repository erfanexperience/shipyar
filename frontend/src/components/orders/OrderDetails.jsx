import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import MakeOfferModal from '../offers/MakeOfferModal';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    if (user && orderId) {
      loadOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [orderData, offersData] = await Promise.all([
        apiService.getOrder(orderId),
        apiService.getOrderOffers(orderId).catch(() => []) // Don't fail if can't load offers
      ]);
      
      setOrder(orderData);
      setOffers(offersData);
    } catch (err) {
      setError('Failed to load order details');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to accept this offer?')) {
      return;
    }

    try {
      await apiService.acceptOffer(offerId);
      loadOrderDetails(); // Reload to get updated status
    } catch (err) {
      setError('Failed to accept offer');
      console.error('Error accepting offer:', err);
    }
  };

  const handleWithdrawOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to withdraw this offer?')) {
      return;
    }

    try {
      await apiService.withdrawOffer(offerId);
      loadOrderDetails(); // Reload to get updated offers
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

  const getOfferStatusColor = (status) => {
    const colors = {
      active: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      withdrawn: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isOrderOwner = () => {
    return user && order && order.shopper_id === user.id;
  };

  const canMakeOffer = () => {
    return user && order && order.shopper_id !== user.id && order.status === 'active';
  };

  const userHasExistingOffer = () => {
    return user && offers.some(offer => offer.traveler_id === user.id && offer.status === 'active');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view order details</h2>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back
        </button>
        
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{order.product_name}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Order Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Product Details</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Product URL:</span></div>
              <a 
                href={order.product_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 break-all block"
              >
                {order.product_url}
              </a>
              <div><span className="font-medium">Quantity:</span> {order.quantity}</div>
              {order.product_price && (
                <div><span className="font-medium">Product Price:</span> {formatCurrency(order.product_price, order.product_currency)}</div>
              )}
              {order.weight_estimate && (
                <div><span className="font-medium">Weight:</span> {order.weight_estimate} kg</div>
              )}
              {order.size_description && (
                <div><span className="font-medium">Size:</span> {order.size_description}</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-3">Delivery Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Destination:</span> {order.destination_country}
                {order.destination_city && `, ${order.destination_city.name}`}
              </div>
              {order.destination_address && (
                <div><span className="font-medium">Address:</span> {order.destination_address}</div>
              )}
              <div><span className="font-medium">Deadline:</span> {formatDate(order.deadline_date)}</div>
              {order.preferred_delivery_date && (
                <div><span className="font-medium">Preferred Delivery:</span> {formatDate(order.preferred_delivery_date)}</div>
              )}
              <div className="pt-2">
                <div className="text-lg font-semibold text-green-600">
                  Reward: {formatCurrency(order.reward_amount, order.reward_currency)}
                </div>
                {order.platform_fee && (
                  <div className="text-sm text-gray-600">
                    Platform Fee: {formatCurrency(order.platform_fee)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {order.product_description && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600">{order.product_description}</p>
          </div>
        )}

        {order.special_instructions && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Special Instructions</h3>
            <p className="text-sm text-gray-600">{order.special_instructions}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {canMakeOffer() && !userHasExistingOffer() && (
        <div className="mb-6">
          <button
            onClick={() => setShowOfferModal(true)}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Offer to Ship This Order
          </button>
        </div>
      )}

      {userHasExistingOffer() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-medium">You have already made an offer for this order.</p>
        </div>
      )}

      {/* Offers Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Offers ({offers.length})
        </h2>
        
        {offers.length === 0 ? (
          <p className="text-gray-600">No offers have been made for this order yet.</p>
        ) : (
          <div className="space-y-4">
            {offers.map(offer => (
              <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium">Traveler Offer</div>
                    <div className="text-sm text-gray-600">
                      Submitted {formatDate(offer.created_at)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOfferStatusColor(offer.status)}`}>
                    {offer.status.toUpperCase()}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-800">{offer.message}</p>
                </div>

                {offer.proposed_reward_amount && offer.proposed_reward_amount !== order.reward_amount && (
                  <div className="mb-3">
                    <span className="text-sm font-medium">Proposed Reward: </span>
                    <span className="text-sm text-green-600 font-semibold">
                      {formatCurrency(offer.proposed_reward_amount, order.reward_currency)}
                    </span>
                    {offer.proposed_reward_amount > order.reward_amount && (
                      <span className="text-xs text-orange-600 ml-2">
                        (Higher than your offer)
                      </span>
                    )}
                  </div>
                )}

                {offer.proposed_delivery_date && (
                  <div className="mb-3">
                    <span className="text-sm font-medium">Proposed Delivery: </span>
                    <span className="text-sm">{formatDate(offer.proposed_delivery_date)}</span>
                  </div>
                )}

                {/* Action Buttons for Offers */}
                <div className="flex space-x-2">
                  {isOrderOwner() && offer.status === 'active' && order.status === 'active' && (
                    <button
                      onClick={() => handleAcceptOffer(offer.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Accept Offer
                    </button>
                  )}
                  
                  {user.id === offer.traveler_id && offer.status === 'active' && (
                    <button
                      onClick={() => handleWithdrawOffer(offer.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Withdraw Offer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        order={order}
        onOfferCreated={loadOrderDetails}
      />
    </div>
  );
};

export default OrderDetails;