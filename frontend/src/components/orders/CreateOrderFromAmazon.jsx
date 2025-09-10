import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import CountrySelector from '../location/CountrySelector';
import CitySelector from '../location/CitySelector';
import './CreateOrderFromAmazon.css';

const CreateOrderFromAmazon = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Get Amazon URL from navigation state
  const initialAmazonUrl = location.state?.amazonUrl || '';
  const initialDeadline = location.state?.deadline || '';
  
  const [amazonUrl, setAmazonUrl] = useState(initialAmazonUrl);
  const [productData, setProductData] = useState(null);
  
  const [formData, setFormData] = useState({
    deadline_date: initialDeadline,
    preferred_delivery_date: '',
    destination_country: '',
    destination_city_id: '',
    destination_address: '',
    reward_amount: '',
    special_instructions: ''
  });

  // Fetch Amazon product data when URL is provided
  useEffect(() => {
    if (amazonUrl && amazonUrl.includes('amazon.com')) {
      fetchAmazonProduct();
    }
  }, [amazonUrl]);

  const fetchAmazonProduct = async () => {
    setFetchingProduct(true);
    setError('');
    
    try {
      const response = await apiService.fetchAmazonProduct(amazonUrl);
      setProductData(response);
      
      // Auto-suggest reward amount (10% of product price)
      if (response.price) {
        const suggestedReward = Math.round(response.price * 0.1);
        setFormData(prev => ({
          ...prev,
          reward_amount: suggestedReward.toString()
        }));
      }
    } catch (err) {
      setError('Failed to fetch product information. Please check the URL and try again.');
      console.error('Error fetching Amazon product:', err);
    } finally {
      setFetchingProduct(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create an order');
      return;
    }

    if (!productData) {
      setError('Please wait for product information to load');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const orderData = {
        // Amazon product data
        product_url: amazonUrl,
        amazon_asin: productData.asin,
        amazon_data: productData,
        
        // Product details from Amazon
        product_name: productData.title || 'Amazon Product',
        product_description: productData.description || '',
        product_image_url: productData.image_url || '',
        product_price: productData.price || null,
        product_currency: productData.currency || 'USD',
        quantity: 1,
        
        // User-provided details
        destination_country: formData.destination_country,
        destination_city_id: formData.destination_city_id || null,
        destination_address: formData.destination_address,
        deadline_date: formData.deadline_date,
        preferred_delivery_date: formData.preferred_delivery_date || null,
        reward_amount: parseFloat(formData.reward_amount),
        reward_currency: 'USD',
        special_instructions: formData.special_instructions || null,
        
        // Calculate total cost (product price + reward)
        total_cost: (productData.price || 0) + parseFloat(formData.reward_amount),
        platform_fee: parseFloat(formData.reward_amount) * 0.1, // 10% platform fee
        
        // Optional fields
        weight_estimate: null,
        size_description: null
      };

      const order = await apiService.createOrder(orderData);
      setSuccess('Order created successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to create an order</h2>
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
    <div className="create-amazon-order-container">
      <div className="create-amazon-order-card">
        <h1 className="page-title">Create Order from Amazon</h1>
        
        {/* Amazon URL Input */}
        <div className="amazon-url-section">
          <label className="form-label">
            <i className="fas fa-link"></i> Amazon Product URL
          </label>
          <div className="url-input-group">
            <input
              type="url"
              value={amazonUrl}
              onChange={(e) => setAmazonUrl(e.target.value)}
              placeholder="https://www.amazon.com/dp/..."
              className="url-input"
              required
            />
            <button 
              onClick={fetchAmazonProduct}
              disabled={fetchingProduct || !amazonUrl}
              className="fetch-btn"
            >
              {fetchingProduct ? 'Loading...' : 'Fetch'}
            </button>
          </div>
        </div>

        {/* Product Preview */}
        {fetchingProduct && (
          <div className="loading-product">
            <div className="spinner"></div>
            <p>Fetching product information from Amazon...</p>
          </div>
        )}

        {productData && !fetchingProduct && (
          <div className="product-preview-card">
            <div className="product-image">
              {productData.image_url ? (
                <img src={productData.image_url} alt={productData.title} />
              ) : (
                <div className="no-image">
                  <i className="fas fa-box"></i>
                </div>
              )}
            </div>
            <div className="product-details">
              <h3>{productData.title}</h3>
              {productData.price && (
                <p className="product-price">
                  ${productData.price.toFixed(2)} {productData.currency}
                </p>
              )}
              {productData.rating && (
                <p className="product-rating">
                  <i className="fas fa-star"></i> {productData.rating} 
                  {productData.review_count && ` (${productData.review_count} reviews)`}
                </p>
              )}
              {productData.availability && (
                <p className="product-availability">{productData.availability}</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        {/* Order Form */}
        {productData && (
          <form onSubmit={handleSubmit} className="order-form">
            <div className="form-section">
              <h2 className="section-title">Delivery Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <i className="fas fa-globe"></i> Destination Country
                  </label>
                  <CountrySelector
                    value={formData.destination_country}
                    onChange={(value) => setFormData(prev => ({ ...prev, destination_country: value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-city"></i> City (Optional)
                  </label>
                  <CitySelector
                    countryCode={formData.destination_country}
                    value={formData.destination_city_id}
                    onChange={(value) => setFormData(prev => ({ ...prev, destination_city_id: value }))}
                    disabled={!formData.destination_country}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-map-marker-alt"></i> Delivery Address (Optional)
                </label>
                <textarea
                  name="destination_address"
                  value={formData.destination_address}
                  onChange={handleChange}
                  placeholder="Street address, building, apartment number..."
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <i className="fas fa-calendar-check"></i> Deadline Date
                  </label>
                  <input
                    type="date"
                    name="deadline_date"
                    value={formData.deadline_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-calendar-alt"></i> Preferred Delivery Date
                  </label>
                  <input
                    type="date"
                    name="preferred_delivery_date"
                    value={formData.preferred_delivery_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    max={formData.deadline_date}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Reward & Instructions</h2>
              
              <div className="form-group">
                <label className="form-label required">
                  <i className="fas fa-dollar-sign"></i> Reward Amount (USD)
                </label>
                <input
                  type="number"
                  name="reward_amount"
                  value={formData.reward_amount}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                  className="form-input"
                  placeholder="Amount you'll pay the traveler"
                />
                <small className="form-hint">
                  Suggested: 10-15% of product value. Platform fee: 10% of reward.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-comment-alt"></i> Special Instructions
                </label>
                <textarea
                  name="special_instructions"
                  value={formData.special_instructions}
                  onChange={handleChange}
                  placeholder="Any special requests or instructions for the traveler..."
                  rows="4"
                  className="form-textarea"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-line">
                <span>Product Price:</span>
                <span>${productData.price?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-line">
                <span>Traveler Reward:</span>
                <span>${formData.reward_amount || '0'}</span>
              </div>
              <div className="summary-line">
                <span>Platform Fee (10%):</span>
                <span>${(parseFloat(formData.reward_amount || 0) * 0.1).toFixed(2)}</span>
              </div>
              <div className="summary-line total">
                <span>Total Cost:</span>
                <span>
                  ${((productData.price || 0) + parseFloat(formData.reward_amount || 0) + (parseFloat(formData.reward_amount || 0) * 0.1)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !productData}
              >
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateOrderFromAmazon;