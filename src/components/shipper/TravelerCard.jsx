import React, { useState } from 'react';
import './TravelerCard.css';

const TravelerCard = ({ traveler, onContact }) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5); // Convert "14:30" format
  };

  const calculateDuration = (depDate, depTime, arrDate, arrTime) => {
    const departure = new Date(`${depDate} ${depTime}`);
    const arrival = new Date(`${arrDate} ${arrTime}`);
    const diffMs = arrival - departure;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getResponseTimeColor = (responseTime) => {
    if (responseTime.includes('30 minutes') || responseTime.includes('1 hour')) return 'excellent';
    if (responseTime.includes('2 hours') || responseTime.includes('4 hours')) return 'good';
    return 'average';
  };

  const getOnlineStatus = (lastSeen) => {
    if (lastSeen.includes('Online now')) return 'online';
    if (lastSeen.includes('hour')) return 'recent';
    return 'offline';
  };

  return (
    <div className="traveler-card">
      {/* Card Header */}
      <div className="card-header">
        <div className="traveler-profile">
          <div className="profile-image-container">
            <img 
              src={traveler.profileImage} 
              alt={traveler.name}
              className="profile-image"
            />
            <div className={`online-indicator ${getOnlineStatus(traveler.lastSeen)}`}></div>
          </div>
          
          <div className="profile-info">
            <div className="profile-name-section">
              <h3 className="traveler-name">
                {traveler.name}
                {traveler.isVerified && (
                  <span className="verified-badge" title="Verified Traveler">
                    <i className="fas fa-check-circle"></i>
                  </span>
                )}
                {traveler.isPro && (
                  <span className="pro-badge" title="Pro Traveler">PRO</span>
                )}
              </h3>
              <button 
                className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={() => setIsFavorite(!isFavorite)}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
              </button>
            </div>
            
            <div className="rating-section">
              <div className="rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <i 
                      key={i}
                      className={`fa-star ${i < Math.floor(traveler.rating) ? 'fas' : 'far'}`}
                    ></i>
                  ))}
                </div>
                <span className="rating-score">{traveler.rating}</span>
                <span className="review-count">({traveler.reviewCount} reviews)</span>
              </div>
              
              <div className="quick-stats">
                <span className="stat">
                  <i className="fas fa-shipping-fast"></i>
                  {traveler.deliverySuccess}% success
                </span>
                <span className="stat">
                  <i className="fas fa-clock"></i>
                  {traveler.responseTime}
                </span>
              </div>
            </div>

            <div className="languages">
              <i className="fas fa-language"></i>
              {traveler.languages.join(', ')}
            </div>
          </div>
        </div>

        <div className="pricing-section">
          <div className="price">
            <span className="price-amount">${traveler.pricing.perKg}</span>
            <span className="price-unit">per kg</span>
          </div>
          <div className={`response-time ${getResponseTimeColor(traveler.responseTime)}`}>
            <i className="fas fa-reply"></i>
            Responds {traveler.responseTime}
          </div>
        </div>
      </div>

      {/* Flight Information */}
      <div className="flight-info">
        <div className="route-timeline">
          <div className="departure-info">
            <div className="time">{formatTime(traveler.departure.time)}</div>
            <div className="date">{formatDate(traveler.departure.date)}</div>
            <div className="location">
              <strong>{traveler.departure.city}</strong>
              <span className="airport">({traveler.departure.airport})</span>
            </div>
          </div>

          <div className="flight-visual">
            <div className="flight-line">
              <div className="departure-dot"></div>
              <div className="flight-path">
                <i className="fas fa-plane"></i>
                <div className="duration">{traveler.tripDetails.duration}</div>
                {traveler.tripDetails.stops > 0 && (
                  <div className="stops">{traveler.tripDetails.stops} stop{traveler.tripDetails.stops > 1 ? 's' : ''}</div>
                )}
              </div>
              <div className="arrival-dot"></div>
            </div>
          </div>

          <div className="arrival-info">
            <div className="time">{formatTime(traveler.arrival.time)}</div>
            <div className="date">{formatDate(traveler.arrival.date)}</div>
            <div className="location">
              <strong>{traveler.arrival.city}</strong>
              <span className="airport">({traveler.arrival.airport})</span>
            </div>
          </div>
        </div>

        <div className="flight-details">
          <span className="airline">
            <i className="fas fa-plane-departure"></i>
            {traveler.tripDetails.airline} {traveler.tripDetails.flightNumber}
          </span>
        </div>
      </div>

      {/* Available Space */}
      <div className="space-info">
        <div className="space-header">
          <h4>
            <i className="fas fa-suitcase"></i>
            Available Space
          </h4>
          <span className="space-weight">{traveler.availableSpace.weight}</span>
        </div>
        
        <div className="space-details">
          <div className="dimensions">
            <i className="fas fa-ruler-combined"></i>
            Max dimensions: {traveler.availableSpace.dimensions}
          </div>
          <div className="description">
            {traveler.availableSpace.description}
          </div>
        </div>
      </div>

      {/* Additional Details (Collapsible) */}
      {showFullDetails && (
        <div className="additional-details">
          <div className="detail-section">
            <h5>Travel Preferences</h5>
            <ul>
              <li>No fragile items</li>
              <li>No liquids over 100ml</li>
              <li>Documents and electronics welcome</li>
              <li>Pickup and delivery in city center</li>
            </ul>
          </div>
          
          <div className="detail-section">
            <h5>Recent Reviews</h5>
            <div className="recent-review">
              <div className="review-rating">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star"></i>
                ))}
              </div>
              <p>"Very reliable and professional. Package arrived in perfect condition!"</p>
              <span className="reviewer">- Maria S., 2 weeks ago</span>
            </div>
          </div>
        </div>
      )}

      {/* Card Actions */}
      <div className="card-actions">
        <button 
          className="toggle-details-btn"
          onClick={() => setShowFullDetails(!showFullDetails)}
        >
          <i className={`fas fa-chevron-${showFullDetails ? 'up' : 'down'}`}></i>
          {showFullDetails ? 'Show Less' : 'Show More Details'}
        </button>

        <div className="action-buttons">
          <button className="message-btn">
            <i className="fas fa-comment"></i>
            Message
          </button>
          
          <button className="contact-btn" onClick={onContact}>
            <i className="fas fa-handshake"></i>
            Request Booking
          </button>
        </div>
      </div>

      {/* Last Seen */}
      <div className="last-seen">
        <i className={`fas fa-circle ${getOnlineStatus(traveler.lastSeen)}`}></i>
        {traveler.lastSeen}
      </div>
    </div>
  );
};

export default TravelerCard;