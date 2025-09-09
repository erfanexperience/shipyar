import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TravelerCard from '../components/shipper/TravelerCard';
import SearchFilters from '../components/shipper/SearchFilters';
import SortOptions from '../components/shipper/SortOptions';
import './ShipperSearchResults.css';

// Mock data for travelers
const mockTravelers = [
  {
    id: 1,
    name: "Alex Johnson",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 4.9,
    reviewCount: 127,
    isVerified: true,
    isPro: true,
    departure: {
      city: "New York",
      airport: "JFK",
      date: "2025-06-15",
      time: "14:30"
    },
    arrival: {
      city: "Dubai",
      airport: "DXB", 
      date: "2025-06-16",
      time: "09:45"
    },
    availableSpace: {
      weight: "15kg",
      dimensions: "55x40x20cm",
      description: "Large suitcase space available"
    },
    pricing: {
      perKg: 12,
      fixedPrice: null,
      currency: "USD"
    },
    tripDetails: {
      airline: "Emirates",
      flightNumber: "EK201",
      stops: 0,
      duration: "12h 15m"
    },
    responseTime: "~2 hours",
    deliverySuccess: 98,
    languages: ["English", "Arabic"],
    lastSeen: "2 hours ago"
  },
  {
    id: 2,
    name: "Sarah Chen",
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b332b1c0?w=150&h=150&fit=crop&crop=face",
    rating: 4.8,
    reviewCount: 89,
    isVerified: true,
    isPro: false,
    departure: {
      city: "New York",
      airport: "LGA",
      date: "2025-06-15",
      time: "18:20"
    },
    arrival: {
      city: "Dubai",
      airport: "DXB",
      date: "2025-06-16",
      time: "15:30"
    },
    availableSpace: {
      weight: "10kg",
      dimensions: "40x30x15cm",
      description: "Medium space in carry-on"
    },
    pricing: {
      perKg: 15,
      fixedPrice: null,
      currency: "USD"
    },
    tripDetails: {
      airline: "Turkish Airlines",
      flightNumber: "TK001",
      stops: 1,
      duration: "15h 10m"
    },
    responseTime: "~4 hours",
    deliverySuccess: 95,
    languages: ["English", "Mandarin"],
    lastSeen: "1 day ago"
  },
  {
    id: 3,
    name: "Mohammed Al-Rashid",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 4.7,
    reviewCount: 156,
    isVerified: true,
    isPro: true,
    departure: {
      city: "New York",
      airport: "JFK",
      date: "2025-06-16", 
      time: "10:15"
    },
    arrival: {
      city: "Dubai",
      airport: "DXB",
      date: "2025-06-16",
      time: "23:45"
    },
    availableSpace: {
      weight: "20kg",
      dimensions: "75x50x30cm",
      description: "Large checked luggage space"
    },
    pricing: {
      perKg: 10,
      fixedPrice: null,
      currency: "USD"
    },
    tripDetails: {
      airline: "Lufthansa",
      flightNumber: "LH441",
      stops: 1,
      duration: "13h 30m"
    },
    responseTime: "~1 hour",
    deliverySuccess: 99,
    languages: ["English", "Arabic", "German"],
    lastSeen: "Online now"
  },
  {
    id: 4,
    name: "Lisa Rodriguez",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 4.6,
    reviewCount: 73,
    isVerified: false,
    isPro: false,
    departure: {
      city: "New York",
      airport: "JFK",
      date: "2025-06-17",
      time: "22:45"
    },
    arrival: {
      city: "Dubai", 
      airport: "DXB",
      date: "2025-06-18",
      time: "17:20"
    },
    availableSpace: {
      weight: "8kg",
      dimensions: "35x25x15cm",
      description: "Small to medium items only"
    },
    pricing: {
      perKg: 18,
      fixedPrice: null,
      currency: "USD"
    },
    tripDetails: {
      airline: "Qatar Airways",
      flightNumber: "QR701",
      stops: 1,
      duration: "14h 35m"
    },
    responseTime: "~6 hours",
    deliverySuccess: 92,
    languages: ["English", "Spanish"],
    lastSeen: "3 hours ago"
  },
  {
    id: 5,
    name: "David Kim",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    rating: 4.9,
    reviewCount: 203,
    isVerified: true,
    isPro: true,
    departure: {
      city: "New York",
      airport: "JFK",
      date: "2025-06-18",
      time: "11:30"
    },
    arrival: {
      city: "Dubai",
      airport: "DXB",
      date: "2025-06-19", 
      time: "05:15"
    },
    availableSpace: {
      weight: "12kg",
      dimensions: "50x35x25cm", 
      description: "Medium suitcase space"
    },
    pricing: {
      perKg: 11,
      fixedPrice: null,
      currency: "USD"
    },
    tripDetails: {
      airline: "British Airways",
      flightNumber: "BA179",
      stops: 1,
      duration: "13h 45m"
    },
    responseTime: "~30 minutes",
    deliverySuccess: 99,
    languages: ["English", "Korean"],
    lastSeen: "Online now"
  }
];

const ShipperSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = location.state || {};
  
  const [travelers, setTravelers] = useState(mockTravelers);
  const [filteredTravelers, setFilteredTravelers] = useState(mockTravelers);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
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

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...travelers];

    // Apply filters
    filtered = filtered.filter(traveler => {
      const pricePerKg = traveler.pricing.perKg;
      const rating = traveler.rating;
      const isVerified = traveler.isVerified;
      const isPro = traveler.isPro;
      const stops = traveler.tripDetails.stops;
      const spaceWeight = parseInt(traveler.availableSpace.weight.replace('kg', ''));

      return (
        pricePerKg >= filters.priceRange[0] && pricePerKg <= filters.priceRange[1] &&
        rating >= filters.minRating &&
        (!filters.verifiedOnly || isVerified) &&
        (!filters.proTravelersOnly || isPro) &&
        (filters.maxStops === 'any' || stops <= parseInt(filters.maxStops)) &&
        spaceWeight >= filters.minSpace
      );
    });

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.pricing.perKg - b.pricing.perKg);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.pricing.perKg - a.pricing.perKg);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'departure_time':
        filtered.sort((a, b) => new Date(a.departure.date + ' ' + a.departure.time) - new Date(b.departure.date + ' ' + b.departure.time));
        break;
      case 'space':
        filtered.sort((a, b) => parseInt(b.availableSpace.weight.replace('kg', '')) - parseInt(a.availableSpace.weight.replace('kg', '')));
        break;
      default: // recommended
        filtered.sort((a, b) => {
          const scoreA = (a.rating * 0.4) + (a.deliverySuccess * 0.3) + (a.reviewCount * 0.2) + (a.isPro ? 0.1 : 0);
          const scoreB = (b.rating * 0.4) + (b.deliverySuccess * 0.3) + (b.reviewCount * 0.2) + (b.isPro ? 0.1 : 0);
          return scoreB - scoreA;
        });
    }

    setFilteredTravelers(filtered);
  }, [travelers, filters, sortBy]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleNewSearch = () => {
    navigate('/');
  };

  const handleContactTraveler = (travelerId) => {
    // Handle contact/booking request
    console.log('Contacting traveler:', travelerId);
    // This would typically open a modal or navigate to a booking page
  };

  return (
    <div className="shipper-search-results">
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
                {searchParams.date || 'June 15-18, 2025'}
              </p>
              {searchParams.weight && (
                <p className="package-info">
                  <i className="fas fa-box"></i>
                  {searchParams.weight} • {searchParams.size}
                </p>
              )}
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
              <h2>{filteredTravelers.length} travelers found</h2>
              <p>Showing available space for your route</p>
            </div>
            
            <div className="results-controls">
              <button 
                className={`filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="fas fa-filter"></i>
                Filters
              </button>
              
              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <i className="fas fa-list"></i>
                  List
                </button>
                <button 
                  className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  <i className="fas fa-map"></i>
                  Map
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="results-main">
            {/* Filters Sidebar */}
            {showFilters && (
              <aside className="filters-sidebar">
                <SearchFilters 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                />
              </aside>
            )}

            {/* Results List */}
            <main className={`results-list ${!showFilters ? 'full-width' : ''}`}>
              {/* Sort Options */}
              <SortOptions 
                sortBy={sortBy}
                onSortChange={handleSortChange}
                resultCount={filteredTravelers.length}
              />

              {/* Loading State */}
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Finding the best travelers for your route...</p>
                </div>
              ) : (
                <>
                  {/* Traveler Cards */}
                  <div className="travelers-grid">
                    {filteredTravelers.map(traveler => (
                      <TravelerCard
                        key={traveler.id}
                        traveler={traveler}
                        onContact={() => handleContactTraveler(traveler.id)}
                      />
                    ))}
                  </div>

                  {/* No Results */}
                  {filteredTravelers.length === 0 && (
                    <div className="no-results">
                      <div className="no-results-icon">
                        <i className="fas fa-search"></i>
                      </div>
                      <h3>No travelers found</h3>
                      <p>Try adjusting your filters or search criteria</p>
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

export default ShipperSearchResults;