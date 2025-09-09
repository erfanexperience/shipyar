import React from 'react';
import './ShipperCard.css';

const ShipperCard = ({ 
  shipper, 
  package: packageInfo, 
  route, 
  payment, 
  requirements, 
  timeline, 
  status, 
  postedDate, 
  lastUpdated, 
  onContact 
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="shipper-card">
      {/* Card Header */}
      <div className="card-header">
        <div className="shipper-profile">
          <div className="profile-image-container">
            <img 
              src={shipper.profileImage} 
              alt={shipper.name}
              className="profile-image"
            />
          </div>
          
          <div className="profile-info">
            <div className="profile-name-section">
              <h3 className="shipper-name">
                {shipper.name}
                {shipper.isVerified && (
                  <span className="verified-badge" title="Verified Shipper">
                    <i className="fas fa-check-circle"></i>
                  </span>
                )}
              </h3>
            </div>
            
            <div className="rating-section">
              <div className="rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <i 
                      key={i}
                      className={`fa-star ${i < Math.floor(shipper.rating) ? 'fas' : 'far'}`}
                    ></i>
                  ))}
                </div>
                <span className="rating-score">{shipper.rating}</span>
                <span className="review-count">({shipper.reviewCount} reviews)</span>
              </div>
              
              <div className="quick-stats">
                <span className="stat">
                  <i className="fas fa-shipping-fast"></i>
                  {status} request
                </span>
                <span className="stat">
                  <i className="fas fa-clock"></i>
                  Posted {formatDate(postedDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipment Information */}
      <div className="shipment-info">
        <div className="route-timeline">
          <div className="departure-info">
            <div className="location">
              <strong>{route.origin}</strong>
            </div>
            <div className="date">{formatDate(timeline.pickupBy)}</div>
          </div>

          <div className="route-visual">
            <div className="route-line">
              <div className="departure-dot"></div>
              <div className="route-path">
                <i className="fas fa-arrow-right"></i>
              </div>
              <div className="arrival-dot"></div>
            </div>
          </div>

          <div className="arrival-info">
            <div className="location">
              <strong>{route.destination}</strong>
            </div>
            <div className="date">{formatDate(timeline.deliverBy)}</div>
          </div>
        </div>
      </div>

      {/* Package Information */}
      <div className="package-info">
        <div className="package-header">
          <h4>
            <i className="fas fa-box"></i>
            Package Details
            {packageInfo.urgent && (
              <span className="urgent-badge">
                <i className="fas fa-exclamation-triangle"></i>
                Urgent
              </span>
            )}
            {packageInfo.fragile && (
              <span className="fragile-badge">
                <i className="fas fa-fragile"></i>
                Fragile
              </span>
            )}
          </h4>
        </div>
        
        <div className="package-details">
          <div className="detail-item">
            <i className="fas fa-weight-hanging"></i>
            Weight: {packageInfo.weight}
          </div>
          <div className="detail-item">
            <i className="fas fa-ruler-combined"></i>
            Dimensions: {packageInfo.dimensions}
          </div>
          <div className="detail-item">
            <i className="fas fa-money-bill-wave"></i>
            Offered Price: {payment.currency === 'USD' ? '$' : '€'}{payment.offered}
          </div>
          <div className="detail-item">
            <i className="fas fa-tag"></i>
            Category: {packageInfo.category}
          </div>
          <div className="description">
            {packageInfo.description}
          </div>
          
          {/* Requirements */}
          <div className="requirements">
            {requirements.insuranceRequired && (
              <span className="requirement-badge">
                <i className="fas fa-shield-alt"></i>
                Insurance Required
              </span>
            )}
            {requirements.receiptRequired && (
              <span className="requirement-badge">
                <i className="fas fa-receipt"></i>
                Receipt Required
              </span>
            )}
            {requirements.photoUpdates && (
              <span className="requirement-badge">
                <i className="fas fa-camera"></i>
                Photo Updates
              </span>
            )}
          </div>
          
          {requirements.specialInstructions && (
            <div className="special-instructions">
              <i className="fas fa-info-circle"></i>
              <strong>Special Instructions:</strong> {requirements.specialInstructions}
            </div>
          )}
        </div>
      </div>

      {/* Flexibility Info */}
      {route.flexible && (
        <div className="flexibility-info">
          <i className="fas fa-calendar-check"></i>
          Flexible dates (±{route.flexibleDays} days)
        </div>
      )}

      {/* Card Actions */}
      <div className="card-actions">
        <div className="payment-method">
          <i className="fas fa-credit-card"></i>
          Payment: {payment.paymentMethod}
        </div>
        
        <div className="action-buttons">
          <button className="message-btn">
            <i className="fas fa-comment"></i>
            Message
          </button>
          
          <button className="contact-btn" onClick={onContact}>
            <i className="fas fa-handshake"></i>
            Offer to Ship
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipperCard;