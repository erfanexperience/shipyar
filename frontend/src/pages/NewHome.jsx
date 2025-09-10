import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/auth';
import { apiService } from '../services/api';
import LocationSearch from '../components/location/LocationSearch';
import NotificationDropdown from '../components/notifications/NotificationDropdown';
import './NewHome.css';
import logoImg from '../assets/images/logo.png';

// Import product images
import pumaShoes from '../assets/products/puma-shoes.jpg';
import appleWatch from '../assets/products/apple-watch.jpg';
import stanleyTumbler from '../assets/products/stanley-tumbler.jpg';
import ps5 from '../assets/products/ps5.jpg';
import macbook from '../assets/products/macbook.jpg';
import airpods from '../assets/products/airpods.jpg';
import vitamins from '../assets/products/vitamins.jpg';
import massageGun from '../assets/products/massage-gun.jpg';

const NewHome = () => {
  const navigate = useNavigate();
  const { user, setUser, isAuthenticated } = useAuth();
  
  const [mode, setMode] = useState('order'); // 'order' or 'earn'
  const [amazonUrl, setAmazonUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [productPreview, setProductPreview] = useState(null);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  
  // Traveler/Earn mode states
  const [travelFrom, setTravelFrom] = useState('');
  const [travelTo, setTravelTo] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelFromLocation, setTravelFromLocation] = useState(null);
  const [travelToLocation, setTravelToLocation] = useState(null);

  // Featured products data with local images
  const featuredProducts = [
    {
      id: 1,
      name: 'PUMA Running Shoes',
      price: 39.00,
      originalPrice: 47.00,  // 20% more: 39 * 1.2 = 46.8 ≈ 47
      image: pumaShoes,
      url: 'https://www.amazon.com/PUMA-SOFTRIDE-Symmetry-Running-Dust-Alpine/dp/B0DDTVB6R4/'
    },
    {
      id: 2,
      name: 'Apple Watch Series 10',
      price: 359.00,
      originalPrice: 431.00,  // 20% more: 359 * 1.2 = 430.8 ≈ 431
      image: appleWatch,
      url: 'https://www.amazon.com/Apple-Smartwatch-Aluminium-Fitness-Tracker/dp/B0DGHNXP5Y/'
    },
    {
      id: 3,
      name: 'Stanley Tumbler 40oz',
      price: 24.00,
      originalPrice: 29.00,  // 20% more: 24 * 1.2 = 28.8 ≈ 29
      image: stanleyTumbler,
      url: 'https://www.amazon.com/Labulabla-Reusable-Stainless-Insulated-Beverages/dp/B0D51GZ5TR/'
    },
    {
      id: 4,
      name: 'PlayStation 5 Digital',
      price: 499.00,
      originalPrice: 599.00,  // 20% more: 499 * 1.2 = 598.8 ≈ 599
      image: ps5,
      url: 'https://www.amazon.com/PlayStation%C2%AE5-Digital-slim-PlayStation-5/dp/B0CL5KNB9M/'
    },
    {
      id: 5,
      name: 'MacBook Air M4',
      price: 899.00,
      originalPrice: 1079.00,  // 20% more: 899 * 1.2 = 1078.8 ≈ 1079
      image: macbook,
      url: 'https://www.amazon.com/Apple-2025-MacBook-13-inch-Laptop/dp/B0DZD91W4F/'
    },
    {
      id: 6,
      name: 'AirPods Pro 2',
      price: 199.00,
      originalPrice: 239.00,  // 20% more: 199 * 1.2 = 238.8 ≈ 239
      image: airpods,
      url: 'https://www.amazon.com/Apple-Cancellation-Transparency-Personalized-High-Fidelity/dp/B0D1XD1ZV3/'
    },
    {
      id: 7,
      name: 'Multivitamin Gummies',
      price: 19.00,
      originalPrice: 23.00,  // 20% more: 19 * 1.2 = 22.8 ≈ 23
      image: vitamins,
      url: 'https://www.amazon.com/Essentials-Multivitamin-Gummies-Raspberry-Natural/dp/B0DVTKP2RH/'
    },
    {
      id: 8,
      name: 'RENPHO Massage Gun',
      price: 89.00,
      originalPrice: 107.00,  // 20% more: 89 * 1.2 = 106.8 ≈ 107
      image: massageGun,
      url: 'https://www.amazon.com/RENPHO-Handheld-Percussion-Masajeador-Thermacool/dp/B0F2SWWDQJ/'
    }
  ];

  const handleProductClick = (productUrl) => {
    setAmazonUrl(productUrl);
  };

  // Fetch product details when Amazon URL changes
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!amazonUrl || !validateAmazonUrl(amazonUrl)) {
        setProductPreview(null);
        return;
      }

      setFetchingProduct(true);
      try {
        const response = await apiService.fetchAmazonProduct(amazonUrl);
        setProductPreview({
          title: response.title || 'Amazon Product',
          price: response.price,
          image: response.image_url || 'https://via.placeholder.com/150?text=No+Image',
          description: response.description || 'Product information loading...',
          scraping_note: response.scraping_note
        });
      } catch (error) {
        console.error('Error fetching product:', error);
        // Still show basic preview with URL
        const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
        const asin = asinMatch ? (asinMatch[1] || asinMatch[2]) : null;
        
        setProductPreview({
          title: `Amazon Product${asin ? ` (${asin})` : ''}`,
          price: null,
          image: 'https://via.placeholder.com/150?text=Product',
          description: 'Unable to fetch product details. Please verify on Amazon.',
          error: true
        });
      } finally {
        setFetchingProduct(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      if (amazonUrl && validateAmazonUrl(amazonUrl)) {
        fetchProductDetails();
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [amazonUrl]);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  const validateAmazonUrl = (url) => {
    return url.includes('amazon.com');
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!validateAmazonUrl(amazonUrl)) {
      alert('Please enter a valid Amazon.com URL');
      return;
    }

    // Navigate to order creation with Amazon URL
    navigate('/orders/create-from-amazon', { 
      state: { amazonUrl } 
    });
  };

  const handleFindOrders = (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    navigate('/traveler-search-results', { 
      state: { 
        origin: travelFrom, 
        destination: travelTo, 
        date: travelDate,
        originLocation: travelFromLocation,
        destinationLocation: travelToLocation
      } 
    });
  };

  return (
    <div className="new-home-container">
      {/* Navigation Bar */}
      <nav className="new-navbar">
        <div className="new-navbar-container">
          <Link to="/" className="new-navbar-logo">
            <img src={logoImg} alt="Shippyar" className="new-navbar-logo-img" />
            <span className="new-navbar-brand">
              <span className="logo-shipp">Shipp</span>
              <span className="logo-yar">yar</span>
            </span>
          </Link>
          
          {/* Mode Toggle - Centered */}
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${mode === 'order' ? 'active' : ''}`}
              onClick={() => setMode('order')}
            >
              Order
            </button>
            <button 
              className={`mode-btn ${mode === 'earn' ? 'active' : ''}`}
              onClick={() => setMode('earn')}
            >
              Earn
            </button>
          </div>
          
          <div className="new-navbar-right">
            {isAuthenticated ? (
              <div className="new-navbar-user">
                <NotificationDropdown />
                <span className="new-navbar-welcome">Welcome, </span>
                <Link to="/dashboard" className="new-navbar-username-link">
                  {user?.first_name || user?.email?.split('@')[0]}!
                </Link>
                <button onClick={handleLogout} className="new-navbar-logout">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="new-navbar-signup">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="new-hero-section">
        <div className="new-hero-container">
          {mode === 'order' ? (
            <>
              <h1 className="new-hero-title">
                Shop with Shippyar <i className="fas fa-check-circle" style={{ color: '#3293D1', fontSize: '0.8em', marginLeft: '8px' }}></i>
              </h1>
              
              <form onSubmit={handleCreateOrder} className="amazon-order-form-horizontal">
                <input
                  type="url"
                  placeholder="Paste Amazon product URL here"
                  value={amazonUrl}
                  onChange={(e) => setAmazonUrl(e.target.value)}
                  className="amazon-url-input-horizontal"
                  required
                />
                <button 
                  type="submit" 
                  className="create-order-btn-horizontal"
                  disabled={fetchingProduct || !productPreview}
                >
                  Create order
                </button>
              </form>

              {fetchingProduct && (
                <div className="product-preview loading">
                  <div className="loading-spinner"></div>
                  <p>Fetching product details...</p>
                </div>
              )}

              {productPreview && !fetchingProduct && (
                <div className="product-preview">
                  <img src={productPreview.image} alt={productPreview.title} />
                  <div className="product-info">
                    <h3>{productPreview.title}</h3>
                    {productPreview.price ? (
                      <p className="product-price">${productPreview.price}</p>
                    ) : (
                      <p className="product-price-unavailable">Price not available</p>
                    )}
                    {productPreview.scraping_note && (
                      <p className="product-note" style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                        {productPreview.scraping_note}
                      </p>
                    )}
                  </div>
                </div>
              )}


              {/* Trust Banner */}
              <div className="trust-banner-section">
                <div className="trust-banner-container">
                  <div className="trust-banner-content">
                    <h2 className="trust-banner-title">Stay away from fraud!</h2>
                    <p className="trust-banner-subtitle">
                      You are protected and safe only if you transact within Shippyar.
                    </p>
                  </div>
                  <div className="trust-banner-illustration">
                    <div className="illustration-placeholder">
                      <i className="fas fa-shield-alt" style={{ fontSize: '80px', color: '#3293D1' }}></i>
                    </div>
                  </div>
                </div>
                
                {/* Trust Features */}
                <div className="trust-features-grid">
                  <div className="trust-feature-card">
                    <i className="fas fa-user-check trust-feature-icon"></i>
                    <h3>Verified Users</h3>
                    <p>All users go through identity verification</p>
                  </div>
                  <div className="trust-feature-card">
                    <i className="fas fa-lock trust-feature-icon"></i>
                    <h3>Secure Payments</h3>
                    <p>Money held in escrow until delivery</p>
                  </div>
                  <div className="trust-feature-card">
                    <i className="fas fa-star trust-feature-icon"></i>
                    <h3>Rated Community</h3>
                    <p>Reviews and ratings for every transaction</p>
                  </div>
                  <div className="trust-feature-card">
                    <i className="fas fa-headset trust-feature-icon"></i>
                    <h3>24/7 Support</h3>
                    <p>Customer service always available</p>
                  </div>
                </div>
              </div>

              {/* Product Showcase */}
              <div className="product-showcase-container">
                <h2 className="product-showcase-title">Exclusive Offers</h2>
                <div className="product-showcase-grid">
                  {featuredProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="showcase-product-card"
                      onClick={() => handleProductClick(product.url)}
                    >
                      <div className="showcase-product-image">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <div className="showcase-loading-placeholder">Loading...</div>
                        )}
                      </div>
                      <div className="showcase-product-info">
                        <h4>{product.name}</h4>
                        <div className="showcase-product-pricing">
                          <span className="showcase-original-price">${product.originalPrice}</span>
                          <span className="showcase-product-price">${product.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="new-hero-title">
                Travel more, earn money
              </h1>
              <div className="new-hero-benefits">
                <div className="benefit-item">
                  <span className="check-icon">✓</span>
                  Earn money while traveling
                </div>
                <div className="benefit-item">
                  <span className="check-icon">✓</span>
                  Help others get products they need
                </div>
              </div>
              
              <form onSubmit={handleFindOrders} className="travel-search-form">
                <div className="travel-inputs">
                  <div className="travel-input-group">
                    <label>
                      <i className="fas fa-plane-departure"></i>
                      From
                    </label>
                    <div className="location-search-wrapper">
                      <LocationSearch
                        placeholder="Departure city"
                        onLocationSelect={(location) => {
                          setTravelFromLocation(location);
                          setTravelFrom(`${location.name}, ${location.country.name}`);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="travel-input-group">
                    <label>
                      <i className="fas fa-plane-arrival"></i>
                      To
                    </label>
                    <div className="location-search-wrapper">
                      <LocationSearch
                        placeholder="Destination city"
                        onLocationSelect={(location) => {
                          setTravelToLocation(location);
                          setTravelTo(`${location.name}, ${location.country.name}`);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="travel-input-group">
                    <label>
                      <i className="fas fa-calendar"></i>
                      When
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="find-orders-btn">
                  Find orders to deliver
                </button>
              </form>
            </>
          )}
        </div>
      </section>


      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-simple">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps-grid">
            {mode === 'order' ? (
              <>
                <div className="step-card">
                  <div className="step-number">1</div>
                  <h3>Paste Amazon Link</h3>
                  <p>Copy any Amazon product URL and paste it here</p>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <h3>Set Deadline</h3>
                  <p>Choose when you need the product delivered</p>
                </div>
                <div className="step-card">
                  <div className="step-number">3</div>
                  <h3>Get Matched</h3>
                  <p>Travelers offer to bring your item</p>
                </div>
                <div className="step-card">
                  <div className="step-number">4</div>
                  <h3>Receive Product</h3>
                  <p>Get your item delivered safely</p>
                </div>
              </>
            ) : (
              <>
                <div className="step-card">
                  <div className="step-number">1</div>
                  <h3>Post Your Trip</h3>
                  <p>Share your travel dates and route</p>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <h3>Browse Orders</h3>
                  <p>Find items to deliver on your route</p>
                </div>
                <div className="step-card">
                  <div className="step-number">3</div>
                  <h3>Make Offers</h3>
                  <p>Offer to deliver items for a reward</p>
                </div>
                <div className="step-card">
                  <div className="step-number">4</div>
                  <h3>Earn Money</h3>
                  <p>Get paid upon successful delivery</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="simple-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/how-it-works">How it works</Link>
              <Link to="/trust-safety">Trust & Safety</Link>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <Link to="/help">Help Center</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/faq">FAQ</Link>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/cookies">Cookies</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Shippyar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewHome;