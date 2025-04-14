import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { indianCities, formatCurrency } from '../../utils/formatters';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(indianCities.pune);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [selectedCity, setSelectedCity] = useState('pune');

  // Define city locations
  const cityLocations = {
    pune: indianCities.pune,
    delhi: indianCities.delhi,
    mumbai: indianCities.mumbai,
    bangalore: indianCities.bangalore,
    chennai: indianCities.chennai,
    hyderabad: indianCities.hyderabad
  };

  // Comprehensive EV charging station data for multiple cities
  const allChargingStations = {
    pune: [
      {
        id: '1',
        name: 'Tata Power Charging Station - Phoenix Mall',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.50,
        latitude: 18.5619,
        longitude: 73.9180,
        address: 'Phoenix Marketcity, Viman Nagar, Pune, Maharashtra 411014',
        rating: 4.6,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Parking', 'Shopping Mall', 'Food Court'],
        image: '/images/charging-stations/tata-power.jpg',
        // Backup external URL as fallback
        fallbackImage: 'https://images.livemint.com/img/2021/07/03/1600x900/EV_charging_1625297278612_1625297287152.PNG'
      },
      {
        id: '2',
        name: 'HPCL EV Charging Station',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.00,
        latitude: 18.5074,
        longitude: 73.8077,
        address: 'HPCL Petrol Pump, Deccan Gymkhana, Pune, Maharashtra 411004',
        rating: 4.1,
        hours: '7 AM - 10 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Convenience Store', 'Restrooms'],
        image: '/images/charging-stations/hpcl.jpg',
        fallbackImage: 'https://www.hindustanpetroleum.com/documents/2475722/0/NAVI+MUMBAI+POKHRAN+ROAD.jpg/618c5aea-757a-535c-919a-1202ee645bcc?t=1631096435916'
      },
      {
        id: '3',
        name: 'Magenta ChargeGrid - Amanora Mall',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.50,
        latitude: 18.5180,
        longitude: 73.9430,
        address: 'Amanora Town Centre, Hadapsar, Pune, Maharashtra 411028',
        rating: 4.8,
        hours: 'Mall Hours',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Parking', 'Shopping Mall', 'Food Court', 'Restrooms'],
        image: 'https://img.etimg.com/thumb/msid-97499256,width-1200,height-900,imgsize-51760,overlay-economictimes/photo.jpg'
      },
      {
        id: '4',
        name: 'Ather Charging Station - Koregaon Park',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 12.00,
        latitude: 18.5362,
        longitude: 73.8914,
        address: 'North Main Road, Koregaon Park, Pune, Maharashtra 411001',
        rating: 4.4,
        hours: '9 AM - 8 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Café Nearby', 'Shopping Area'],
        image: 'https://cdn.eetgroup.com/img/live/news/pulse/2021/10/cwksae-ather-energy-opens-its-first-experience-center-in-koregaon-park-pune.jpg'
      },
      {
        id: '5',
        name: 'IOCL Fast EV Charging Point',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 17.50,
        latitude: 18.4529,
        longitude: 73.8652,
        address: 'IOCL Petrol Pump, Sinhagad Road, Pune, Maharashtra 411041',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Convenience Store', 'Restrooms', '24/7 Service'],
        image: 'https://theevreporter.com/wp-content/uploads/2021/09/IndianOil-Charging-Station-Bangalore.jpeg'
      }
    ],
    delhi: [
      {
        id: 'delhi1',
        name: 'EESL Charging Station - Connaught Place',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 28.6304,
        longitude: 77.2177,
        address: 'Connaught Place, New Delhi, Delhi 110001',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Shopping Area', 'Restaurants', 'Metro Access'],
        fallbackImage: 'https://i.ytimg.com/vi/xH1vgFtckA8/maxresdefault.jpg'
      },
      {
        id: 'delhi2',
        name: 'BSES EV Charging Hub',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.00,
        latitude: 28.5921,
        longitude: 77.2290,
        address: 'Nehru Place, New Delhi, Delhi 110019',
        rating: 4.2,
        hours: '6 AM - 10 PM',
        connectorTypes: ['Type 2', 'Bharat AC'],
        amenities: ['Parking', 'Market Nearby'],
        fallbackImage: 'https://static.toiimg.com/thumb/msid-86431060,width-1280,height-720,resizemode-4/.jpg'
      },
      {
        id: 'delhi3',
        name: 'Fortum Charge & Drive - Select Citywalk',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 28.5285,
        longitude: 77.2187,
        address: 'Select Citywalk Mall, Saket, New Delhi, Delhi 110017',
        rating: 4.7,
        hours: 'Mall Hours',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Mall', 'Food Court', 'Cinema'],
        fallbackImage: 'https://akm-img-a-in.tosshub.com/businesstoday/images/story/202306/1687518850-charging-sixteen_nine.jpg'
      }
    ],
    mumbai: [
      {
        id: 'mumbai1',
        name: 'Tata Power EZ Charge - BKC',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 21.00,
        latitude: 19.0612,
        longitude: 72.8637,
        address: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
        rating: 4.6,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Business District', 'Restaurants'],
        fallbackImage: 'https://auto.hindustantimes.com/auto/ev/tata-power-to-install-300-fast-charging-stations-for-evs-across-indian-cities-in-fy23-41658220532308.html'
      },
      {
        id: 'mumbai2',
        name: 'Adani Electricity Charging Point',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 17.00,
        latitude: 19.0190,
        longitude: 72.8270,
        address: 'Worli, Mumbai, Maharashtra 400018',
        rating: 4.3,
        hours: '7 AM - 11 PM',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Sea-facing', 'Cafes Nearby'],
        fallbackImage: 'https://static.toiimg.com/thumb/msid-80124959,width-1280,height-720,resizemode-4/.jpg'
      }
    ],
    bangalore: [
      {
        id: 'blr1',
        name: 'Ather Grid - Indiranagar',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 14.50,
        latitude: 12.9784,
        longitude: 77.6408,
        address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
        rating: 4.8,
        hours: '9 AM - 9 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Cafe', 'Shopping Area'],
        fallbackImage: 'https://images.financialexpress.com/2021/08/Ather-Grid.jpg'
      },
      {
        id: 'blr2',
        name: 'BESCOM EV Charging Station',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'Cubbon Park, Bengaluru, Karnataka 560001',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Park', 'Government Offices'],
        fallbackImage: 'https://cdn.zeebiz.com/sites/default/files/2021/02/19/143034-ev-pti.jpg'
      }
    ],
    chennai: [
      {
        id: 'chen1',
        name: 'AARGO EV Charging Hub',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 18.50,
        latitude: 13.0827,
        longitude: 80.2707,
        address: 'Anna Salai, Chennai, Tamil Nadu 600002',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Central Location', '24/7 Support'],
        fallbackImage: 'https://img.etimg.com/thumb/width-1200,height-900,imgsize-128694,resizemode-75,msid-100238243/industry/renewables/electric-vehicles/indias-first-fast-charger-for-electric-vehicles-installed-in-nagpur.jpg'
      }
    ],
    hyderabad: [
      {
        id: 'hyd1',
        name: 'PowerGrid Fast Charging Station',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 17.4399,
        longitude: 78.4983,
        address: 'HITEC City, Hyderabad, Telangana 500081',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['IT Park', 'Restaurants', '24/7 Support'],
        fallbackImage: 'https://electricvehicles.in/wp-content/uploads/2019/07/Fortum-India-EV-Charging-Station.jpg'
      }
    ]
  };

  // Get currently selected city's stations
  const currentCityStations = allChargingStations[selectedCity] || [];

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setUserLocation(cityLocations[city]);
    setSelectedStation(null); // Clear selected station when changing city
  };

  // Handle image loading errors
  const handleImageError = (stationId) => {
    setImagesLoaded(prev => ({
      ...prev,
      [stationId]: 'error'
    }));
  };

  const handleImageLoad = (stationId) => {
    setImagesLoaded(prev => ({
      ...prev,
      [stationId]: 'loaded'
    }));
  };

  useEffect(() => {
    // Attempt to get user's location if they allow it
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Keep default Pune location
        }
      );
    }
    setLoading(false);
  }, []);

  return (
    <div className="home-page">
      {/* Hero Header with Navigation */}
      <header className="home-header">
        <div className="container header-container">
          <div className="logo">
            <span className="logo-text">EV Charging Network</span>
          </div>
          <div className="nav-links">
            <a href="#about" className="nav-item">About</a>
            <a href="#stations" className="nav-item">Stations</a>
            <a href="#how-it-works" className="nav-item">How it Works</a>
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">Sign Up</Link>
            </div>
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
              <button onClick={() => navigate('/signup')} className="btn-primary">Join Now</button>
              <a href="#stations" className="btn-secondary">View Stations</a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
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
        {/* New City Selector Section */}
        <div className="city-selector">
          <h3>Select a City</h3>
          <div className="cities-grid">
            <div 
              className={`city-option ${selectedCity === 'pune' ? 'active' : ''}`}
              onClick={() => handleCityChange('pune')}
            >
              <div className="city-icon">🏙️</div>
              <div className="city-name">Pune</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'delhi' ? 'active' : ''}`}
              onClick={() => handleCityChange('delhi')}
            >
              <div className="city-icon">🏛️</div>
              <div className="city-name">Delhi</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'mumbai' ? 'active' : ''}`}
              onClick={() => handleCityChange('mumbai')}
            >
              <div className="city-icon">🌊</div>
              <div className="city-name">Mumbai</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'bangalore' ? 'active' : ''}`}
              onClick={() => handleCityChange('bangalore')}
            >
              <div className="city-icon">💻</div>
              <div className="city-name">Bangalore</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'chennai' ? 'active' : ''}`}
              onClick={() => handleCityChange('chennai')}
            >
              <div className="city-icon">🌴</div>
              <div className="city-name">Chennai</div>
            </div>
            <div 
              className={`city-option ${selectedCity === 'hyderabad' ? 'active' : ''}`}
              onClick={() => handleCityChange('hyderabad')}
            >
              <div className="city-icon">🏯</div>
              <div className="city-name">Hyderabad</div>
            </div>
          </div>
        </div>

        {/* Update the Map Section Title */}
        <section id="stations" className="map-section">
          <div className="container">
            <h2>EV Charging Stations in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h2>
            <p className="section-intro">Below is a map of available charging stations. Click on any marker to see details.</p>
            
            <div className="map-container">
              {!loading && (
                <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={{ height: '500px', width: '100%' }}
                    center={userLocation}
                    zoom={12}
                    options={{
                      styles: mapStyles,
                      disableDefaultUI: false,
                      zoomControl: true
                    }}
                  >
                    {/* User location marker */}
                    <Marker
                      position={userLocation}
                      icon={{
                        path: 0, // Circle
                        scale: 7,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF'
                      }}
                    />

                    {/* Station markers for current selected city */}
                    {currentCityStations.map(station => (
                      <Marker
                        key={station.id}
                        position={{ lat: station.latitude, lng: station.longitude }}
                        onClick={() => setSelectedStation(station)}
                        icon={{
                          path: 0, // Circle
                          scale: 7,
                          fillColor: '#0C5F2C',
                          fillOpacity: 1,
                          strokeWeight: 2,
                          strokeColor: '#FFFFFF'
                        }}
                      />
                    ))}

                    {/* Info Window for selected station */}
                    {selectedStation && (
                      <InfoWindow
                        position={{ 
                          lat: selectedStation.latitude, 
                          lng: selectedStation.longitude 
                        }}
                        onCloseClick={() => setSelectedStation(null)}
                      >
                        <div className="station-infowindow">
                          <h3>{selectedStation.name}</h3>
                          <p className="address">{selectedStation.address}</p>
                          <div className="info-details">
                            <p>Type: {selectedStation.type}</p>
                            <p>Power: {selectedStation.power} kW</p>
                            <p>Price: ₹{selectedStation.pricePerKwh}/kWh</p>
                          </div>
                          <button 
                            onClick={() => {
                              const element = document.getElementById(`station-${selectedStation.id}`);
                              element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            See Details
                          </button>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              )}
            </div>
          </div>
        </section>

        {/* Update Stations List Section */}
        <section className="stations-list-section">
          <div className="container">
            <h2>Charging Stations in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h2>
            <div className="stations-grid">
              {currentCityStations.map(station => (
                <div key={station.id} id={`station-${station.id}`} className="station-card">
                  <div className="station-image">
                    {/* Image with loading state and fallback */}
                    <img 
                      src={imagesLoaded[station.id] === 'error' ? station.fallbackImage : station.image}
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
                        {station.connectorTypes.map((connector, idx) => (
                          <span key={idx} className="connector-tag">{connector}</span>
                        ))}
                      </div>
                    </div>
                    <div className="station-amenities">
                      <span className="detail-label">Amenities:</span>
                      <div className="amenity-tags">
                        {station.amenities.map((amenity, idx) => (
                          <span key={idx} className="amenity-tag">{amenity}</span>
                        ))}
                      </div>
                    </div>
                    <div className="station-cta">
                      <button onClick={() => navigate('/login')} className="btn-book">Book Now</button>
                      <button onClick={() => {
                        setSelectedStation(station);
                        const mapSection = document.getElementById('stations');
                        mapSection?.scrollIntoView({ behavior: 'smooth' });
                      }} className="btn-locate">Locate on Map</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works">
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
              <Link to="/signup" className="btn-large">Get Started Today</Link>
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
                  <a href="#" className="social-link">Facebook</a>
                  <a href="#" className="social-link">Twitter</a>
                  <a href="#" className="social-link">Instagram</a>
                  <a href="#" className="social-link">LinkedIn</a>
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

// Custom map styles (subtle styling for the map)
const mapStyles = [
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "water",
    stylers: [{ color: "#e9e9e9" }]
  }
];

export default HomePage;
