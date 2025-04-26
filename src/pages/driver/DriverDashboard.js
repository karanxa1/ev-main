import React, { useState, useEffect, useCallback } from 'react';
import { LoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useAuth } from '../../contexts/AuthContext';
import { fetchNearbyChargers } from '../../services/firebase/firestore';
import ChargerDetails from '../../components/driver/ChargerDetails';
import BookingModal from '../../components/driver/BookingModal';
import ChargerFilter from '../../components/driver/ChargerFilter';
import { indianCities, formatCurrency } from '../../utils/formatters';
import './DriverDashboard.css';

/**
 * DriverDashboard Component:
 * The main dashboard for EV drivers to find and book charging stations.
 * 
 * Features:
 * - Displays a map with nearby charging stations.
 * - Allows filtering of charging stations based on various criteria.
 * - Provides details of selected charging stations.
 * - Enables booking of charging slots.
 */
const DriverDashboard = () => {
  const { logout, currentUser } = useAuth();
  const [chargers, setChargers] = useState([]);
  const [filteredChargers, setFilteredChargers] = useState([]);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [userLocation, setUserLocation] = useState(indianCities.delhi); // Default to Delhi
  const [loading, setLoading] = useState(true);
  const [searchAddress, setSearchAddress] = useState('');
  const [infoWindowData, setInfoWindowData] = useState(null);
  const [vehicleType, setVehicleType] = useState('4-wheeler'); // Default to 4-wheeler
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

  // Google Maps API key from environment variable
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

  const handleMapLoad = useCallback(map => {
    setMapLoaded(true);
    setMapLoadError(false);
  }, []);
  
  const handleMapLoadError = useCallback(error => {
    console.error('Google Maps loading error:', error);
    setMapLoadError(true);
    setLoading(false);
  }, []);
  
  // Get user's location with error handling for deployed environments
  useEffect(() => {
    // Check if the protocol is secure (required for geolocation in production)
    const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
                      
    if (navigator.geolocation && isSecure) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Keep default location in case of error
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else if (!isSecure) {
      console.warn('Geolocation requires HTTPS in production environments');
      // Keep default location for non-secure contexts
    }
  }, []);
  
  // Fetch chargers based on location
  useEffect(() => {
    const loadChargers = async () => {
      try {
        setLoading(true);
        // This will be replaced with actual Firestore fetching
        // const nearbyChargers = await fetchNearbyChargers(userLocation, 50); // 50km radius
        
        // For now, use mock data
        const mockChargers = [
          {
            id: '1',
            name: 'MG Road Fast Charger',
            type: 'Type 2',
            power: 22,
            pricePerKwh: 15.00,
            availability: true,
            latitude: indianCities.delhi.lat + 0.01,
            longitude: indianCities.delhi.lng + 0.01,
            address: '42 MG Road, Connaught Place, Delhi',
            hostName: 'Sharma Electric',
            rating: 4.5,
            photos: ['https://via.placeholder.com/150'],
            plugType: 'Type 2',
            amenities: ['Parking', 'Chai/Coffee', 'Wifi']
          },
          {
            id: '2',
            name: 'Metro Station Charger',
            type: 'CCS',
            power: 50,
            pricePerKwh: 18.50,
            availability: true,
            latitude: indianCities.delhi.lat - 0.02,
            longitude: indianCities.delhi.lng - 0.01,
            address: 'Rajiv Chowk Metro Station, Delhi NCR',
            hostName: 'Delhi Metro Authority',
            rating: 4.2,
            photos: ['https://via.placeholder.com/150'],
            plugType: 'CCS',
            amenities: ['Parking', 'Shopping', 'Metro Access']
          },
          {
            id: '3',
            name: 'Hotel Charging Station',
            type: 'CHAdeMO',
            power: 45,
            pricePerKwh: 0.40,
            availability: true,
            latitude: userLocation.lat + 0.015,
            longitude: userLocation.lng - 0.02,
            address: '789 Hotel Ave, Uptown',
            hostName: 'Luxury Hotel',
            rating: 4.8,
            photos: ['https://via.placeholder.com/150'],
            plugType: 'CHAdeMO',
            amenities: ['Valet', 'Restaurant', 'Lounge']
          }
        ];
        
        setChargers(mockChargers);
        setFilteredChargers(mockChargers);
      } catch (error) {
        console.error('Error fetching chargers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChargers();
  }, [userLocation]);

  const handleFilter = (filters) => {
    let filtered = [...chargers];
    
    // Filter by vehicle type
    if (vehicleType) {
      filtered = filtered.filter(charger => {
        // This is a placeholder. In a real app, you'd have charger compatibility info.
        // For now, assume all chargers are compatible.
        return true;
      });
    }
    
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(charger => charger.plugType === filters.type);
    }
    
    if (filters.minPower) {
      filtered = filtered.filter(charger => charger.power >= parseInt(filters.minPower));
    }
    
    if (filters.maxPrice) {
      filtered = filtered.filter(charger => charger.pricePerKwh <= parseFloat(filters.maxPrice));
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(charger => 
        filters.amenities.every(amenity => charger.amenities.includes(amenity))
      );
    }
    
    setFilteredChargers(filtered);
  };

  const handleBookCharger = async () => {
    if (!selectedCharger || !selectedDate || !selectedTime || !currentUser) return;
    
    try {
      // This will be implemented with actual Firestore booking creation
      // await createBooking({
      //   chargerId: selectedCharger.id,
      //   userId: currentUser.uid,
      //   date: selectedDate,
      //   timeSlot: selectedTime,
      //   status: 'confirmed'
      // });
      
      // For now, just simulate a successful booking
      setTimeout(() => {
        setBookingSuccess(true);
        setShowBookingModal(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleMarkerClick = (charger) => {
    setInfoWindowData(charger);
  };

  return (
    <div className="driver-dashboard">
      <header className="app-header">
        <div className="header-container">
          <div className="logo">
            <img src="/logo.png" alt="EV Charging Network" />
            <span className="logo-text">EV Charging Network</span>
          </div>
          <div className="nav-links">
            <a href="/driver" className="nav-item active">Find Stations</a>
            <a href="/bookings" className="nav-item">My Bookings</a>
            <a href="/profile" className="nav-item">Profile</a>
            <button onClick={() => logout()} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <div className="hero-section">
        <div className="container">
          <h1>Find EV charging stations near you</h1>
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter your location"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="search-input"
            />
            <button className="search-button">Search</button>
          </div>
        </div>
      </div>
      
      <div className="container main-content">
        <div className="filters-section">
          <div className="vehicle-type-selector">
            <h3>Choose your vehicle</h3>
            <div className="vehicle-options">
              <label className={`vehicle-option ${vehicleType === '2-wheeler' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="vehicleType"
                  value="2-wheeler"
                  checked={vehicleType === '2-wheeler'}
                  onChange={(e) => setVehicleType(e.target.value)}
                />
                <div className="vehicle-icon two-wheeler"></div>
                <span>2-Wheeler</span>
              </label>
              <label className={`vehicle-option ${vehicleType === '4-wheeler' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="vehicleType"
                  value="4-wheeler"
                  checked={vehicleType === '4-wheeler'}
                  onChange={(e) => setVehicleType(e.target.value)}
                />
                <div className="vehicle-icon four-wheeler"></div>
                <span>4-Wheeler</span>
              </label>
            </div>
          </div>
          
          <ChargerFilter onFilterChange={handleFilter} />
        </div>
        
        <div className="content-grid">
          <div className="map-section">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading charging stations...</p>
              </div>
            ) : (
              <div className="map-container">
                {!googleMapsApiKey ? (
                  <div className="map-error">
                    <p>Please configure your Google Maps API key in environment settings.</p>
                  </div>
                ) : mapLoadError ? (
                  <div className="map-error">
                    <p>Error loading Google Maps. Please try again later.</p>
                  </div>
                ) : (
                  <LoadScript 
                    googleMapsApiKey={googleMapsApiKey}
                    onError={handleMapLoadError}
                  >
                    <GoogleMap
                      mapContainerStyle={{ height: '100%', width: '100%' }}
                      center={userLocation}
                      zoom={13}
                      options={{
                        styles: mapStyles,
                        disableDefaultUI: true,
                        zoomControl: true
                      }}
                      onLoad={handleMapLoad}
                    >
                      {/* User location marker */}
                      <Marker
                        position={userLocation}
                      />
                      
                      {/* Charger markers - only render when map is loaded */}
                      {filteredChargers.map(charger => (
                        <Marker
                          key={charger.id}
                          position={{ lat: charger.latitude, lng: charger.longitude }}
                          onClick={() => handleMarkerClick(charger)}
                        />
                      ))}
                      
                      {/* Info Window */}
                      {infoWindowData && (
                        <InfoWindow
                          position={{ lat: infoWindowData.latitude, lng: infoWindowData.longitude }}
                          onCloseClick={() => setInfoWindowData(null)}
                        >
                          <div className="info-window">
                            <h4>{infoWindowData.name}</h4>
                            <p className="info-address">{infoWindowData.address}</p>
                            <div className="info-details">
                              <span className="info-type">{infoWindowData.type}</span>
                              <span className="info-power">{infoWindowData.power} kW</span>
                            </div>
                            <button 
                              className="info-button"
                              onClick={() => {
                                setSelectedCharger(infoWindowData);
                                setInfoWindowData(null);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScript>
                )}
              </div>
            )}
          </div>
          
          <div className="stations-section">
            <h3>Charging Stations Near You</h3>
            {loading ? (
              <p>Finding stations...</p>
            ) : filteredChargers.length === 0 ? (
              <div className="no-results">
                <img src="/img/no-results.svg" alt="No results" />
                <p>No chargers found matching your criteria</p>
                <button onClick={() => handleFilter({})}>Clear filters</button>
              </div>
            ) : (
              <div className="stations-list">
                {filteredChargers.map(charger => (
                  <div 
                    key={charger.id} 
                    className={`station-card ${selectedCharger?.id === charger.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCharger(charger)}
                  >
                    <div className="station-image">
                      {charger.photos && charger.photos.length > 0 ? (
                        <img src={charger.photos[0]} alt={charger.name} />
                      ) : (
                        <img src="/img/default-charger.jpg" alt={charger.name} />
                      )}
                      <div className="station-rating">
                        <span className="star-icon">★</span> 
                        <span>{charger.rating}</span>
                      </div>
                    </div>
                    <div className="station-content">
                      <h4>{charger.name}</h4>
                      <p className="station-address">{charger.address}</p>
                      <div className="station-features">
                        <span className="feature connector-type">{charger.type}</span>
                        <span className="feature power">{charger.power} kW</span>
                        <span className="feature price">{formatCurrency(charger.pricePerKwh)}/kWh</span>
                      </div>
                      <div className="station-availability">
                        <span className={`status ${charger.availability ? 'available' : 'occupied'}`}>
                          {charger.availability ? 'Available' : 'Occupied'}
                        </span>
                        <button className="view-button">View</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals remain largely unchanged */}
      {selectedCharger && (
        <ChargerDetails 
          charger={selectedCharger} 
          onBookNow={() => setShowBookingModal(true)}
          onClose={() => setSelectedCharger(null)}
        />
      )}
      
      {showBookingModal && (
        <BookingModal
          charger={selectedCharger}
          onDateChange={(date) => setSelectedDate(date)}
          onTimeChange={(time) => setSelectedTime(time)}
          onConfirm={handleBookCharger}
          onCancel={() => setShowBookingModal(false)}
        />
      )}
      
      {bookingSuccess && (
        <div className="booking-success-modal">
          <div className="modal-content">
            <div className="success-icon">✓</div>
            <h3>Booking Confirmed!</h3>
            <p>Your charging session has been booked for {selectedDate?.toLocaleDateString()} at {selectedTime}.</p>
            <button onClick={() => setBookingSuccess(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom map styles
const mapStyles = [
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "poi.attraction",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9e9e9" }]
  }
];

export default DriverDashboard;
