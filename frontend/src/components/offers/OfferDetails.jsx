import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './OfferDetails.css';

const OfferDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOffer, setProcessingOffer] = useState(null);

  useEffect(() => {
    fetchOrderAndOffers();
  }, [orderId]);

  const fetchOrderAndOffers = async () => {
    try {
      setLoading(true);
      // Fetch order details
      const orderData = await apiService.getOrder(orderId);
      setOrder(orderData);
      
      // Fetch offers for this order
      const offersData = await apiService.getOrderOffers(orderId);
      setOffers(offersData);
    } catch (error) {
      console.error('Error fetching order and offers:', error);
      alert('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to accept this offer? This will decline all other offers.')) {
      return;
    }

    setProcessingOffer(offerId);
    try {
      await apiService.acceptOffer(offerId);
      alert('Offer accepted successfully! The traveler has been notified.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer. Please try again.');
    } finally {
      setProcessingOffer(null);
    }
  };

  const handleRejectOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to reject this offer?')) {
      return;
    }

    setProcessingOffer(offerId);
    try {
      await apiService.rejectOffer(offerId);
      alert('Offer rejected. The traveler has been notified.');
      // Refresh offers
      await fetchOrderAndOffers();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert('Failed to reject offer. Please try again.');
    } finally {
      setProcessingOffer(null);
    }
  };

  if (loading) {
    return (
      <div className="offer-details-loading">
        <div className="spinner"></div>
        <p>Loading offers...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="offer-details-error">
        <h2>Order not found</h2>
        <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  // Check if current user is the order owner
  const isOrderOwner = order.shopper_id === user?.id;

  if (!isOrderOwner) {
    return (
      <div className="offer-details-error">
        <h2>Access Denied</h2>
        <p>You can only manage offers for your own orders.</p>
        <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="offer-details-container">
      <div className="offer-details-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
        <h1>Manage Offers</h1>
      </div>

      <div className="order-summary-card">
        <h2>Order Details</h2>
        <div className="order-info">
          <div className="product-section">
            {order.product_image_url && (
              <img src={order.product_image_url} alt={order.product_name} className="product-image" />
            )}
            <div className="product-details">
              <h3>{order.product_name}</h3>
              <p className="product-price">${order.product_price || 'N/A'}</p>
              <p className="delivery-info">
                <i className="fas fa-map-marker-alt"></i> 
                Deliver to: {order.destination_city?.name || order.destination_country}
              </p>
              <p className="deadline-info">
                <i className="fas fa-calendar"></i> 
                By: {new Date(order.deadline_date).toLocaleDateString()}
              </p>
              <p className="reward-info">
                <i className="fas fa-coins"></i> 
                Reward: ${order.reward_amount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="offers-section">
        <h2>Received Offers ({offers.length})</h2>
        
        {offers.length === 0 ? (
          <div className="no-offers">
            <i className="fas fa-inbox"></i>
            <p>No offers received yet</p>
          </div>
        ) : (
          <div className="offers-list">
            {offers.map(offer => (
              <div key={offer.id} className={`offer-card ${offer.status}`}>
                <div className="offer-header">
                  <div className="traveler-info">
                    <div className="traveler-avatar">
                      {offer.traveler?.avatar_url ? (
                        <img src={offer.traveler.avatar_url} alt={offer.traveler.name} />
                      ) : (
                        <i className="fas fa-user-circle"></i>
                      )}
                    </div>
                    <div className="traveler-details">
                      <h3>{offer.traveler?.first_name} {offer.traveler?.last_name}</h3>
                      <div className="traveler-stats">
                        {offer.traveler?.traveler_rating > 0 && (
                          <span className="rating">
                            <i className="fas fa-star"></i> {offer.traveler.traveler_rating}
                          </span>
                        )}
                        <span className="trips">
                          {offer.traveler?.total_orders_as_traveler || 0} deliveries
                        </span>
                        {offer.traveler?.identity_verified && (
                          <span className="verified">
                            <i className="fas fa-check-circle"></i> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="offer-status-badge">
                    {offer.status}
                  </div>
                </div>

                <div className="offer-body">
                  {offer.message && (
                    <div className="offer-message">
                      <p>{offer.message}</p>
                    </div>
                  )}

                  <div className="offer-details">
                    <div className="detail-item">
                      <i className="fas fa-calendar-check"></i>
                      <span>Can deliver by: {
                        offer.proposed_delivery_date 
                          ? new Date(offer.proposed_delivery_date).toLocaleDateString()
                          : 'As per your deadline'
                      }</span>
                    </div>
                    {offer.proposed_reward_amount && offer.proposed_reward_amount !== order.reward_amount && (
                      <div className="detail-item">
                        <i className="fas fa-tag"></i>
                        <span>Proposed reward: ${offer.proposed_reward_amount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {offer.status === 'active' && (
                  <div className="offer-actions">
                    <button 
                      className="accept-button"
                      onClick={() => handleAcceptOffer(offer.id)}
                      disabled={processingOffer === offer.id}
                    >
                      {processingOffer === offer.id ? (
                        <>
                          <div className="button-spinner"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i>
                          Accept Offer
                        </>
                      )}
                    </button>
                    <button 
                      className="reject-button"
                      onClick={() => handleRejectOffer(offer.id)}
                      disabled={processingOffer === offer.id}
                    >
                      {processingOffer === offer.id ? (
                        <>
                          <div className="button-spinner"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-times"></i>
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                )}

                {offer.status === 'accepted' && (
                  <div className="offer-accepted-banner">
                    <i className="fas fa-check-circle"></i>
                    You accepted this offer
                  </div>
                )}

                {offer.status === 'withdrawn' && (
                  <div className="offer-withdrawn-banner">
                    <i className="fas fa-ban"></i>
                    This offer was withdrawn
                  </div>
                )}

                {offer.status === 'rejected' && (
                  <div className="offer-rejected-banner">
                    <i className="fas fa-times-circle"></i>
                    You rejected this offer
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferDetails;