import React, { useState, useEffect, useCallback } from 'react';
import { LoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useAuth } from '../../contexts/AuthContext';
import ChargerDetails from '../../components/driver/ChargerDetails';
import BookingModal from '../../components/driver/BookingModal';
import ChargerFilter from '../../components/driver/ChargerFilter';
import { indianCities, formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { getAllStations, getStationsByCity, searchStations, applyFilters, findNearestStations } from '../../services/dataService';
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
  const navigate = useNavigate();
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
  const [nearestChargers, setNearestChargers] = useState([]);
  const [locationAccepted, setLocationAccepted] = useState(false);
  // Add state for active city
  const [activeCity, setActiveCity] = useState('all');
  
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
  
  // Calculate distance between two points using Haversine formula
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

  // Find nearest chargers based on user's location
  const findNearestChargers = useCallback((location, allChargers, limit = 3) => {
    if (!location || !location.lat || !location.lng || !allChargers.length) {
      return [];
    }

    const chargersWithDistance = allChargers.map(charger => ({
      ...charger,
      distance: calculateDistance(
        location.lat,
        location.lng,
        charger.latitude,
        charger.longitude
      )
    }));

    // Sort by distance (nearest first)
    return chargersWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }, []);

  // Update nearestChargers whenever user location or all chargers change
  useEffect(() => {
    if (userLocation && chargers.length > 0) {
      const nearest = findNearestStations(userLocation, chargers);
      setNearestChargers(nearest);
    }
  }, [userLocation, chargers]);
  
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
          setLocationAccepted(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationAccepted(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else if (!isSecure) {
      console.warn('Geolocation requires HTTPS in production environments');
      setLocationAccepted(false);
    }
  }, []);
  
  // Fetch chargers using the dataService
  useEffect(() => {
    const loadChargers = async () => {
      try {
        setLoading(true);
        
        // Get all stations from the data service
        const stations = await getAllStations();
        
        // Log the count of stations by city for verification
        const cityCounts = {};
        stations.forEach(station => {
          if (station.city) {
            const city = station.city.toLowerCase();
            cityCounts[city] = (cityCounts[city] || 0) + 1;
          }
        });
        console.log('Station counts by city:', cityCounts);
        
        setChargers(stations);
        setFilteredChargers(stations);
        
      } catch (error) {
        console.error('Error fetching chargers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChargers();
  }, []);
  
  const handleFilter = (filters) => {
    // Apply filters to the current set of chargers
    const filtered = applyFilters(chargers, filters);
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

  // Add these new state variables for search functionality
  const [isSearching, setIsSearching] = useState(false);

  // Handle navigation for header links
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Updated search function using data service
  const handleSearch = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Use the search function from data service
      const searchResults = await searchStations(searchAddress);
      
      setFilteredChargers(searchResults);
      
      // If we have results, center the map on the first result
      if (searchResults.length > 0) {
        setUserLocation({
          lat: searchResults[0].latitude,
          lng: searchResults[0].longitude
        });
      }
    } catch (error) {
      console.error('Error searching stations:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle clear filters button
  const handleClearFilters = () => {
    setFilteredChargers(chargers);
    // Reset any filter state in the filter component
    // This would need to be implemented via props/callbacks to the ChargerFilter component
  };
  
  // Handle view button click in station cards
  const handleViewStation = (charger, e) => {
    e.stopPropagation(); // Prevent the card's onClick from firing
    setSelectedCharger(charger);
  };
  
  // Handle Enter key in search input
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Improved filterByCity function using data service
  const filterByCity = async (city) => {
    // Set the active city for UI highlighting
    setActiveCity(city);
    
    try {
      setLoading(true);
      
      // Ensure we're using a consistent case format when fetching data
      // City names in buttons are lowercase but might be title case in data
      const cityFormatted = city.toLowerCase();
      
      // Special handling for "all" case
      if (cityFormatted === 'all') {
        const allStations = await getAllStations();
        setFilteredChargers(allStations);
        console.log(`Loaded ${allStations.length} stations from all cities`);
      } else {
        // For specific cities, convert first letter to uppercase for data consistency
        const cityProper = cityFormatted.charAt(0).toUpperCase() + cityFormatted.slice(1);
        
        // Fetch stations for the selected city using the data service
        const cityStations = await getStationsByCity(cityProper);
        
        console.log(`Found ${cityStations.length} chargers in ${cityProper}`);
        setFilteredChargers(cityStations);
        
        // Update map center to the selected city
        if (indianCities[cityFormatted]) {
          setUserLocation({
            lat: indianCities[cityFormatted].lat,
            lng: indianCities[cityFormatted].lng
          });
        }
      }
    } catch (error) {
      console.error(`Error filtering by city ${city}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Add new state for mobile UI
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [mobileView, setMobileView] = useState('map'); // 'map' or 'list'
  
  // Check window size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobileSize = window.innerWidth < 768;
      if (isMobileSize) {
        // Default to map view on mobile
        setMobileView('map');
      }
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Toggle mobile filter panel
  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
  };
  
  // Toggle bottom sheet for station list on mobile
  const toggleBottomSheet = () => {
    setIsBottomSheetOpen(!isBottomSheetOpen);
  };
  
  // Toggle between map and list view on mobile
  const toggleMobileView = (view) => {
    setMobileView(view);
  };

  return (
    <div className="driver-dashboard">
      {/* Mobile header with simplified navigation */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo" onClick={() => handleNavigation('/driver')}>
            <span className="logo-text">EV Network</span>
          </div>
          
          {/* Mobile nav buttons */}
          <div className="mobile-nav">
            <button 
              className={`mobile-nav-btn ${mobileView === 'map' ? 'active' : ''}`}
              onClick={() => toggleMobileView('map')}
              aria-label="Show Map View"
            >
              <i className="fa fa-map-marker"></i>
            </button>
            <button 
              className={`mobile-nav-btn ${mobileView === 'list' ? 'active' : ''}`}
              onClick={() => toggleMobileView('list')}
              aria-label="Show List View"
            >
              <i className="fa fa-list"></i>
            </button>
            <button 
              className={`mobile-nav-btn ${isMobileFilterOpen ? 'active' : ''}`}
              onClick={toggleMobileFilter}
              aria-label="Show Filters"
            >
              <i className="fa fa-filter"></i>
            </button>
            <div className="mobile-nav-dropdown">
              <button className="mobile-nav-btn">
                <i className="fa fa-ellipsis-v"></i>
              </button>
              <div className="mobile-dropdown-content">
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/bookings'); }}>
                  <i className="fa fa-calendar"></i> My Bookings
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/profile'); }}>
                  <i className="fa fa-user"></i> Profile
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
                  <i className="fa fa-sign-out"></i> Logout
                </a>
              </div>
            </div>
          </div>
          
          {/* Desktop nav links (hidden on mobile) */}
          <div className="desktop-nav-links">
            <a 
              href="#" 
              className="nav-item active" 
              onClick={(e) => { e.preventDefault(); handleNavigation('/driver'); }}
            >
              <i className="fa fa-map-marker"></i> Find Stations
            </a>
            <a 
              href="#" 
              className="nav-item" 
              onClick={(e) => { e.preventDefault(); handleNavigation('/bookings'); }}
            >
              <i className="fa fa-calendar"></i> My Bookings
            </a>
            <a 
              href="#" 
              className="nav-item" 
              onClick={(e) => { e.preventDefault(); handleNavigation('/profile'); }}
            >
              <i className="fa fa-user"></i> Profile
            </a>
            <button onClick={() => logout()} className="btn-logout">
              <i className="fa fa-sign-out"></i> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile search - always visible at top */}
      <div className="mobile-search-bar">
        <div className="search-box">
          <i className="fa fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Search locations or chargers..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="search-input"
          />
          <button 
            className="search-button" 
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-search"></i>}
          </button>
        </div>
      </div>

      {/* Mobile filter panel - slides in when active */}
      <div className={`mobile-filter-panel ${isMobileFilterOpen ? 'open' : ''}`}>
        <div className="mobile-filter-header">
          <h3>Filter Options</h3>
          <button 
            onClick={toggleMobileFilter}
            className="close-filter-btn"
          >
            <i className="fa fa-times"></i>
          </button>
        </div>
        
        <div className="mobile-filter-content">
          {/* City selector tabs */}
          <div className="city-tabs">
            <div className="tabs-header">
              <span>Select City</span>
            </div>
            <div className="city-tab-scroll">
              <button 
                className={`city-tab ${activeCity === 'all' ? 'active' : ''}`}
                onClick={() => filterByCity('all')}
              >
                All
              </button>
              <button 
                className={`city-tab ${activeCity === 'delhi' ? 'active' : ''}`}
                onClick={() => filterByCity('delhi')}
              >
                Delhi
              </button>
              <button 
                className={`city-tab ${activeCity === 'mumbai' ? 'active' : ''}`}
                onClick={() => filterByCity('mumbai')}
              >
                Mumbai
              </button>
              <button 
                className={`city-tab ${activeCity === 'bangalore' ? 'active' : ''}`}
                onClick={() => filterByCity('bangalore')}
              >
                Bangalore
              </button>
              <button 
                className={`city-tab ${activeCity === 'chennai' ? 'active' : ''}`}
                onClick={() => filterByCity('chennai')}
              >
                Chennai
              </button>
              <button 
                className={`city-tab ${activeCity === 'hyderabad' ? 'active' : ''}`}
                onClick={() => filterByCity('hyderabad')}
              >
                Hyderabad
              </button>
              <button 
                className={`city-tab ${activeCity === 'pune' ? 'active' : ''}`}
                onClick={() => filterByCity('pune')}
              >
                Pune
              </button>
              <button 
                className={`city-tab ${activeCity === 'kolkata' ? 'active' : ''}`}
                onClick={() => filterByCity('kolkata')}
              >
                Kolkata
              </button>
            </div>
          </div>
          
          {/* Vehicle type selector */}
          <div className="vehicle-selector">
            <h4>Vehicle Type</h4>
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
          
          {/* Other filter options */}
          <div className="filter-options">
            <ChargerFilter onFilterChange={handleFilter} />
          </div>
          
          {/* Filter action buttons */}
          <div className="filter-actions">
            {filteredChargers.length === 0 && !loading && (
              <button 
                onClick={handleClearFilters}
                className="clear-filters-button"
              >
                <i className="fa fa-refresh"></i> Clear Filters
              </button>
            )}
            <button 
              onClick={toggleMobileFilter}
              className="apply-filters-button"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main content - responsive layout */}
      <div className="main-content">
        {/* Mobile view toggle and map/list container */}
        <div className={`mobile-view-container ${mobileView}`}>
          {/* Map view */}
          <div className="map-view-container">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading charging stations...</p>
              </div>
            ) : (
              <div className="map-container">
                {!googleMapsApiKey ? (
                  <div className="map-error">
                    <p><i className="fa fa-exclamation-triangle"></i> Please configure your Google Maps API key.</p>
                  </div>
                ) : mapLoadError ? (
                  <div className="map-error">
                    <p><i className="fa fa-exclamation-triangle"></i> Error loading Google Maps.</p>
                  </div>
                ) : (
                  <LoadScript 
                    googleMapsApiKey={googleMapsApiKey}
                    onError={handleMapLoadError}
                    loadingElement={<div className="map-loading">Loading map...</div>}
                  >
                    <GoogleMap
                      mapContainerStyle={{ height: '100%', width: '100%' }}
                      center={userLocation}
                      zoom={13}
                      options={{
                        styles: mapStyles,
                        disableDefaultUI: false,
                        zoomControl: true,
                        mapTypeControl: false, // Simplified UI for mobile
                        streetViewControl: false, // Simplified UI for mobile
                        fullscreenControl: true
                      }}
                      onLoad={handleMapLoad}
                    >
                      {/* User location marker */}
                      <Marker
                        position={userLocation}
                        icon={{
                          path: 0, // circle path
                          scale: 10,
                          fillColor: "#4285F4",
                          fillOpacity: 1,
                          strokeColor: "#FFFFFF",
                          strokeWeight: 2
                        }}
                        title="Your location"
                      />
                      
                      {/* Charger markers */}
                      {filteredChargers.map(charger => (
                        <Marker
                          key={charger.id}
                          position={{ lat: charger.latitude, lng: charger.longitude }}
                          onClick={() => handleMarkerClick(charger)}
                          icon={{
                            path: charger.availability ? 'M -2,-2 2,-2 2,2 -2,2 Z' : 'M -2,-2 2,-2 2,2 -2,2 Z', // Simple square for better mobile performance
                            fillColor: charger.availability ? "#4caf50" : "#f44336",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 1,
                            scale: 4,
                          }}
                          animation={2} // DROP animation
                        />
                      ))}
                      
                      {/* Info Window - optimized for mobile */}
                      {infoWindowData && (
                        <InfoWindow
                          position={{ lat: infoWindowData.latitude, lng: infoWindowData.longitude }}
                          onCloseClick={() => setInfoWindowData(null)}
                        >
                          <div className="info-window">
                            <h4>{infoWindowData.name}</h4>
                            <p className="info-address"><i className="fa fa-map-marker"></i> {infoWindowData.address}</p>
                            <div className="info-details">
                              <span className="info-type"><i className="fa fa-plug"></i> {infoWindowData.type}</span>
                              <span className="info-power"><i className="fa fa-bolt"></i> {infoWindowData.power} kW</span>
                              <span className={`info-status ${infoWindowData.availability ? 'available' : 'occupied'}`}>
                                {infoWindowData.availability ? 'Available' : 'Occupied'}
                              </span>
                            </div>
                            <button 
                              className="info-button"
                              onClick={() => {
                                setSelectedCharger(infoWindowData);
                                setInfoWindowData(null);
                              }}
                            >
                              <i className="fa fa-info-circle"></i> View Details
                            </button>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScript>
                )}
              </div>
            )}
            
            {/* Mobile map actions - bottom floating buttons */}
            <div className="mobile-map-actions">
              <button 
                onClick={toggleBottomSheet}
                className="bottom-sheet-toggle"
              >
                <i className={`fa fa-chevron-${isBottomSheetOpen ? 'down' : 'up'}`}></i>
                <span>{filteredChargers.length} Stations</span>
              </button>
            </div>
          </div>
          
          {/* List view */}
          <div className="list-view-container">
            <div className="list-header">
              <h3><i className="fa fa-list"></i> Charging Stations</h3>
              <div className="result-count">
                {filteredChargers.length} results
              </div>
            </div>
            
            {/* Station list */}
            {loading ? (
              <div className="loading-stations">
                <div className="spinner"></div>
                <p>Finding stations...</p>
              </div>
            ) : filteredChargers.length === 0 ? (
              <div className="no-results">
                <i className="fa fa-search fa-3x"></i>
                <p>No chargers found matching your criteria</p>
                <button 
                  onClick={handleClearFilters}
                  className="clear-filters-button"
                >
                  <i className="fa fa-refresh"></i> Clear filters
                </button>
              </div>
            ) : (
              <div className="mobile-stations-list">
                {filteredChargers.map(charger => (
                  <div 
                    key={charger.id} 
                    className={`mobile-station-card ${selectedCharger?.id === charger.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCharger(charger)}
                  >
                    <div className="station-status-indicator" 
                      data-status={charger.availability ? 'available' : 'occupied'}>
                    </div>
                    <div className="station-content">
                      <div className="station-header">
                        <h4>{charger.name}</h4>
                        <span className="station-price">{formatCurrency(charger.pricePerKwh)}/kWh</span>
                      </div>
                      <p className="station-address"><i className="fa fa-map-marker"></i> {charger.address}</p>
                      <div className="station-features">
                        <span className="feature connector-type"><i className="fa fa-plug"></i> {charger.type}</span>
                        <span className="feature power"><i className="fa fa-bolt"></i> {charger.power} kW</span>
                        <span className={`feature status ${charger.availability ? 'available' : 'occupied'}`}>
                          {charger.availability ? 'Available' : 'Occupied'}
                        </span>
                      </div>
                      <div className="mobile-station-actions">
                        <button
                          className="direction-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${charger.latitude},${charger.longitude}`, '_blank');
                          }}
                        >
                          <i className="fa fa-directions"></i> Directions
                        </button>
                        <button 
                          className="view-button"
                          onClick={(e) => handleViewStation(charger, e)}
                        >
                          <i className="fa fa-eye"></i> Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom sheet for station list on map view */}
        <div className={`bottom-sheet ${isBottomSheetOpen ? 'open' : ''}`}>
          <div className="bottom-sheet-header" onClick={toggleBottomSheet}>
            <div className="bottom-sheet-handle"></div>
            <h3>Nearby Charging Stations</h3>
          </div>
          
          <div className="bottom-sheet-content">
            {loading ? (
              <div className="loading-stations">
                <div className="spinner"></div>
                <p>Finding stations...</p>
              </div>
            ) : (
              <div className="bottom-sheet-stations">
                {filteredChargers.slice(0, 5).map(charger => (
                  <div 
                    key={charger.id} 
                    className="bottom-sheet-station-card"
                    onClick={() => {
                      setSelectedCharger(charger);
                      setIsBottomSheetOpen(false);
                      toggleMobileView('map');
                    }}
                  >
                    <div className={`station-status-dot ${charger.availability ? 'available' : 'occupied'}`}></div>
                    <div className="station-info">
                      <h4>{charger.name}</h4>
                      <p>{charger.address}</p>
                      <div className="station-quick-details">
                        <span><i className="fa fa-plug"></i> {charger.power} kW</span>
                        <span><i className="fa fa-tag"></i> {formatCurrency(charger.pricePerKwh)}/kWh</span>
                      </div>
                    </div>
                    <div className="station-action">
                      <i className="fa fa-chevron-right"></i>
                    </div>
                  </div>
                ))}
                
                {filteredChargers.length > 5 && (
                  <button 
                    className="view-all-btn"
                    onClick={() => toggleMobileView('list')}
                  >
                    View all {filteredChargers.length} stations
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Nearest chargers - scroll horizontally on mobile */}
        {locationAccepted && nearestChargers.length > 0 && (
          <div className="nearest-chargers-container">
            <h2>Nearest Charging Stations</h2>
            <div className="nearest-chargers">
              {nearestChargers.map(charger => (
                <div 
                  key={charger.id} 
                  className="nearest-charger-card"
                  onClick={() => {
                    setSelectedCharger(charger);
                    setUserLocation({
                      lat: charger.latitude,
                      lng: charger.longitude
                    });
                    toggleMobileView('map'); // Switch to map view when selecting a station
                  }}
                >
                  <div className="charger-status-indicator" 
                    data-status={charger.availability ? 'available' : 'occupied'}>
                  </div>
                  <h3>{charger.name}</h3>
                  <p className="distance"><i className="fa fa-location-arrow"></i> {charger.distance.toFixed(1)} km away</p>
                  <div className="charger-quick-info">
                    <span className="connector-type"><i className="fa fa-plug"></i> {charger.type}</span>
                    <span className="power"><i className="fa fa-bolt"></i> {charger.power} kW</span>
                  </div>
                  <div className="price-tag">
                    <span className="price-amount">{formatCurrency(charger.pricePerKwh)}</span>
                    <span className="price-unit">/kWh</span>
                  </div>
                  <button className="view-details-btn">
                    <i className="fa fa-info-circle"></i> Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* ChargerDetails Modal - full screen on mobile */}
      {selectedCharger && (
        <div className="mobile-charger-details">
          <ChargerDetails 
            charger={selectedCharger} 
            onBookNow={() => setShowBookingModal(true)}
            onClose={() => setSelectedCharger(null)}
            isMobile={true}
          />
        </div>
      )}
      
      {/* Mobile-optimized booking modal */}
      {showBookingModal && (
        <BookingModal
          charger={selectedCharger}
          onDateChange={(date) => setSelectedDate(date)}
          onTimeChange={(time) => setSelectedTime(time)}
          onConfirm={handleBookCharger}
          onCancel={() => setShowBookingModal(false)}
          isMobile={true}
        />
      )}
      
      {/* Success Modal with mobile optimization */}
      {bookingSuccess && (
        <div className="booking-success-modal mobile-success-modal">
          <div className="modal-content">
            <div className="success-icon">✓</div>
            <h3>Booking Confirmed!</h3>
            <p>Your charging session has been booked for {selectedDate?.toLocaleDateString()} at {selectedTime}.</p>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setBookingSuccess(false);
                  setSelectedCharger(null);
                }}
              >
                Close
              </button>
              <button 
                className="view-bookings-button"
                onClick={() => {
                  setBookingSuccess(false);
                  handleNavigation('/bookings');
                }}
              >
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile navigation footer */}
      <div className="mobile-footer-nav">
        <button 
          className={`mobile-footer-btn ${mobileView === 'map' ? 'active' : ''}`} 
          onClick={() => toggleMobileView('map')}
        >
          <i className="fa fa-map-marker"></i>
          <span>Map</span>
        </button>
        <button 
          className={`mobile-footer-btn ${mobileView === 'list' ? 'active' : ''}`}
          onClick={() => toggleMobileView('list')}
        >
          <i className="fa fa-list"></i>
          <span>List</span>
        </button>
        <button 
          className="mobile-footer-btn"
          onClick={() => toggleMobileFilter()}
        >
          <i className="fa fa-filter"></i>
          <span>Filter</span>
        </button>
        <button 
          className="mobile-footer-btn"
          onClick={(e) => { e.preventDefault(); handleNavigation('/bookings'); }}
        >
          <i className="fa fa-calendar"></i>
          <span>Bookings</span>
        </button>
      </div>
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
