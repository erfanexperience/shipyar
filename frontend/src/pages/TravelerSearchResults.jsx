import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TravelerSearchResults.css';
import ShipperCard from '../components/shipper/ShipperCard';

const mockShippingRequests = [
  {
    id: 1,
    shipper: {
      name: "John Doe",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 4.5,
      reviewCount: 20,
      isVerified: true
    },
    package: {
      description: "Electronic gadgets",
      category: "Electronics",
      weight: "2.5kg",
      dimensions: "30x20x15cm",
      value: "$500",
      fragile: true,
      urgent: false
    },
    route: {
      origin: "New York",
      destination: "Amsterdam",
      preferredDate: "2025-06-10",
      flexible: true,
      flexibleDays: 2
    },
    payment: {
      offered: 80,
      currency: "USD",
      paymentMethod: "Secure Escrow"
    },
    requirements: {
      insuranceRequired: true,
      receiptRequired: true,
      photoUpdates: true,
      specialInstructions: "Handle with care"
    },
    timeline: {
      pickupBy: "2025-06-08",
      deliverBy: "2025-06-12",
      responseTime: "4 hours"
    },
    status: "Active",
    postedDate: "2025-05-20",
    lastUpdated: "1 hour ago"
  },
  {
    id: 2,
    shipper: {
      name: "Jane Smith",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      rating: 4.8,
      reviewCount: 35,
      isVerified: true
    },
    package: {
      description: "Clothing and accessories",
      category: "Fashion",
      weight: "1.2kg",
      dimensions: "25x15x10cm",
      value: "$200",
      fragile: false,
      urgent: true
    },
    route: {
      origin: "London",
      destination: "Paris",
      preferredDate: "2025-07-05",
      flexible: false,
      flexibleDays: 0
    },
    payment: {
      offered: 60,
      currency: "EUR",
      paymentMethod: "PayPal"
    },
    requirements: {
      insuranceRequired: false,
      receiptRequired: true,
      photoUpdates: false,
      specialInstructions: "Deliver to front desk"
    },
    timeline: {
      pickupBy: "2025-07-04",
      deliverBy: "2025-07-06",
      responseTime: "2 hours"
    },
    status: "Active",
    postedDate: "2025-06-15",
    lastUpdated: "30 minutes ago"
  },
  {
    id: 3,
    shipper: {
      name: "Bob Johnson",
      profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
      rating: 4.2,
      reviewCount: 12,
      isVerified: false
    },
    package: {
      description: "Homemade cookies",
      category: "Food",
      weight: "0.8kg",
      dimensions: "20x20x10cm",
      value: "$50",
      fragile: true,
      urgent: false
    },
    route: {
      origin: "Berlin",
      destination: "Madrid",
      preferredDate: "2025-08-20",
      flexible: true,
      flexibleDays: 3
    },
    payment: {
      offered: 40,
      currency: "EUR",
      paymentMethod: "Cash"
    },
    requirements: {
      insuranceRequired: false,
      receiptRequired: false,
      photoUpdates: true,
      specialInstructions: "Keep in a cool place"
    },
    timeline: {
      pickupBy: "2025-08-18",
      deliverBy: "2025-08-22",
      responseTime: "6 hours"
    },
    status: "Active",
    postedDate: "2025-07-10",
    lastUpdated: "2 hours ago"
  }
];

const TravelerSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = location.state || {};
  
  const [shippingRequests, setShippingRequests] = useState(mockShippingRequests);
  const [filteredRequests, setFilteredRequests] = useState(mockShippingRequests);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    paymentRange: [0, 100],
    categories: [],
    packageWeight: [0, 10],
    urgent: false,
    verified: false,
    fragile: 'any',
    insurance: 'any',
    flexibility: 'any'
  });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = [...shippingRequests];

    // Apply filters
    filtered = filtered.filter(request => {
      const payment = request.payment.offered;
      const weight = parseFloat(request.package.weight.replace('kg', ''));
      const isVerified = request.shipper.isVerified;
      const isUrgent = request.package.urgent;
      const isFragile = request.package.fragile;
      const hasInsurance = request.requirements.insuranceRequired;
      const isFlexible = request.route.flexible;

      return (
        payment >= filters.paymentRange[0] && payment <= filters.paymentRange[1] &&
        weight >= filters.packageWeight[0] && weight <= filters.packageWeight[1] &&
        (!filters.urgent || isUrgent) &&
        (!filters.verified || isVerified) &&
        (filters.fragile === 'any' || (filters.fragile === 'yes' ? isFragile : !isFragile)) &&
        (filters.insurance === 'any' || (filters.insurance === 'required' ? hasInsurance : !hasInsurance)) &&
        (filters.flexibility === 'any' || (filters.flexibility === 'flexible' ? isFlexible : !isFlexible)) &&
        (filters.categories.length === 0 || filters.categories.includes(request.package.category))
      );
    });

    // Apply sorting
    switch (sortBy) {
      case 'payment_high':
        filtered.sort((a, b) => b.payment.offered - a.payment.offered);
        break;
      case 'payment_low':
        filtered.sort((a, b) => a.payment.offered - b.payment.offered);
        break;
      case 'weight':
        filtered.sort((a, b) => parseFloat(a.package.weight) - parseFloat(b.package.weight));
        break;
      case 'date':
        filtered.sort((a, b) => new Date(a.route.preferredDate) - new Date(b.route.preferredDate));
        break;
      case 'urgent':
        filtered.sort((a, b) => (b.package.urgent ? 1 : 0) - (a.package.urgent ? 1 : 0));
        break;
      default: // recommended
        filtered.sort((a, b) => {
          const scoreA = (a.shipper.rating * 0.3) + (a.payment.offered * 0.4) + (a.package.urgent ? 0.2 : 0) + (a.shipper.reviewCount * 0.1);
          const scoreB = (b.shipper.rating * 0.3) + (b.payment.offered * 0.4) + (b.package.urgent ? 0.2 : 0) + (b.shipper.reviewCount * 0.1);
          return scoreB - scoreA;
        });
    }

    setFilteredRequests(filtered);
  }, [shippingRequests, filters, sortBy]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleNewSearch = () => {
    navigate('/');
  };

  const handleAcceptRequest = (requestId) => {
    console.log('Accepting shipping request:', requestId);
    // This would typically open a modal or navigate to acceptance page
  };

  return (
    <div className="traveler-search-results">
      {/* Header */}
      <div className="search-header">
        <div className="container">
          <div className="search-summary">
            <div className="route-info">
              <h1>
                <span className="city">{searchParams.origin || 'New York'}</span>
                <i className="fas fa-arrow-right"></i>
                <span className="city">{searchParams.destination || 'Dubai'}</span>
              </h1>
              <p className="travel-date">
                <i className="fas fa-calendar-alt"></i>
                {searchParams.date || 'June 15-20, 2025'}
              </p>
              <div className="traveler-mode">
                <i className="fas fa-suitcase"></i>
                Looking for shipping requests on your route
              </div>
            </div>
            <div className="search-actions">
              <button className="modify-search-btn" onClick={handleNewSearch}>
                <i className="fas fa-edit"></i>
                Modify Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="results-content">
        <div className="container">
          {/* Results Header */}
          <div className="results-header">
            <div className="results-info">
              <h2>{filteredRequests.length} shipping requests found</h2>
              <p>People need items delivered on your route</p>
            </div>
            
            <div className="results-controls">
              <div className="sort-selector">
                <label>Sort by:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="sort-select"
                >
                  <option value="recommended">Recommended</option>
                  <option value="payment_high">Highest Payment</option>
                  <option value="payment_low">Lowest Payment</option>
                  <option value="weight">Lightest First</option>
                  <option value="date">Earliest Date</option>
                  <option value="urgent">Urgent First</option>
                </select>
              </div>
              
              <button 
                className={`filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="fas fa-filter"></i>
                Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="results-main">
            {/* Filters Sidebar */}
            {showFilters && (
              <aside className="filters-sidebar">
                <div className="filter-section">
                  <h3>
                    <i className="fas fa-filter"></i>
                    Filter Requests
                  </h3>
                  
                  {/* Payment Range */}
                  <div className="filter-group">
                    <h4>Payment Range</h4>
                    <div className="payment-range">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.paymentRange[1]}
                        onChange={(e) => handleFilterChange({
                          ...filters,
                          paymentRange: [filters.paymentRange[0], parseInt(e.target.value)]
                        })}
                      />
                      <div className="range-labels">
                        <span>$0</span>
                        <span>${filters.paymentRange[1]}+</span>
                      </div>
                    </div>
                  </div>

                  {/* Package Weight */}
                  <div className="filter-group">
                    <h4>Max Package Weight</h4>
                    <div className="weight-range">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={filters.packageWeight[1]}
                        onChange={(e) => handleFilterChange({
                          ...filters,
                          packageWeight: [0, parseFloat(e.target.value)]
                        })}
                      />
                      <div className="range-labels">
                        <span>0kg</span>
                        <span>{filters.packageWeight[1]}kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div className="filter-group">
                    <h4>Quick Filters</h4>
                    <div className="checkbox-filters">
                      <label className="checkbox-filter">
                        <input
                          type="checkbox"
                          checked={filters.urgent}
                          onChange={(e) => handleFilterChange({...filters, urgent: e.target.checked})}
                        />
                        <span>Urgent requests only</span>
                      </label>
                      
                      <label className="checkbox-filter">
                        <input
                          type="checkbox"
                          checked={filters.verified}
                          onChange={(e) => handleFilterChange({...filters, verified: e.target.checked})}
                        />
                        <span>Verified shippers only</span>
                      </label>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="filter-group">
                    <h4>Categories</h4>
                    <div className="category-filters">
                      {['Fashion & Accessories', 'Documents', 'Electronics', 'Food & Beverages'].map(category => (
                        <label key={category} className="checkbox-filter">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={(e) => {
                              const newCategories = e.target.checked
                                ? [...filters.categories, category]
                                : filters.categories.filter(c => c !== category);
                              handleFilterChange({...filters, categories: newCategories});
                            }}
                          />
                          <span>{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Results List */}
            <main className={`results-list ${!showFilters ? 'full-width' : ''}`}>
              {/* Loading State */}
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Finding shipping requests on your route...</p>
                </div>
              ) : (
                <>
                  {/* Shipping Request Cards */}
                  <div className="requests-grid">
                    {filteredRequests.map(request => (
                      <ShipperCard
                        key={request.id}
                        shipper={request.shipper}
                        package={request.package}
                        route={request.route}
                        payment={request.payment}
                        requirements={request.requirements}
                        timeline={request.timeline}
                        status={request.status}
                        postedDate={request.postedDate}
                        lastUpdated={request.lastUpdated}
                        onContact={() => handleAcceptRequest(request.id)}
                      />
                    ))}
                  </div>

                  {/* No Results */}
                  {filteredRequests.length === 0 && (
                    <div className="no-results">
                      <div className="no-results-icon">
                        <i className="fas fa-search"></i>
                      </div>
                      <h3>No shipping requests found</h3>
                      <p>Try adjusting your filters or search criteria to see more requests</p>
                      <button className="modify-search-btn" onClick={handleNewSearch}>
                        Modify Search
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelerSearchResults;