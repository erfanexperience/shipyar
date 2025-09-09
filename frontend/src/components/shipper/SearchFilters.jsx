import React, { useState } from 'react';
import './SearchFilters.css';

const SearchFilters = ({ filters, onFilterChange }) => {
  const [isCollapsed, setIsCollapsed] = useState({
    price: false,
    time: false,
    traveler: false,
    flight: false,
    space: false,
    other: false
  });

  const handleRangeChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const handleCheckboxChange = (field, checked) => {
    onFilterChange({
      ...filters,
      [field]: checked
    });
  };

  const handleSelectChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const handleLanguageToggle = (language) => {
    const currentLanguages = filters.languages || [];
    const updatedLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(lang => lang !== language)
      : [...currentLanguages, language];
    
    onFilterChange({
      ...filters,
      languages: updatedLanguages
    });
  };

  const toggleSection = (section) => {
    setIsCollapsed({
      ...isCollapsed,
      [section]: !isCollapsed[section]
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      priceRange: [0, 50],
      departureTime: 'any',
      minRating: 0,
      verifiedOnly: false,
      proTravelersOnly: false,
      maxStops: 'any',
      minSpace: 0,
      responseTime: 'any',
      languages: []
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.priceRange[0] > 0 || filters.priceRange[1] < 50 ||
      filters.departureTime !== 'any' ||
      filters.minRating > 0 ||
      filters.verifiedOnly ||
      filters.proTravelersOnly ||
      filters.maxStops !== 'any' ||
      filters.minSpace > 0 ||
      filters.responseTime !== 'any' ||
      (filters.languages && filters.languages.length > 0)
    );
  };

  const popularLanguages = ['English', 'Spanish', 'French', 'German', 'Arabic', 'Mandarin', 'Japanese', 'Korean'];

  return (
    <div className="search-filters">
      <div className="filters-header">
        <h3>
          <i className="fas fa-filter"></i>
          Filters
        </h3>
        {hasActiveFilters() && (
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            <i className="fas fa-times"></i>
            Clear All
          </button>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="filter-section">
        <div 
          className="filter-header"
          onClick={() => toggleSection('price')}
        >
          <h4>
            <i className="fas fa-dollar-sign"></i>
            Price per kg
          </h4>
          <i className={`fas fa-chevron-${isCollapsed.price ? 'down' : 'up'}`}></i>
        </div>
        
        {!isCollapsed.price && (
          <div className="filter-content">
            <div className="price-range">
              <div className="range-labels">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}+</span>
              </div>
              <div className="range-inputs">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.priceRange[0]}
                  onChange={(e) => handleRangeChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                  className="range-slider"
                />
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.priceRange[1]}
                  onChange={(e) => handleRangeChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="range-slider"
                />
              </div>
              <div className="price-presets">
                <button 
                  className={`preset-btn ${filters.priceRange[0] === 0 && filters.priceRange[1] === 15 ? 'active' : ''}`}
                  onClick={() => handleRangeChange('priceRange', [0, 15])}
                >
                  Under $15
                </button>
                <button 
                  className={`preset-btn ${filters.priceRange[0] === 10 && filters.priceRange[1] === 20 ? 'active' : ''}`}
                  onClick={() => handleRangeChange('priceRange', [10, 20])}
                >
                  $10 - $20
                </button>
                <button 
                  className={`preset-btn ${filters.priceRange[0] === 15 && filters.priceRange[1] === 50 ? 'active' : ''}`}
                  onClick={() => handleRangeChange('priceRange', [15, 50])}
                >
                  $15+
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Departure Time Filter */}
      <div className="filter-section">
        <div 
          className="filter-header"
          onClick={() => toggleSection('time')}
        >
          <h4>
            <i className="fas fa-clock"></i>
            Departure Time
          </h4>
          <i className={`fas fa-chevron-${isCollapsed.time ? 'down' : 'up'}`}></i>
        </div>
        
        {!isCollapsed.time && (
          <div className="filter-content">
            <div className="time-options">
              <label className={`time-option ${filters.departureTime === 'any' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="departureTime"
                  value="any"
                  checked={filters.departureTime === 'any'}
                  onChange={(e) => handleSelectChange('departureTime', e.target.value)}
                />
                <span className="time-icon">🕐</span>
                <span>Any time</span>
              </label>
              
              <label className={`time-option ${filters.departureTime === 'morning' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="departureTime"
                  value="morning"
                  checked={filters.departureTime === 'morning'}
                  onChange={(e) => handleSelectChange('departureTime', e.target.value)}
                />
                <span className="time-icon">🌅</span>
                <span>Morning (6AM - 12PM)</span>
              </label>
              
              <label className={`time-option ${filters.departureTime === 'afternoon' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="departureTime"
                  value="afternoon"
                  checked={filters.departureTime === 'afternoon'}
                  onChange={(e) => handleSelectChange('departureTime', e.target.value)}
                />
                <span className="time-icon">☀️</span>
                <span>Afternoon (12PM - 6PM)</span>
              </label>
              
              <label className={`time-option ${filters.departureTime === 'evening' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="departureTime"
                  value="evening"
                  checked={filters.departureTime === 'evening'}
                  onChange={(e) => handleSelectChange('departureTime', e.target.value)}
                />
                <span className="time-icon">🌆</span>
                <span>Evening (6PM - 12AM)</span>
              </label>
              
              <label className={`time-option ${filters.departureTime === 'night' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="departureTime"
                  value="night"
                  checked={filters.departureTime === 'night'}
                  onChange={(e) => handleSelectChange('departureTime', e.target.value)}
                />
                <span className="time-icon">🌙</span>
                <span>Night (12AM - 6AM)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Traveler Quality Filter */}
      <div className="filter-section">
        <div 
          className="filter-header"
          onClick={() => toggleSection('traveler')}
        >
          <h4>
            <i className="fas fa-user-check"></i>
            Traveler Quality
          </h4>
          <i className={`fas fa-chevron-${isCollapsed.traveler ? 'down' : 'up'}`}></i>
        </div>
        
        {!isCollapsed.traveler && (
          <div className="filter-content">
            <div className="rating-filter">
              <label>Minimum Rating</label>
              <div className="rating-options">
                {[4.5, 4.0, 3.5, 3.0, 0].map(rating => (
                  <button
                    key={rating}
                    className={`rating-btn ${filters.minRating === rating ? 'active' : ''}`}
                    onClick={() => handleRangeChange('minRating', rating)}
                  >
                    {rating === 0 ? 'Any' : (
                      <>
                        <span className="stars">
                          {[...Array(5)].map((_, i) => (
                            <i 
                              key={i}
                              className={`fa-star ${i < Math.floor(rating) ? 'fas' : 'far'}`}
                            ></i>
                          ))}
                        </span>
                        {rating}+
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="checkbox-options">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => handleCheckboxChange('verifiedOnly', e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="option-content">
                  <span className="option-title">
                    <i className="fas fa-check-circle verified-icon"></i>
                    Verified travelers only
                  </span>
                  <span className="option-desc">Identity confirmed</span>
                </span>
              </label>
              
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={filters.proTravelersOnly}
                  onChange={(e) => handleCheckboxChange('proTravelersOnly', e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="option-content">
                  <span className="option-title">
                    <span className="pro-badge-mini">PRO</span>
                    Pro travelers only
                  </span>
                  <span className="option-desc">Experienced carriers</span>
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Flight Details Filter */}
      <div className="filter-section">
        <div 
          className="filter-header"
          onClick={() => toggleSection('flight')}
        >
          <h4>
            <i className="fas fa-plane"></i>
            Flight Details
          </h4>
          <i className={`fas fa-chevron-${isCollapsed.flight ? 'down' : 'up'}`}></i>
        </div>
        
        {!isCollapsed.flight && (
          <div className="filter-content">
            <div className="stops-filter">
              <label>Maximum Stops</label>
              <select 
                value={filters.maxStops}
                onChange={(e) => handleSelectChange('maxStops', e.target.value)}
                className="select-input"
              >
                <option value="any">Any number</option>
                <option value="0">Direct flights only</option>
                <option value="1">1 stop max</option>
                <option value="2">2 stops max</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Available Space Filter */}
      <div className="filter-section">
        <div 
          className="filter-header"
          onClick={() => toggleSection('space')}
        >
          <h4>
            <i className="fas fa-suitcase"></i>
            Available Space
          </h4>
          <i className={`fas fa-chevron-${isCollapsed.space ? 'down' : 'up'}`}></i>
        </div>
        
        {!isCollapsed.space && (
          <div className="filter-content">
            <div className="space-filter">
              <label>Minimum Space Required</label>
              <div className="space-range">
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={filters.minSpace}
                  onChange={(e) => handleRangeChange('minSpace', parseInt(e.target.value))}
                  className="range-slider"
                />
                <div className="space-value">{filters.minSpace}kg</div>
              </div>
              <div className="space-presets">
                <button 
                  className={`preset-btn ${filters.minSpace === 5 ? 'active' : ''}`}
                  onClick={() => handleRangeChange('minSpace', 5)}
                >
                  Small (5kg)
                </button>
                <button 
                  className={`preset-btn ${filters.minSpace === 10 ? 'active' : ''}`}
                  onClick={() => handleRangeChange('minSpace', 10)}
                >
                  Medium (10kg)
                </button>
                <button 
                  className={`preset-btn ${filters.minSpace === 15 ? 'active' : ''}`}
                  onClick={() => handleRangeChange('minSpace', 15)}
                >
                  Large (15kg+)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Other Filters */}
      <div className="filter-section">
        <div 
          className="filter-header"
          onClick={() => toggleSection('other')}
        >
          <h4>
            <i className="fas fa-cogs"></i>
            Other Preferences
          </h4>
          <i className={`fas fa-chevron-${isCollapsed.other ? 'down' : 'up'}`}></i>
        </div>
        
        {!isCollapsed.other && (
          <div className="filter-content">
            <div className="response-time-filter">
              <label>Response Time</label>
              <select 
                value={filters.responseTime}
                onChange={(e) => handleSelectChange('responseTime', e.target.value)}
                className="select-input"
              >
                <option value="any">Any response time</option>
                <option value="fast">Within 2 hours</option>
                <option value="medium">Within 6 hours</option>
                <option value="slow">Within 24 hours</option>
              </select>
            </div>

            <div className="languages-filter">
              <label>Languages</label>
              <div className="language-tags">
                {popularLanguages.map(language => (
                  <button
                    key={language}
                    className={`language-tag ${filters.languages?.includes(language) ? 'active' : ''}`}
                    onClick={() => handleLanguageToggle(language)}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apply Button (Mobile) */}
      <div className="mobile-apply">
        <button className="apply-filters-btn">
          <i className="fas fa-check"></i>
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;