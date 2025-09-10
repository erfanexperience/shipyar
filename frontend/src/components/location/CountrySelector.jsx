import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const CountrySelector = ({ value, onChange, className = "", required = false, placeholder = "Select Country" }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCountries();
      // Sort countries alphabetically for better UX
      const sortedCountries = data.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(sortedCountries);
    } catch (err) {
      setError('Failed to load countries');
      console.error('Failed to load countries:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <select 
        disabled 
        className={`${className} bg-gray-100 cursor-not-allowed`}
      >
        <option>Loading countries...</option>
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
          <option>Error loading countries</option>
        </select>
        <button
          onClick={loadCountries}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800 text-sm"
          title="Retry loading countries"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={className}
    >
      <option value="">{placeholder}</option>
      {countries.map(country => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
  );
};

export default CountrySelector;