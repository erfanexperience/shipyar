import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import OrderCard from './OrderCard';
import CountrySelector from '../location/CountrySelector';
import LocationSearch from '../location/LocationSearch';

const BrowseOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    destination_country: searchParams.get('country') || '',
    destination_city_id: searchParams.get('city') || '',
    min_reward: searchParams.get('min_reward') || '',
    max_reward: searchParams.get('max_reward') || '',
    deadline_before: searchParams.get('deadline_before') || '',
    search: searchParams.get('search') || ''
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare search filters, removing empty values
      const searchFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== '') {
          searchFilters[key] = value;
        }
      });

      const data = await apiService.searchOrders(searchFilters);
      // Filter to only show active orders (available for offers)
      const availableOrders = data.filter(order => order.status === 'active');
      setOrders(availableOrders);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val && val.toString().trim() !== '') {
        newSearchParams.set(key, val);
      }
    });
    setSearchParams(newSearchParams);
  };

  const handleLocationSelect = (city) => {
    const newFilters = {
      ...filters,
      destination_country: city.country.code,
      destination_city_id: city.id
    };
    setFilters(newFilters);
    
    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val && val.toString().trim() !== '') {
        newSearchParams.set(key, val);
      }
    });
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    setFilters({
      destination_country: '',
      destination_city_id: '',
      min_reward: '',
      max_reward: '',
      deadline_before: '',
      search: ''
    });
    setSearchParams(new URLSearchParams());
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to browse orders</h2>
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Orders</h1>
        <p className="text-gray-600 mt-1">Find orders to deliver and start earning rewards.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Search & Filter</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
            </button>
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Products
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="iPhone, laptop, etc..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Country
            </label>
            <CountrySelector
              value={filters.destination_country}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any Country"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Destination
            </label>
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              placeholder="Search cities..."
              countryFilter={filters.destination_country || null}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Reward ($)
              </label>
              <input
                type="number"
                name="min_reward"
                value={filters.min_reward}
                onChange={handleFilterChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Reward ($)
              </label>
              <input
                type="number"
                name="max_reward"
                value={filters.max_reward}
                onChange={handleFilterChange}
                placeholder="1000"
                min="0"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline Before
              </label>
              <input
                type="date"
                name="deadline_before"
                value={filters.deadline_before}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Available Orders</h2>
        <p className="text-gray-600">
          {loading ? 'Loading...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or check back later for new orders.
          </p>
          <button
            onClick={clearFilters}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              asShopper={false}
              onUpdate={loadOrders}
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {orders.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-sm text-gray-600">Available Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(Math.min(...orders.map(o => o.reward_amount)))}
              </p>
              <p className="text-sm text-gray-600">Min Reward</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(Math.max(...orders.map(o => o.reward_amount)))}
              </p>
              <p className="text-sm text-gray-600">Max Reward</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(orders.reduce((sum, o) => sum + o.reward_amount, 0))}
              </p>
              <p className="text-sm text-gray-600">Total Potential</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseOrders;