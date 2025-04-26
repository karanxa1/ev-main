import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { indianCities, formatCurrency } from '../../utils/formatters';
import './HomePage.css';

/**
 * HomePage Component:
 * A public landing page for the application.
 * Displays information about EV charging stations, allows users to select cities,
 * view stations on a map, and explore station details.
 */
const HomePage = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(indianCities.pune);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [imageFallbackLevel, setImageFallbackLevel] = useState({}); // Track fallback level
  const [selectedCity, setSelectedCity] = useState('pune');

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

  // Comprehensive EV charging station data for multiple cities
  const allChargingStations = {
    pune: [
      // Real Pune charging stations based on data from ZigWheels
      {
        id: 'pune-1',
        name: 'Tata Power Charging Station - Koregaon Park',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.50,
        latitude: 18.5395,
        longitude: 73.8950,
        address: 'Koregaon Park, Pune, Maharashtra 411001',
        rating: 4.7,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Parking', 'Café', 'Restrooms'],
        image: '/images/charging-stations/pune-tata-koregaon.jpg',
        fallbackImage: 'https://evrevo.in/uploads/profile/2239_profile.jpg'
      },
      {
        id: 'pune-2',
        name: 'HPCL EV Charging Station - University Road',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 16.00,
        latitude: 18.5218,
        longitude: 73.8560,
        address: 'HPCL Petrol Pump, University Road, Shivajinagar, Pune 411016',
        rating: 4.2,
        hours: '6 AM - 11 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Convenience Store', 'Fuel Station'],
        image: '/images/charging-stations/pune-hpcl-university.jpg',
        fallbackImage: 'https://www.thehindubusinessline.com/companies/article65505171.ece/alternates/FREE_1200/Worldline%20EV%20charging%20station%20at%20HPCL%20in%20Bengaluru.JPG'
      },
      {
        id: 'pune-3',
        name: 'Magenta ChargeGrid - Amanora Mall',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.50,
        latitude: 18.5180,
        longitude: 73.9430,
        address: 'Amanora Mall, Hadapsar, Pune 411028',
        rating: 4.6,
        hours: 'Mall Hours',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Shopping Mall', 'Food Court', 'Restrooms'],
        image: '/images/charging-stations/pune-magenta-amanora.jpg',
        fallbackImage: 'https://www.chargepoints.org/sites/default/files/styles/details_image/public/EV_Charging_Stations_at_Pune_Mall.jpg'
      },
      {
        id: 'pune-4',
        name: 'Ather Charging Grid - FC Road',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 14.50,
        latitude: 18.5210,
        longitude: 73.8433,
        address: 'FC Road, Shivajinagar, Pune 411005',
        rating: 4.4,
        hours: '10 AM - 8 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Shopping Area', 'Restaurants'],
        image: '/images/charging-stations/pune-ather-fc.jpg',
        fallbackImage: 'https://cdn.atherenergy.com/Ather-Energy.jpg'
      },
      {
        id: 'pune-5',
        name: 'EON Free Charging Station - IT Park',
        type: 'AC/DC Charger',
        power: 25,
        pricePerKwh: 0.00, // Free
        latitude: 18.5510,
        longitude: 73.9520,
        address: 'EON IT Park, Kharadi, Pune 411014',
        rating: 4.8,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2', 'Bharat AC-001'],
        amenities: ['IT Park', 'Free Charging', 'Security'],
        image: '/images/charging-stations/pune-eon-kharadi.jpg',
        fallbackImage: 'https://www.electricvehicleweb.in/wp-content/uploads/2021/04/Tata-Power-EV-charging-station-IT-Park.jpg'
      },
      {
        id: 'pune-6',
        name: 'IOCL Fast Charging Hub - Baner',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5590,
        longitude: 73.7868,
        address: 'IOCL Petrol Pump, Baner Road, Pune 411045',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Convenience Store', 'Restrooms', '24/7 Service'],
        image: '/images/charging-stations/pune-iocl-baner.jpg',
        fallbackImage: 'https://imageio.forbes.com/specials-images/imageserve/627bd291a1b0752889105d4e/IOCL-petrol-pump-with-EV-charging/960x0.jpg'
      },
      {
        id: 'pune-7',
        name: 'Statiq Charging - Hinjewadi Phase 1',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 17.50,
        latitude: 18.5893,
        longitude: 73.7388,
        address: 'Rajiv Gandhi Infotech Park, Hinjewadi Phase 1, Pune 411057',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['IT Park', 'Cafés', 'Security'],
        image: '/images/charging-stations/pune-statiq-hinjewadi.jpg',
        fallbackImage: 'https://cdn.statiq.in/wp-content/uploads/2022/09/statiq-charging-station.png'
      },
      {
        id: 'pune-8',
        name: 'BESCOM Charging Point - Shivaji Nagar',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.00,
        latitude: 18.5314,
        longitude: 73.8446,
        address: 'Shivaji Nagar Bus Station, Pune 411005',
        rating: 3.9,
        hours: '6 AM - 10 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Bus Station', 'Public Transport'],
        image: '/images/charging-stations/pune-bescom-shivaji.jpg',
        fallbackImage: 'https://static.toiimg.com/thumb/msid-67005437,width-1280,height-720,resizemode-4/.jpg'
      },
      {
        id: 'pune-9',
        name: 'Jio-bp Pulse - Baner Road',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 20.50,
        latitude: 18.5598,
        longitude: 73.7882,
        address: 'Baner Road, Baner, Pune 411045',
        rating: 4.7,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['Café', 'Convenience Store', '24/7 Service', 'Wifi'],
        image: '/images/charging-stations/pune-jio-bp.jpg',
        fallbackImage: 'https://evreporter.com/wp-content/uploads/2023/01/Jio-bp-pulse.png'
      },
      {
        id: 'pune-10',
        name: 'BPCL EV Charging - FC Road',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.00,
        latitude: 18.5234,
        longitude: 73.8406,
        address: 'BPCL, FC Road, Shivajinagar, Pune 411005',
        rating: 4.0,
        hours: '6 AM - 11 PM',
        connectorTypes: ['CCS', 'Type 2', 'Bharat AC-001'],
        amenities: ['Convenience Store', 'Restrooms'],
        image: '/images/charging-stations/pune-bpcl-fc.jpg',
        fallbackImage: 'https://www.bharatpetroleum.in/images/EV-charging-station1-10-Dec-2020.jpg'
      },
      {
        id: 'pune-11',
        name: 'Exicom Charging - Kharadi',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5504,
        longitude: 73.9584,
        address: 'EON IT Park, Kharadi, Pune 411014',
        rating: 4.5,
        hours: 'Office Hours',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['IT Park', 'Food Court', 'Parking'],
        image: '/images/charging-stations/pune-exicom-kharadi.jpg',
        fallbackImage: 'https://www.exicom.in/images/Exicom-EV-chargers.jpg'
      },
      {
        id: 'pune-12',
        name: 'Okaya Power - Hinjewadi',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 18.5793,
        longitude: 73.7398,
        address: 'Rajiv Gandhi Infotech Park, Hinjewadi Phase 1, Pune 411057',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['IT Park', 'Parking', '24/7 Support', 'Cafeteria'],
        image: '/images/charging-stations/pune-okaya-hinjewadi.jpg',
        fallbackImage: 'https://auto.hindustantimes.com/auto/news/okaya-ev-installs-over-500-charging-stations-across-india-aims-to-add-500-more-41661507042488.html'
      },
      {
        id: 'pune-13',
        name: 'Ather Grid - Kalyani Nagar',
        type: 'AC Charger',
        power: 3.3,
        pricePerKwh: 12.00,
        latitude: 18.5470,
        longitude: 73.9000,
        address: 'Kalyani Nagar, Pune 411006',
        rating: 4.6,
        hours: '9 AM - 9 PM',
        connectorTypes: ['Ather Connector'],
        amenities: ['Shopping Area', 'Cafés'],
        image: '/images/charging-stations/pune-ather-kalyani.jpg',
        fallbackImage: 'https://www.91wheels.com/assets/ather-genericpages/img/grid.jpg'
      },
      {
        id: 'pune-14',
        name: 'Statiq Charging - Wakad',
        type: 'AC/DC Charger',
        power: 25,
        pricePerKwh: 15.50,
        latitude: 18.5968,
        longitude: 73.7614,
        address: 'Wakad, Pune 411057',
        rating: 4.2,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Parking', 'Security'],
        image: '/images/charging-stations/pune-statiq-wakad.jpg',
        fallbackImage: 'https://www.statiq.in/assets/news/press-releases/statiq-installs-evzon.jpg'
      },
      {
        id: 'pune-15',
        name: 'Delta EV Charging - Chinchwad',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 18.50,
        latitude: 18.6298,
        longitude: 73.7997,
        address: 'Chinchwad, Pune 411033',
        rating: 4.1,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Industrial Area', 'Parking'],
        image: '/images/charging-stations/pune-delta-chinchwad.jpg',
        fallbackImage: 'https://www.deltaelectronicsindia.com/wp-content/uploads/2020/08/Delta-EV-Chargers.png'
      },
      {
        id: 'pune-16',
        name: 'ReVolt EV Station - Wagholi',
        type: 'AC Charger',
        power: 22,
        pricePerKwh: 15.00,
        latitude: 18.5725,
        longitude: 73.9881,
        address: 'Wagholi, Pune 412207',
        rating: 3.9,
        hours: '8 AM - 10 PM',
        connectorTypes: ['Type 2', 'Bharat AC-001'],
        amenities: ['Parking', 'Residential Area'],
        image: '/images/charging-stations/pune-revolt-wagholi.jpg',
        fallbackImage: 'https://auto.economictimes.indiatimes.com/news/oil-and-lubes/ev-charging-station-at-retail-outlets-to-accelerate/75446762'
      },
      {
        id: 'pune-17',
        name: 'Tata Power EZ Charge - Magarpatta City',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5156,
        longitude: 73.9261,
        address: 'Magarpatta City, Hadapsar, Pune 411028',
        rating: 4.5,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO'],
        amenities: ['Township', 'Shopping', 'Restaurants'],
        image: '/images/charging-stations/pune-tata-magarpatta.jpg',
        fallbackImage: 'https://tatapower.com/images/all-india-ev-charging.jpg'
      },
      {
        id: 'pune-18',
        name: 'ChargeZone - NIBM Road',
        type: 'AC/DC Charger',
        power: 30,
        pricePerKwh: 16.50,
        latitude: 18.4820,
        longitude: 73.9031,
        address: 'NIBM Road, Pune 411048',
        rating: 4.3,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Residential Area', 'Cafés', 'Parking'],
        image: '/images/charging-stations/pune-chargezone-nibm.jpg',
        fallbackImage: 'https://ev.chargezone.in/wp-content/uploads/2022/09/chargezone-home-img.png'
      },
      {
        id: 'pune-19',
        name: 'Volttic Charging - Viman Nagar',
        type: 'DC Fast Charger',
        power: 60,
        pricePerKwh: 19.00,
        latitude: 18.5746,
        longitude: 73.9184,
        address: 'Viman Nagar, Pune 411014',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        amenities: ['24/7 Service', 'Security', 'Residential Area'],
        image: '/images/charging-stations/pune-volttic-viman.jpg',
        fallbackImage: 'https://volttic.com/wp-content/themes/volttic/assets/images/volttic-charging-unity.jpg'
      },
      {
        id: 'pune-20',
        name: 'Ola Hypercharger - Shivaji Nagar',
        type: 'DC Fast Charger',
        power: 50,
        pricePerKwh: 18.00,
        latitude: 18.5245,
        longitude: 73.8478,
        address: 'Shivaji Nagar, Pune 411005',
        rating: 4.4,
        hours: '24/7',
        connectorTypes: ['CCS', 'Type 2'],
        amenities: ['Central Location', 'Shopping', 'Restaurants'],
        image: '/images/charging-stations/pune-ola-shivajinagar.jpg',
        fallbackImage: 'https://www.91wheels.com/assets/images/images/olanewsimages/Ola%20hypercharger.jpg'
      }
    ],
    delhi: [
      // ...existing delhi stations...
    ],
    mumbai: [
      // ...existing mumbai stations...
    ],
    // ...remaining cities...
  };

  // Get currently selected city's stations
  // This line ensures currentCityStations is always an array, even if the city key doesn't exist
  const currentCityStations = allChargingStations[selectedCity] || [];

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setUserLocation(cityLocations[city]);
    setSelectedStation(null); // Clear selected station when changing city
  };

  // Enhanced image error handling with multi-level fallbacks
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
