import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const CitySelector = ({ 
  countryCode, 
  value, 
  onChange, 
  className = "", 
  required = false, 
  placeholder = "Select City (Optional)" 
}) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (countryCode) {
      loadCities(countryCode);
    } else {
      setCities([]);
      if (value) {
        onChange('');
      }
    }
  }, [countryCode]);

  const loadCities = async (code) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getCitiesByCountry(code);
      // Sort cities alphabetically for better UX
      const sortedCities = data.sort((a, b) => a.name.localeCompare(b.name));
      setCities(sortedCities);
    } catch (err) {
      setError('Failed to load cities');
      console.error('Failed to load cities:', err);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !countryCode || loading;

  if (!countryCode) {
    return (
      <select 
        disabled 
        className={`${className} bg-gray-100 cursor-not-allowed`}
      >
        <option>Select a country first</option>
      </select>
    );
  }

  if (loading) {
    return (
      <select 
        disabled 
        className={`${className} bg-gray-100 cursor-not-allowed`}
      >
        <option>Loading cities...</option>
      </select>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <select 
          disabled 
          className={`${className} bg-red-50 border-red-300`}
        >
          <option>Error loading cities</option>
        </select>
        <button
          onClick={() => loadCities(countryCode)}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800 text-sm"
          title="Retry loading cities"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <select
      name="destination_city_id"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={isDisabled}
      className={`${className} ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    >
      <option value="">{placeholder}</option>
      {cities.map(city => (
        <option key={city.id} value={city.id}>
          {city.name}
        </option>
      ))}
    </select>
  );
};

export default CitySelector;