import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Map, { NavigationControl, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { indianCities, formatCurrency } from '../../utils/formatters';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig';
import { useAuth } from '../../contexts/AuthContext';
import { getAllStations, getStationsByCity, findNearestStations } from '../../services/dataService';
import './HomePage.css';

// Log token availability for debugging
console.log("Mapbox token directly imported:", MAPBOX_TOKEN ? "Yes" : "No");

/**
 * HomePage Component:
 * A public landing page for the application.
 */
const HomePage = () => {
  // First initialize all hooks that don't depend on others
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  // Make completely sure refs are created first
  const profileRef = useRef(null);
  const aboutRef = useRef(null);
  const stationsRef = useRef(null);
  const howItWorksRef = useRef(null);
  
  // Then all state variables
  const [userLocation, setUserLocation] = useState(indianCities.pune);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [imageFallbackLevel, setImageFallbackLevel] = useState({});
  const [selectedCity, setSelectedCity] = useState('pune');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [locationFound, setLocationFound] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: indianCities.pune.lng,
    latitude: indianCities.pune.lat,
    zoom: 12,
    bearing: 0,
    pitch: 0
  });
  // Add state for popup visibility and stations data
  const [showPopup, setShowPopup] = useState(false);
  const [allStations, setAllStations] = useState([]);
  const [currentCityStations, setCurrentCityStations] = useState([]);

  // Common fallback image that's guaranteed to exist
  const commonFallbackImage = '/images/charging-stations/commonoimage.jpg';

  // Define city locations
  const cityLocations = {
    pune: indianCities.pune,
    delhi: indianCities.delhi,
    mumbai: indianCities.mumbai,
    bangalore: indianCities.bangalore,
    chennai: indianCities.chennai,
    hyderabad: indianCities.hyderabad
  };

  // Fetch all stations when component loads
  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoading(true);
        const stations = await getAllStations();
        setAllStations(stations);
        
        // Set current city stations
        const cityStations = await getStationsByCity(selectedCity);
        setCurrentCityStations(cityStations);
      } catch (error) {
        console.error('Error loading stations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStations();
  }, []);

  // Event handlers
  const handleCityChange = async (city) => {
    setSelectedCity(city);
    setUserLocation(cityLocations[city]);
    setSelectedStation(null);
    
    try {
      setLoading(true);
      // Get stations for the selected city
      const cityStations = await getStationsByCity(city);
      setCurrentCityStations(cityStations);
      
      // Update map view for the selected city
      setViewState({
        longitude: cityLocations[city].lng,
        latitude: cityLocations[city].lat,
        zoom: 12,
        bearing: 0,
        pitch: 0,
        transitionDuration: 1000 // Smooth animation
      });
    } catch (error) {
      console.error(`Error loading stations for ${city}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (stationId) => {
    // Track fallback level: 0=primary, 1=station fallback, 2=common fallback
    const currentLevel = imageFallbackLevel[stationId] || 0;

    if (currentLevel === 0) {
      // First error - try station's fallback image
      setImageFallbackLevel(prev => ({
        ...prev,
        [stationId]: 1,
      }));
    } else if (currentLevel === 1) {
      // Second error - use common fallback image
      setImageFallbackLevel(prev => ({
        ...prev,
        [stationId]: 2
      }));
      setImagesLoaded(prev => ({
        ...prev,
        [stationId]: 'common-fallback'
      }));
    }
  };

  const handleImageLoad = (stationId) => {
    setImagesLoaded(prev => ({
      ...prev,
      [stationId]: 'loaded'
    }));
  };

  const scrollToSection = (elementRef) => {
    if (elementRef && elementRef.current) {
      window.scrollTo({
        top: elementRef.current.offsetTop - 80, // Subtract header height
        behavior: 'smooth'
      });
    }
  };

  // Other handlers
  const handleJoinNow = () => {
    navigate('/signup');
  };

  const handleViewStations = () => {
    scrollToSection(stationsRef);
  };

  const handleBookNow = (stationId) => {
    if (currentUser) {
      // If user is logged in, navigate to booking page with station ID
      navigate(`/booking?stationId=${stationId}`);
    } else {
      // If not logged in, redirect to login page with return URL
      navigate(`/login?redirect=/booking&stationId=${stationId}`);
    }
  };

  const handleLocateOnMap = (station) => {
    setSelectedStation(station);
    setShowPopup(true); // Show popup when station is selected
    scrollToSection(stationsRef);
    
    // Update map view to focus on the selected station with animation
    if (station && station.latitude && station.longitude) {
      setUserLocation({
        lat: station.latitude,
        lng: station.longitude
      });
      
      // Update viewState to move map to station
      setViewState({
        longitude: station.longitude,
        latitude: station.latitude,
        zoom: 15, // Zoom in closer to the station
        bearing: 0,
        pitch: 0,
        transitionDuration: 1000 // Smooth animation (1 second)
      });
      
      // Highlight the station on the map
      const element = document.getElementById(`station-${station.id}`);
      if (element) {
        element.classList.add('highlight');
        setTimeout(() => {
          element.classList.remove('highlight');
        }, 2000);
      }
    }
  };
  
  const handleMarkerClick = (station) => {
    setSelectedStation(station);
    setShowPopup(true);
  };

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleProfileNavigation = (path) => {
    // Close the profile dropdown menu
    setProfileMenuOpen(false);
    
    // Special handling for dashboard based on user type
    if (path === '/dashboard') {
      // Check if user type exists in the currentUser object
      const userType = currentUser?.userType || currentUser?.type || 
                       localStorage.getItem('userType') || 'user';
      
      // Route to specific dashboard based on user type
      switch (userType.toLowerCase()) {
        case 'driver':
          navigate('/driver-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'operator':
          navigate('/operator-dashboard');
          break;
        case 'business':
          navigate('/business-dashboard');
          break;
        default:
          // Default to regular user dashboard
          navigate('/user-dashboard');
          break;
      }
    } else {
      // For non-dashboard routes, navigate normally
      navigate(path);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error("Failed to log out", error);
        alert("Logout failed. Please try again.");
      }
    }
  };

  const handleSocialLink = (platform) => {
    const socialUrls = {
      facebook: 'https://facebook.com/evchargingnetwork',
      twitter: 'https://twitter.com/evchargingnetwork',
      instagram: 'https://instagram.com/evchargingnetwork',
      linkedin: 'https://linkedin.com/company/evchargingnetwork'
    };
    
    if (socialUrls[platform]) {
      // Open in new tab with security best practices
      const newWindow = window.open();
      newWindow.opener = null;
      newWindow.location = socialUrls[platform];
    }
  };

  const handleViewDetails = (station) => {
    handleLocateOnMap(station);
    
    // Scroll to station card after map is updated
    setTimeout(() => {
      const stationElement = document.getElementById(`station-${station.id}`);
      if (stationElement) {
        stationElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  };

  // Click outside handler for profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Geolocation effect
  useEffect(() => {
    // Attempt to get user's location if they allow it
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userCoords);
          setLocationFound(true);
          
          // Update viewState with user location
          setViewState({
            longitude: userCoords.lng,
            latitude: userCoords.lat,
            zoom: 12,
            bearing: 0,
            pitch: 0
          });
          
          // Find closest city and auto-select it
          const cities = Object.entries(cityLocations);
          let closestCity = cities[0];
          let minDistance = calculateDistance(
            userCoords.lat, userCoords.lng,
            closestCity[1].lat, closestCity[1].lng
          );
          
          cities.forEach(([cityName, coords]) => {
            const dist = calculateDistance(
              userCoords.lat, userCoords.lng,
              coords.lat, coords.lng
            );
            if (dist < minDistance) {
              minDistance = dist;
              closestCity = [cityName, coords];
            }
          });
          
          // Update selected city based on user location
          handleCityChange(closestCity[0]);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Keep default Pune location
          setLocationFound(false);
        }
      );
    }
    setLoading(false);
  }, []);
  
  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  // Find nearest charging stations to user using our data service
  const getNearestStations = () => {
    if (!locationFound || !allStations?.length) return [];
    return findNearestStations(userLocation, allStations, 3);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="container header-container">
          <div 
            className="logo" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ cursor: 'pointer' }}
          >
            <span className="logo-text">EV Charging Network</span>
          </div>
          <div className="nav-links">
            <a 
              href="#about" 
              className="nav-item"
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(aboutRef); 
              }}
            >
              About
            </a>
            <a 
              href="#stations" 
              className="nav-item"
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(stationsRef); 
              }}
            >
              Stations
            </a>
            <a 
              href="#how-it-works" 
              className="nav-item"
              onClick={(e) => { 
                e.preventDefault(); 
                scrollToSection(howItWorksRef); 
              }}
            >
              How it Works
            </a>
            
            {/* Conditional rendering based on authentication status */}
            {currentUser ? (
              <div className="profile-menu-container" ref={profileRef}>
                <div 
                  className="profile-button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <div className="profile-avatar">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || "User"} 
                      />
                    ) : (
                      <div className="avatar-initials">
                        {currentUser.displayName ? currentUser.displayName[0] : "U"}
                      </div>
                    )}
                  </div>
                  <span className="profile-name">
                    {currentUser.displayName || currentUser.email || "User"}
                  </span>
                </div>
                
                {profileMenuOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <strong>
                        {currentUser.displayName || currentUser.email || "User"}
                      </strong>
                      <span className="profile-email">{currentUser.email}</span>
                    </div>
                    <div className="profile-dropdown-items">
                      <button onClick={() => handleProfileNavigation('/profile')}>
                        My Profile
                      </button>
                      <button onClick={() => handleProfileNavigation('/bookings')}>
                        My Bookings
                      </button>
                      <button onClick={() => handleProfileNavigation('/dashboard')}>
                        Dashboard
                      </button>
                      <button onClick={handleLogout} className="logout-button">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/signup" className="btn-signup">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-banner">
        <div className="container">
          <div className="hero-content">
            <h1>Find EV Charging Stations Near You</h1>
            <p>Discover convenient and reliable charging stations for your electric vehicle across Pune and beyond.</p>
            <div className="hero-cta">
              <button 
                onClick={handleJoinNow} 
                className="btn-primary"
              >
                Join Now
              </button>
              <button 
                onClick={handleViewStations}
                className="btn-secondary"
              >
                View Stations
              </button>
            </div>
            
            {/* Show nearest stations if user's location found */}
            {locationFound && (
              <div className="nearest-stations">
                <h3>Nearest Charging Stations to You</h3>
                <div className="nearest-stations-cards">
                  {getNearestStations()?.map(station => (
                    <div 
                      key={station.id} 
                      className="nearest-station-card"
                      onClick={() => handleLocateOnMap(station)}
                    >
                      <h4>{station.name}</h4>
                      <p>{station.distance.toFixed(1)} km away</p>
                      <button 
                        className="btn-view" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(station);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="about-section">
        <div className="container">
          <h2>India's Leading EV Charging Network</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🔌</div>
              <h3>Widespread Coverage</h3>
              <p>Access to thousands of charging points across major Indian cities.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <h3>Fast Charging</h3>
              <p>DC fast charging options to get you back on the road quickly.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📱</div>
              <h3>Easy Booking</h3>
              <p>Book and pay for charging sessions directly from your phone.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container main-content">
        {/* City Selector Section */}
        <div className="city-selector">
          <h3>Select a City</h3>
          <div className="cities-grid">
            {Object.entries(cityLocations).map(([city, coords]) => (
              <div 
                key={city}
                className={`city-option ${selectedCity === city ? 'active' : ''}`}
                onClick={() => handleCityChange(city)}
              >
                <div className="city-icon">
                  {city === 'pune' && '🏙️'}
                  {city === 'delhi' && '🏛️'}
                  {city === 'mumbai' && '🌊'}
                  {city === 'bangalore' && '💻'}
                  {city === 'chennai' && '🌴'}
                  {city === 'hyderabad' && '🏯'}
                </div>
                <div className="city-name">
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <section id="stations" ref={stationsRef} className="map-section">
          <div className="container">
            <h2>EV Charging Stations in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h2>
            <p className="section-intro">Below is a map of available charging stations. Click on any marker to see details.</p>
            
            {/* Map container with explicit styling */}
            <div 
              className="map-container" 
              id="map-container"
            >
              {!loading && (
                <>
                  {!MAPBOX_TOKEN && (
                    <h3 style={{textAlign: 'center', marginTop: '20px'}}>
                      Mapbox token not found. Please add your token to the .env file.
                    </h3>
                  )}
                  {MAPBOX_TOKEN && !loading && (
                    <Map
                      mapboxAccessToken={MAPBOX_TOKEN}
                      {...viewState}
                      onMove={evt => setViewState(evt.viewState)}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/streets-v11"
                    >
                      <NavigationControl position="top-right" />
                      
                      {/* Add markers for charging stations with null check */}
                      {currentCityStations?.map(station => (
                        <Marker 
                          key={station.id}
                          longitude={station.longitude}
                          latitude={station.latitude}
                          anchor="bottom"
                          onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            handleMarkerClick(station);
                          }}
                        >
                          <div className="map-marker" style={{ 
                            cursor: 'pointer',
                            color: selectedStation && selectedStation.id === station.id ? '#ff6b6b' : '#4a90e2'
                          }}>
                            <div style={{ 
                              fontSize: '24px', 
                              filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' 
                            }}>
                              📍
                            </div>
                          </div>
                        </Marker>
                      ))}
                      
                      {/* Add popup for selected station */}
                      {selectedStation && showPopup && (
                        <Popup
                          longitude={selectedStation.longitude}
                          latitude={selectedStation.latitude}
                          anchor="bottom"
                          onClose={() => setShowPopup(false)}
                          closeOnClick={false}
                          className="station-popup"
                          style={{ maxWidth: '300px' }}
                        >
                          <div className="popup-content">
                            <h3>{selectedStation.name}</h3>
                            <div className="popup-rating">
                              <span>★</span> {selectedStation.rating}
                            </div>
                            <p className="popup-address">{selectedStation.address}</p>
                            <div className="popup-details">
                              <p><strong>Type:</strong> {selectedStation.type}</p>
                              <p><strong>Power:</strong> {selectedStation.power} kW</p>
                              <p><strong>Price:</strong> ₹{selectedStation.pricePerKwh}/kWh</p>
                              <p><strong>Hours:</strong> {selectedStation.hours}</p>
                            </div>
                            <div className="popup-actions">
                              <button 
                                onClick={() => handleBookNow(selectedStation.id)} 
                                className="popup-btn-book"
                              >
                                Book Now
                              </button>
                              <button 
                                onClick={() => {
                                  setShowPopup(false);
                                  const element = document.getElementById(`station-${selectedStation.id}`);
                                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                                }} 
                                className="popup-btn-details"
                              >
                                More Details
                              </button>
                            </div>
                          </div>
                        </Popup>
                      )}
                    </Map>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Stations List Section */}
        <section className="stations-list-section">
          <div className="container">
            <h2>Charging Stations in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h2>
            <div className="stations-grid">
              {currentCityStations?.map(station => (
                <div key={station.id} id={`station-${station.id}`} className="station-card">
                  <div className="station-image">
                    {/* Image with enhanced fallback strategy */}
                    <img 
                      src={
                        imageFallbackLevel[station.id] === 0 ? station.image : 
                        imageFallbackLevel[station.id] === 1 ? station.fallbackImage : 
                        commonFallbackImage
                      }
                      alt={station.name}
                      onError={() => handleImageError(station.id)}
                      onLoad={() => handleImageLoad(station.id)}
                      loading="lazy"
                    />
                    {!imagesLoaded[station.id] && (
                      <div className="image-loader">
                        <div className="spinner"></div>
                      </div>
                    )}
                    <div className="station-rating">
                      <span className="star-icon">★</span>
                      <span>{station.rating}</span>
                    </div>
                  </div>
                  <div className="station-content">
                    <h3>{station.name}</h3>
                    <p className="address">{station.address}</p>
                    <div className="station-details">
                      <div className="detail">
                        <span className="detail-label">Charger Type:</span>
                        <span className="detail-value">{station.type}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Power Output:</span>
                        <span className="detail-value">{station.power} kW</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value">₹{station.pricePerKwh}/kWh</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Hours:</span>
                        <span className="detail-value">{station.hours}</span>
                      </div>
                    </div>
                    <div className="connectors">
                      <span className="detail-label">Connectors:</span>
                      <div className="connector-tags">
                        {station.connectorTypes?.map((connector, idx) => (
                          <span key={idx} className="connector-tag">{connector}</span>
                        )) || <span>Not available</span>}
                      </div>
                    </div>
                    <div className="station-amenities">
                      <span className="detail-label">Amenities:</span>
                      <div className="amenity-tags">
                        {station.amenities?.map((amenity, idx) => (
                          <span key={idx} className="amenity-tag">{amenity}</span>
                        )) || <span>Not available</span>}
                      </div>
                    </div>
                    <div className="station-cta">
                      <button 
                        onClick={() => handleBookNow(station.id)} 
                        className="btn-book"
                      >
                        Book Now
                      </button>
                      <button 
                        onClick={() => handleLocateOnMap(station)} 
                        className="btn-locate"
                      >
                        Locate on Map
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" ref={howItWorksRef} className="how-it-works">
          <div className="container">
            <h2>How It Works</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Sign Up</h3>
                <p>Create a free account in seconds and set up your EV vehicle details.</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Find Stations</h3>
                <p>Discover charging stations near you with real-time availability.</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Book & Charge</h3>
                <p>Reserve your slot and charge your vehicle hassle-free.</p>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <h3>Pay Seamlessly</h3>
                <p>Pay securely through the app using multiple payment options.</p>
              </div>
            </div>
            <div className="cta-container">
              <button 
                onClick={handleGetStarted} 
                className="btn-large"
              >
                Get Started Today
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-columns">
              <div className="footer-column">
                <h3>EV Charging Network</h3>
                <p>India's premier EV charging network empowering electric mobility across the country.</p>
              </div>
              <div className="footer-column">
                <h4>Quick Links</h4>
                <ul>
                  <li><a href="#about">About</a></li>
                  <li><a href="#stations">Charging Stations</a></li>
                  <li><a href="#how-it-works">How It Works</a></li>
                  <li><Link to="/login">Login</Link></li>
                  <li><Link to="/signup">Sign Up</Link></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Contact</h4>
                <ul className="contact-info">
                  <li>Email: info@evchargingnetwork.in</li>
                  <li>Phone: +91 1234567890</li>
                  <li>Address: Pune, Maharashtra, India</li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Connect with Us</h4>
                <div className="social-links">
                  <button 
                    onClick={() => handleSocialLink('facebook')}
                    className="social-link"
                  >
                    Facebook
                  </button>
                  <button 
                    onClick={() => handleSocialLink('twitter')}
                    className="social-link"
                  >
                    Twitter
                  </button>
                  <button 
                    onClick={() => handleSocialLink('instagram')}
                    className="social-link"
                  >
                    Instagram
                  </button>
                  <button 
                    onClick={() => handleSocialLink('linkedin')}
                    className="social-link"
                  >
                    LinkedIn
                  </button>
                </div>
              </div>
            </div>
            <div className="copyright">
              <p>© 2023 EV Charging Network. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
