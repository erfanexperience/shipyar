import React, { useState } from 'react';
import './SortOptions.css';

const SortOptions = ({ sortBy, onSortChange, resultCount }) => {
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const sortOptions = [
    {
      value: 'recommended',
      label: 'Recommended',
      icon: 'fas fa-star',
      description: 'Best overall match'
    },
    {
      value: 'price_low',
      label: 'Price: Low to High',
      icon: 'fas fa-sort-amount-up',
      description: 'Cheapest first'
    },
    {
      value: 'price_high',
      label: 'Price: High to Low',
      icon: 'fas fa-sort-amount-down',
      description: 'Most expensive first'
    },
    {
      value: 'rating',
      label: 'Highest Rated',
      icon: 'fas fa-star',
      description: 'Best reviews first'
    },
    {
      value: 'departure_time',
      label: 'Departure Time',
      icon: 'fas fa-clock',
      description: 'Earliest departure first'
    },
    {
      value: 'space',
      label: 'Most Space Available',
      icon: 'fas fa-suitcase',
      description: 'Largest capacity first'
    },
    {
      value: 'response_time',
      label: 'Fastest Response',
      icon: 'fas fa-reply',
      description: 'Quick responders first'
    }
  ];

  const getCurrentSortOption = () => {
    return sortOptions.find(option => option.value === sortBy) || sortOptions[0];
  };

  const handleSortChange = (newSortBy) => {
    onSortChange(newSortBy);
    setShowSortDropdown(false);
  };

  const toggleSortDropdown = () => {
    setShowSortDropdown(!showSortDropdown);
  };

  const formatResultCount = (count) => {
    if (count === 0) return 'No results';
    if (count === 1) return '1 traveler';
    return `${count} travelers`;
  };

  return (
    <div className="sort-options">
      <div className="sort-header">
        <div className="result-summary">
          <h3 className="result-count">{formatResultCount(resultCount)}</h3>
          <p className="result-description">
            {resultCount > 0 
              ? `Found ${resultCount} ${resultCount === 1 ? 'traveler' : 'travelers'} for your route`
              : 'Try adjusting your filters to see more results'
            }
          </p>
        </div>

        <div className="sort-controls">
          <div className="sort-dropdown-container">
            <button 
              className="sort-dropdown-trigger"
              onClick={toggleSortDropdown}
              aria-expanded={showSortDropdown}
              aria-haspopup="true"
            >
              <div className="sort-current">
                <i className={getCurrentSortOption().icon}></i>
                <span className="sort-label">
                  Sort by: <strong>{getCurrentSortOption().label}</strong>
                </span>
              </div>
              <i className={`fas fa-chevron-${showSortDropdown ? 'up' : 'down'} sort-arrow`}></i>
            </button>

            {showSortDropdown && (
              <div className="sort-dropdown">
                <div className="sort-dropdown-header">
                  <h4>Sort Results</h4>
                  <button 
                    className="close-dropdown"
                    onClick={() => setShowSortDropdown(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                
                <div className="sort-options-list">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                      onClick={() => handleSortChange(option.value)}
                    >
                      <div className="sort-option-content">
                        <div className="sort-option-main">
                          <i className={option.icon}></i>
                          <span className="sort-option-label">{option.label}</span>
                        </div>
                        <span className="sort-option-description">{option.description}</span>
                      </div>
                      {sortBy === option.value && (
                        <div className="sort-option-selected">
                          <i className="fas fa-check"></i>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick sort buttons for popular options */}
          <div className="quick-sort-buttons">
            <button 
              className={`quick-sort-btn ${sortBy === 'price_low' ? 'active' : ''}`}
              onClick={() => handleSortChange('price_low')}
              title="Sort by lowest price"
            >
              <i className="fas fa-dollar-sign"></i>
              <span>Cheapest</span>
            </button>
            
            <button 
              className={`quick-sort-btn ${sortBy === 'rating' ? 'active' : ''}`}
              onClick={() => handleSortChange('rating')}
              title="Sort by highest rating"
            >
              <i className="fas fa-star"></i>
              <span>Top Rated</span>
            </button>
            
            <button 
              className={`quick-sort-btn ${sortBy === 'departure_time' ? 'active' : ''}`}
              onClick={() => handleSortChange('departure_time')}
              title="Sort by departure time"
            >
              <i className="fas fa-clock"></i>
              <span>Earliest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Additional sorting info */}
      {resultCount > 0 && (
        <div className="sorting-info">
          <div className="sorting-badges">
            {sortBy === 'recommended' && (
              <span className="sorting-badge recommended">
                <i className="fas fa-magic"></i>
                Showing best matches based on your preferences
              </span>
            )}
            
            {sortBy === 'price_low' && (
              <span className="sorting-badge price">
                <i className="fas fa-arrow-up"></i>
                Sorted by price: lowest first
              </span>
            )}
            
            {sortBy === 'rating' && (
              <span className="sorting-badge rating">
                <i className="fas fa-trophy"></i>
                Showing highest-rated travelers first
              </span>
            )}
            
            {sortBy === 'departure_time' && (
              <span className="sorting-badge time">
                <i className="fas fa-calendar-alt"></i>
                Sorted by departure time: earliest first
              </span>
            )}
          </div>

          <div className="view-options">
            <button className="view-option active" title="List view">
              <i className="fas fa-list"></i>
            </button>
            <button className="view-option" title="Grid view">
              <i className="fas fa-th"></i>
            </button>
            <button className="view-option" title="Map view">
              <i className="fas fa-map"></i>
            </button>
          </div>
        </div>
      )}

      {/* Results summary for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {resultCount === 0 
          ? 'No travelers found for your search criteria'
          : `${resultCount} travelers found, sorted by ${getCurrentSortOption().label}`
        }
      </div>
    </div>
  );
};

export default SortOptions;