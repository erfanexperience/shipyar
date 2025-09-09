import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/auth';
import './Home.css';
import logoImg from '../assets/images/logo.png';
import bgImage from '../assets/images/BG.png';
import howItWorksImg from '../assets/images/HIW.jpg';
import person1Img from '../assets/images/P1.jpg';
import person2Img from '../assets/images/P2.jpg';
import person3Img from '../assets/images/P3.jpg';

const cities = [
  'New York', 'London', 'Paris', 'Tokyo', 'Sydney', 'Berlin', 'Dubai',
  'Singapore', 'Hong Kong', 'Barcelona', 'Amsterdam', 'Rome', 'Los Angeles',
  'Toronto', 'San Francisco', 'Chicago', 'Miami', 'Las Vegas', 'Vancouver'
];

const Home = () => {
  const navigate = useNavigate();
  const { user, setUser, isAuthenticated } = useAuth();
  
  const [userType, setUserType] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');
  const [size, setSize] = useState('');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [filteredOriginCities, setFilteredOriginCities] = useState([]);
  const [filteredDestinationCities, setFilteredDestinationCities] = useState([]);
  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (userType === 'traveler') {
      navigate('/traveler-search-results', { 
        state: { origin, destination, date } 
      });
    } else if (userType === 'shipper') {
      navigate('/shipper-search-results', { 
        state: { origin, destination, date, weight, size } 
      });
    }
  };

  const handleOriginChange = (e) => {
    const value = e.target.value;
    setOrigin(value);
    
    if (value.length > 0) {
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOriginCities(filtered);
      setShowOriginDropdown(true);
    } else {
      setShowOriginDropdown(false);
    }
  };

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    
    if (value.length > 0) {
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDestinationCities(filtered);
      setShowDestinationDropdown(true);
    } else {
      setShowDestinationDropdown(false);
    }
  };

  const selectOriginCity = (city) => {
    setOrigin(city);
    setShowOriginDropdown(false);
  };

  const selectDestinationCity = (city) => {
    setDestination(city);
    setShowDestinationDropdown(false);
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <img src={logoImg} alt="Shippyar Logo" className="navbar-logo-img" />
            <span className="navbar-logo-text">
              <span className="logo-shipp">Shipp</span>
              <span className="logo-yar">yar</span>
            </span>
          </Link>
          <div className="navbar-links">
            <Link to="/about" className="navbar-link">About</Link>
            <Link to="/contact" className="navbar-link">Contact</Link>
            {isAuthenticated ? (
              <div className="navbar-user">
                <span className="navbar-user-name">
                  Hi, {user?.first_name || user?.email?.split('@')[0]}
                </span>
                <button onClick={handleLogout} className="navbar-logout-btn">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="navbar-login-btn">Login</Link>
            )}
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content-left">
            <h1 className="hero-title">Connecting Journeys to Deliver Dreams</h1>
            <p className="hero-subtitle">Seamlessly connect travelers with available space to people who need shipping worldwide</p>
            
            <div className="search-form-container">
              <div className="search-tabs">
                <button 
                  className={`search-tab ${userType === 'traveler' ? 'active' : ''}`}
                  onClick={() => setUserType('traveler')}
                >
                  I'm a Traveler
                </button>
                <button 
                  className={`search-tab ${userType === 'shipper' ? 'active' : ''}`}
                  onClick={() => setUserType('shipper')}
                >
                  I need to Ship
                </button>
              </div>
              
              {userType && (
                <form onSubmit={handleSearch} className="search-form">
                  <div className="form-group-container">
                    <div className="form-group">
                      <label><i className="fas fa-map-marker-alt"></i> From</label>
                      <div className="autocomplete-container">
                        <input
                          type="text"
                          placeholder="Origin City"
                          value={origin}
                          onChange={handleOriginChange}
                          onFocus={() => origin && setShowOriginDropdown(true)}
                          onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                          required
                        />
                        {showOriginDropdown && filteredOriginCities.length > 0 && (
                          <ul className="autocomplete-dropdown">
                            {filteredOriginCities.map((city, index) => (
                              <li key={index} onClick={() => selectOriginCity(city)}>
                                {city}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label><i className="fas fa-map-marker-alt"></i> To</label>
                      <div className="autocomplete-container">
                        <input
                          type="text"
                          placeholder="Destination City"
                          value={destination}
                          onChange={handleDestinationChange}
                          onFocus={() => destination && setShowDestinationDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDestinationDropdown(false), 200)}
                          required
                        />
                        {showDestinationDropdown && filteredDestinationCities.length > 0 && (
                          <ul className="autocomplete-dropdown">
                            {filteredDestinationCities.map((city, index) => (
                              <li key={index} onClick={() => selectDestinationCity(city)}>
                                {city}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label><i className="fas fa-calendar-alt"></i> When</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                    
                    {userType === 'shipper' && (
                      <>
                        <div className="form-group">
                          <label><i className="fas fa-weight-hanging"></i> Weight</label>
                          <select 
                            value={weight} 
                            onChange={(e) => setWeight(e.target.value)}
                            required
                          >
                            <option value="">Select weight</option>
                            <option value="1-5kg">1-5 kg</option>
                            <option value="5-10kg">5-10 kg</option>
                            <option value="10-20kg">10-20 kg</option>
                            <option value="20kg+">20+ kg</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label><i className="fas fa-box"></i> Size</label>
                          <select 
                            value={size} 
                            onChange={(e) => setSize(e.target.value)}
                            required
                          >
                            <option value="">Select size</option>
                            <option value="small">Small (fits in a backpack)</option>
                            <option value="medium">Medium (shoebox)</option>
                            <option value="large">Large (carry-on suitcase)</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <button type="submit" className="search-button">
                    <i className="fas fa-search"></i> 
                    {userType === 'traveler' ? 'Find Shipping Requests' : 'Find Travelers'}
                  </button>
                </form>
              )}
            </div>
          </div>
          <div className="hero-content-right">
            <img src={bgImage} alt="Shippyar Global Network" className="hero-image" />
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <h2 className="section-title">How Shippyar Works</h2>
        
        <div className="how-it-works-content">
          <div className="how-it-works-text">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-details">
                <h3>Register Your Account</h3>
                <p>Sign up as a traveler offering luggage space or as a shipper looking to send packages. Verify your profile to build trust in the community.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-details">
                <h3>Connect and Agree</h3>
                <p>Travelers list their trips and available space. Shippers search for matching routes and request to book space. Both parties agree on terms and pricing.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-details">
                <h3>Safe Handover and Delivery</h3>
                <p>Meet securely to hand over packages. Track delivery progress in real-time. Payment is held securely and released upon successful delivery.</p>
              </div>
            </div>
          </div>
          
          <div className="how-it-works-image">
            <img src={howItWorksImg} alt="How Shippyar Works" />
          </div>
        </div>
      </section>

      <section className="benefits-section">
        <h2 className="section-title">Why Choose Shippyar?</h2>
        
        <div className="benefits-container">
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-piggy-bank"></i>
            </div>
            <h3>Save Up to 70%</h3>
            <p>Dramatically reduce shipping costs compared to traditional courier services by utilizing existing travel plans.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-leaf"></i>
            </div>
            <h3>Eco-Friendly Shipping</h3>
            <p>Contribute to a greener planet by reducing carbon emissions through collaborative consumption.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3>Secure & Insured</h3>
            <p>Enjoy peace of mind with our verification system, secure payments, and package protection guarantees.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">
              <i className="fas fa-tachometer-alt"></i>
            </div>
            <h3>Fast & Flexible</h3>
            <p>Often faster than standard shipping options with the flexibility to choose delivery times that work for you.</p>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <h2 className="section-title">What Our Users Say</h2>
        
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="testimonial-image-square">
                <img src={person1Img} alt="Sarah K." />
              </div>
              <div className="testimonial-info">
                <h3>Sarah K.</h3>
                <p className="testimonial-location">London, UK</p>
                <div className="testimonial-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
            </div>
            <p className="testimonial-text">"I saved over $200 on shipping costs for my care package to my son studying abroad. The traveler was professional and the package arrived even faster than expected!"</p>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="testimonial-image-square">
                <img src={person2Img} alt="Michael R." />
              </div>
              <div className="testimonial-info">
                <h3>Michael R.</h3>
                <p className="testimonial-location">Toronto, Canada</p>
                <div className="testimonial-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
            </div>
            <p className="testimonial-text">"As a frequent traveler, I've earned over $1,500 in the past six months just by carrying small items in my luggage space that would otherwise go unused. Brilliant concept!"</p>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="testimonial-image-square">
                <img src={person3Img} alt="Priya M." />
              </div>
              <div className="testimonial-info">
                <h3>Priya M.</h3>
                <p className="testimonial-location">Dubai, UAE</p>
                <div className="testimonial-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
              </div>
            </div>
            <p className="testimonial-text">"Shippyar helped me send handmade gifts to my family overseas without the usual customs headaches and delays. The platform is intuitive and customer support is incredibly responsive."</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform the Way You Ship?</h2>
          <p>Join thousands of travelers and shippers already using Shippyar worldwide.</p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button primary">Sign Up Free</Link>
            <Link to="/how-it-works" className="cta-button secondary">Learn More</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo-section">
            <img src={logoImg} alt="Shippyar Logo" className="footer-logo" />
            <div className="footer-logo-text">
              <span className="footer-logo-shipp">Shipp</span>
              <span className="footer-logo-yar">yar</span>
            </div>
            <h3 className="footer-tagline">Connecting journeys, delivering packages</h3>
            <div className="social-icons">
              <a href="https://facebook.com" className="social-icon"><i className="fab fa-facebook-f"></i></a>
              <a href="https://twitter.com" className="social-icon"><i className="fab fa-twitter"></i></a>
              <a href="https://instagram.com" className="social-icon"><i className="fab fa-instagram"></i></a>
              <a href="https://linkedin.com" className="social-icon"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          
          <div className="footer-links-container">
            <div className="footer-links-column">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/press">Press</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h4>Resources</h4>
              <ul>
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/safety">Safety Center</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/faqs">FAQs</Link></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/cookies">Cookie Policy</Link></li>
                <li><Link to="/shipping-rules">Shipping Rules</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-newsletter">
            <h4>Stay Updated</h4>
            <p>Subscribe to our newsletter for the latest updates and offers.</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Your email address" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Shippyar. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="/sitemap">Sitemap</a>
            <a href="/accessibility">Accessibility</a>
            <a href="/cookie-preferences">Cookie Preferences</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;