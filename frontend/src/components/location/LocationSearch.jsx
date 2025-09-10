import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';

const LocationSearch = ({ onLocationSelect, placeholder = "Search cities...", countryFilter = null }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchCities(query);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, countryFilter]);

  const searchCities = async (searchQuery) => {
    try {
      setLoading(true);
      const data = await apiService.searchCities(searchQuery, countryFilter);
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching cities:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleLocationSelect = (city) => {
    setQuery(`${city.name}, ${city.country.name}`);
    setShowResults(false);
    onLocationSelect(city);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-3 text-gray-500 text-center">
              {loading ? 'Searching...' : 'No cities found'}
            </div>
          ) : (
            results.map((city) => (
              <button
                key={city.id}
                onClick={() => handleLocationSelect(city)}
                className="w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{city.name}</div>
                <div className="text-sm text-gray-600">{city.country.name}</div>
                {city.coordinates && (
                  <div className="text-xs text-gray-400">
                    {city.coordinates[0].toFixed(4)}, {city.coordinates[1].toFixed(4)}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;