// src/pages/Home.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import logoImg from '../assets/images/logo.png';
import packageImg from '../assets/images/package.png';
import arrowImg from '../assets/images/arrow.png';
import heartImg from '../assets/images/heart.png';

const Home = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');
  const [size, setSize] = useState('');

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

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo-container">
          <img src={logoImg} alt="Shipyar Logo" className="logo" />
          <span className="logo-text">Shipyar</span>
        </div>
        <div className="nav-links">
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
          <Link to="/login" className="login-btn">Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="headline"><span className="gradient-text">Connect</span> Travelers with Shippers</h1>
        <p className="subheadline">Share your journey, help others, and earn money while traveling</p>
      </section>

      {/* Animated Icons */}
      <section className="animated-icons-section">
        <div className="icons-container">
          <div className="icon-box package-animation">
            <img src={packageImg} alt="Package" className="icon package-icon" />
          </div>
          <div className="icon-box arrow-animation">
            <img src={arrowImg} alt="Arrow" className="icon arrow-icon" />
          </div>
          <div className="icon-box heart-animation">
            <img src={heartImg} alt="Heart" className="icon heart-icon" />
          </div>
        </div>
      </section>

      {/* Search Form */}
      <section className="search-section">
        <div className="search-container">
          <div className="user-type-selector">
            <div className="radio-group">
              <label className={`radio-option ${userType === 'traveler' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="userType"
                  value="traveler"
                  checked={userType === 'traveler'}
                  onChange={() => setUserType('traveler')}
                />
                <span className="radio-label">I'm a Traveler</span>
              </label>
              <label className={`radio-option ${userType === 'shipper' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="userType"
                  value="shipper"
                  checked={userType === 'shipper'}
                  onChange={() => setUserType('shipper')}
                />
                <span className="radio-label">I need to Ship</span>
              </label>
            </div>
          </div>

          {userType && (
            <form onSubmit={handleSearch} className="search-form">
              <div className="form-row">
                <div className="form-group">
                  <label>From</label>
                  <input
                    type="text"
                    placeholder="Origin City"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>To</label>
                  <input
                    type="text"
                    placeholder="Destination City"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>When</label>
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
                      <label>Weight</label>
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
                      <label>Size</label>
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
              
              <button type="submit" className="search-btn">
                {userType === 'traveler' 
                  ? 'Find Shipping Requests' 
                  : 'Find Travelers'
                }
              </button>
            </form>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Register</h3>
            <p>Sign up as a traveler or a shipper with just a few clicks.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Connect</h3>
            <p>Travelers list their trips, shippers request space.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Arrange</h3>
            <p>Meet up, hand over the package, confirm details.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Deliver</h3>
            <p>Package is delivered and payment is released.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <h2 className="section-title">Why Choose Shipyar?</h2>
        <div className="benefits-container">
          <div className="benefit">
            <div className="benefit-icon">💰</div>
            <h3>Save Money</h3>
            <p>Up to 70% cheaper than traditional shipping methods.</p>
          </div>
          <div className="benefit">
            <div className="benefit-icon">🌍</div>
            <h3>Go Green</h3>
            <p>Reduce carbon footprint by utilizing existing travel routes.</p>
          </div>
          <div className="benefit">
            <div className="benefit-icon">🔒</div>
            <h3>Safe & Secure</h3>
            <p>Verified users, secure payments, and package protection.</p>
          </div>
          <div className="benefit">
            <div className="benefit-icon">⚡</div>
            <h3>Fast Delivery</h3>
            <p>Often faster than standard international shipping options.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="section-title">What Our Users Say</h2>
        <div className="testimonials-container">
          <div className="testimonial">
            <p>"I saved over $200 on shipping costs and my package arrived faster than expected!"</p>
            <div className="testimonial-author">Sarah K., Shipper</div>
          </div>
          <div className="testimonial">
            <p>"I made $350 on my last trip just by carrying a few small items in my luggage. Amazing!"</p>
            <div className="testimonial-author">Michael R., Traveler</div>
          </div>
          <div className="testimonial">
            <p>"The platform is so easy to use and the support team is incredibly helpful."</p>
            <div className="testimonial-author">James L., Shipper</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to get started?</h2>
        <p>Join thousands of travelers and shippers already using Shipyar.</p>
        <Link to="/register" className="cta-button">Sign Up Now</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src={logoImg} alt="Shipyar Logo" className="footer-logo-img" />
            <span className="footer-logo-text">Shipyar</span>
          </div>
          
          <div className="footer-links">
            <div className="footer-links-column">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/press">Press</Link></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h4>Learn More</h4>
              <ul>
                <li><Link to="/how-it-works">How It Works</Link></li>
                <li><Link to="/faqs">FAQs</Link></li>
                <li><Link to="/safety">Safety</Link></li>
                <li><Link to="/blog">Blog</Link></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/cookies">Cookie Policy</Link></li>
                <li><Link to="/disputes">Dispute Resolution</Link></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h4>Connect With Us</h4>
              <div className="social-icons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
              <div className="newsletter">
                <h5>Subscribe to our newsletter</h5>
                <div className="newsletter-form">
                  <input type="email" placeholder="Your email" />
                  <button type="submit">Subscribe</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Shipyar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;