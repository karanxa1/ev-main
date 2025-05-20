import React, { useState, useEffect, useRef, useMemo } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './DriverDashboard.css';
import { getAllStations } from '../../services/dataService';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig';
import { 
  FaMapMarkedAlt, FaWallet, FaBullhorn, FaRoute, FaShoppingBag, FaUserCircle, 
  FaFilter, FaCrosshairs, FaListAlt, FaSearch, FaChevronDown, FaCheck,
  FaTimes, FaDirections, FaBatteryHalf, FaSortAmountDown, FaSort,
  FaCar, FaCircle
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Default coordinates for fallback if station has no valid geo-data
const DEFAULT_FALLBACK_COORDS = { latitude: 18.5204, longitude: 73.8567 }; // Pune

// Helper to slightly adjust coordinates to prevent perfect overlap
const getJitteredCoordinates = (lat, lng, stationId) => {
  const jitterAmount = 0.00001; // Very small offset
  // Create a pseudo-random offset based on station ID to keep jitter consistent for the same ID
  const idHash = stationId ? stationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.random() * 1000;
  const latOffset = (idHash % 10 - 5) * jitterAmount; // between -5*jitter and 4*jitter
  const lngOffset = (idHash % 10 - 5) * jitterAmount; // between -5*jitter and 4*jitter
  return { latitude: lat + latOffset, longitude: lng + lngOffset };
};

// ADDED_FUNCTION: Haversine distance calculation
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// StationMarker component - separating UI logic
const StationMarker = ({ station, onClick }) => {
  return (
    <Marker
      longitude={station.longitude}
      latitude={station.latitude}
      onClick={() => onClick(station)}
    >
      <div 
        className={`station-marker ${station.status === 'Available' ? 'available' : (station.status === 'Occupied' ? 'occupied' : 'unknown')} ${station.isCompatible ? 'compatible' : ''} ${station.userVehicle ? '' : 'no-vehicle'}`}
        title={station.name}
      >⚡</div> 
    </Marker>
  );
};

// StationCard component - simplify rendering of station cards
const StationCard = ({ station, onClick, isMobile = false }) => {
  return (
    <div 
      className={`station-list-card-item enhanced-station-card ${isMobile ? 'mobile-optimized' : ''}`}
      onClick={() => onClick(station)}
    >
      <div className="card-header">
        <span className="station-name" title={station.name}>{station.name}</span>
        {station.isCompatible !== undefined && (
          <span className={`enhanced-station-compatibility ${station.isCompatible ? 'compatible' : 'incompatible'}`}>
            {station.isCompatible ? 'Compatible' : 'Not Compatible'}
          </span>
        )}
      </div>
      
      <div className="station-details">
        <div className="detail-item">
          <span className="detail-label">Status</span>
          <span className={`detail-value ${station.status === 'Available' ? 'available-status' : 'unavailable-status'}`}>
            {station.status || 'Unknown'}
          </span>
        </div>
        {station.distance !== undefined && (
          <div className="detail-item">
            <span className="detail-label">Distance</span>
            <span className="detail-value">{station.distance.toFixed(1)} km</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">Chargers</span>
          <span className="detail-value">
            {station.chargerTypes && station.chargerTypes.length > 0 
              ? (isMobile ? station.chargerTypes[0] + (station.chargerTypes.length > 1 ? ' +' + (station.chargerTypes.length - 1) : '') : station.chargerTypes.join(', ')) 
              : 'Not specified'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Price</span>
          <span className="detail-value">₹{station.pricePerKwh || '--'}/kWh</span>
        </div>
      </div>
      
      <div className="card-footer">
        <button 
          className="btn-action btn-directions" 
          aria-label="Get directions"
          onClick={(e) => {
            e.stopPropagation();
            if (station.latitude && station.longitude && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const url = `https://www.google.com/maps/dir/?api=1&origin=${position.coords.latitude},${position.coords.longitude}&destination=${station.latitude},${station.longitude}`;
                  window.open(url, '_blank');
                },
                (err) => console.warn("Error getting user location:", err.message)
              );
            }
          }}
        >
          <FaDirections /> {isMobile ? '' : 'Directions'}
        </button>
        <button 
          className="btn-action btn-book"
          disabled={station.status !== 'Available'}
          aria-label={station.status === 'Available' ? 'Book now' : 'Currently unavailable'}
        >
          {station.status === 'Available' ? (isMobile ? 'Book' : 'Book Now') : (isMobile ? 'Unavailable' : 'Currently Unavailable')}
        </button>
      </div>
    </div>
  );
};

const DriverDashboard = () => {
  const reactRouterLocation = useLocation(); // Renamed to avoid conflict if global `location` was intended elsewhere, and to be clear.
  const { state } = reactRouterLocation; // Continue using state if needed from the location object
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [rawStations, setRawStations] = useState([]); // Store raw stations from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStationPopup, setSelectedStationPopup] = useState(null);
  const [activeBottomNav, setActiveBottomNav] = useState('Map');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list' view
  const [nearbyStations, setNearbyStations] = useState([]); // For closest station suggestions
  
  // User vehicle state
  const [userVehicle, setUserVehicle] = useState(state?.vehicle || null);
  const [showCompatibleOnly, setShowCompatibleOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  
  // New state variables for enhanced features
  const [sortOption, setSortOption] = useState('distance'); // 'distance', 'availability', 'price'
  const [recentStations, setRecentStations] = useState([]);
  const [batteryRangeFilter, setBatteryRangeFilter] = useState(false);
  const [estimatedRange, setEstimatedRange] = useState(userVehicle?.range || 150); // km
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedChargerType, setSelectedChargerType] = useState('all');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

  const [viewport, setViewport] = useState({
    longitude: 78.9629, // India's approximate longitude
    latitude: 20.5937,  // India's approximate latitude
    zoom: 4.5,          // Zoom level for an overview of India
    bearing: 0,
    pitch: 0
  });

  const mapRef = useRef();

  // New state variables for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Fetch user vehicle if not passed in location state
  useEffect(() => {
    const fetchUserVehicle = async () => {
      if (!userVehicle && currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().vehicle) {
            setUserVehicle(userDoc.data().vehicle);
          }
        } catch (err) {
          console.error("Error fetching user vehicle:", err);
        }
      }
    };
    
    fetchUserVehicle();
  }, [currentUser, userVehicle]);

  // Process stations to ensure valid coordinates, mark compatibility, and add distance if userLocation is available
  const stations = useMemo(() => {
    const stationCoordinatesCount = {};
    
    // First, process all stations for coordinates and distance
    let processedStations = rawStations.map(station => {
      let lat = parseFloat(station.latitude);
      let lng = parseFloat(station.longitude);

      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        lat = DEFAULT_FALLBACK_COORDS.latitude;
        lng = DEFAULT_FALLBACK_COORDS.longitude;
      }
      
      const coordKey = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
      stationCoordinatesCount[coordKey] = (stationCoordinatesCount[coordKey] || 0) + 1;
      
      let stationWithCoords = { ...station, latitude: lat, longitude: lng };

      // Apply jitter if more than one station is at the exact same (rounded) spot
      if (stationCoordinatesCount[coordKey] > 1) {
        const jittered = getJitteredCoordinates(lat, lng, station.id);
        stationWithCoords = {
          ...station,
          latitude: jittered.latitude,
          longitude: jittered.longitude,
          originalLat: lat,
          originalLng: lng
        };
      }

      // Calculate distance if userLocation is available
      if (userLocation) {
        const sLat = stationWithCoords.originalLat !== undefined ? stationWithCoords.originalLat : stationWithCoords.latitude;
        const sLng = stationWithCoords.originalLng !== undefined ? stationWithCoords.originalLng : stationWithCoords.longitude;
        const distance = getDistance(userLocation.latitude, userLocation.longitude, sLat, sLng);
        stationWithCoords.distance = distance; // Add distance to the station object
      }
      return stationWithCoords;
    });
    
    // Now, add compatibility information if user has a vehicle
    if (userVehicle && userVehicle.compatibleChargerTypes) {
      return processedStations.map(station => {
        const isCompatible = station.chargerTypes && 
          station.chargerTypes.some(type => 
            userVehicle.compatibleChargerTypes.includes(type)
          );
        return { ...station, isCompatible };
      });
    }
    
    return processedStations;
  }, [rawStations, userVehicle, userLocation]); // Added userLocation to dependencies

  // Filtered stations based on compatibility and availability preference
  const filteredStations = useMemo(() => {
    let filtered = stations;
    
    // Filter by compatibility if user has a vehicle and wants compatible stations only
    if (userVehicle && showCompatibleOnly) {
      filtered = filtered.filter(station => station.isCompatible);
    }
    
    // Filter by availability if user wants available stations only
    if (showAvailableOnly) {
      filtered = filtered.filter(station => station.status === 'Available');
    }
    
    // Filter by battery range if enabled
    if (batteryRangeFilter && userLocation) {
      filtered = filtered.filter(station => 
        station.distance && station.distance <= estimatedRange
      );
    }
    
    // Filter by charger type if selected
    if (selectedChargerType !== 'all') {
      filtered = filtered.filter(station => 
        station.chargerTypes && station.chargerTypes.includes(selectedChargerType)
      );
    }
    
    // Sort stations based on selected sort option
    filtered = [...filtered].sort((a, b) => {
      if (sortOption === 'distance') {
        return (a.distance || Infinity) - (b.distance || Infinity);
      } else if (sortOption === 'availability') {
        if (a.status === 'Available' && b.status !== 'Available') return -1;
        if (a.status !== 'Available' && b.status === 'Available') return 1;
        return 0;
      } else if (sortOption === 'price') {
        return (a.pricePerKwh || 0) - (b.pricePerKwh || 0);
      }
      return 0;
    });
    
    return filtered;
  }, [stations, showCompatibleOnly, showAvailableOnly, userVehicle, batteryRangeFilter, estimatedRange, selectedChargerType, sortOption, userLocation]);

  // MOVED_EFFECT_BELOW: Calculate and update nearby stations (moved from above stations and filteredStations)
  useEffect(() => {
    if (userLocation && filteredStations.length > 0) {
      const stationsWithDistance = filteredStations.map(station => {
        const sLat = station.originalLat !== undefined ? station.originalLat : station.latitude;
        const sLng = station.originalLng !== undefined ? station.originalLng : station.longitude;
        const distance = getDistance(userLocation.latitude, userLocation.longitude, sLat, sLng);
        return { ...station, distance };
      }).sort((a, b) => a.distance - b.distance);

      setNearbyStations(stationsWithDistance.slice(0, 3)); // Get top 3 closest
    } else {
      setNearbyStations([]); // Clear nearby stations if no user location or no filtered stations
    }
  }, [userLocation, filteredStations]);

  const flyToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 14, duration: 1500 });
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          if (mapRef.current && !selectedStationPopup) {
            setViewport(prev => ({ ...prev, latitude, longitude, zoom: 12 }));
            mapRef.current.flyTo({ center: [longitude, latitude], zoom: 12, duration: 1000 });
          }
        },
        (err) => console.warn("Error getting user location:", err.message)
      );
    }

    const fetchStations = async () => {
      try {
        setLoading(true);
        const stationData = await getAllStations();
        setRawStations(stationData); // Set raw stations
        console.log('DriverDashboard: Raw stations fetched:', stationData); // ADDED_LOG
        setError(null);
      } catch (err) {
        console.error("Error fetching stations:", err);
        setError('Failed to load stations.');
        setRawStations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, [selectedStationPopup]);

  const handleMarkerClick = (station) => {
    setSelectedStationPopup(station);
    
    // Add to recently viewed if not already there
    if (!recentStations.some(s => s.id === station.id)) {
      setRecentStations(prev => [station, ...prev].slice(0, 5)); // Keep last 5
    }
    
    // Reset photo index when selecting a new station
    setPhotoIndex(0);
    
    // Open mobile details panel
    setIsMobileDetailsOpen(true);
    
    // Fly to original coordinates if jittered, otherwise the actual ones.
    const targetLng = station.originalLng !== undefined ? station.originalLng : station.longitude;
    const targetLat = station.originalLat !== undefined ? station.originalLat : station.latitude;

    if (targetLat && targetLng && mapRef.current) {
        mapRef.current.flyTo({ center: [parseFloat(targetLng), parseFloat(targetLat)], zoom: 15, duration: 1000 }); // Zoom in a bit more
    }
  };

  const handleBottomNavClick = (navItem) => {
    setActiveBottomNav(navItem);
    console.log(`${navItem} clicked`);
    if (navItem === 'Profile') {
      navigate('/profile');
    } else if (navItem === 'Trips') {
      navigate('/trips');
    } else if (navItem === 'Map') {
      // Use the location object from the useLocation hook
      if (reactRouterLocation.pathname !== '/driver') {
        navigate('/driver');
      }
    }
  };

  const toggleCompatibleFilter = () => {
    setShowCompatibleOnly(!showCompatibleOnly);
  };

  const toggleAvailableFilter = () => {
    setShowAvailableOnly(!showAvailableOnly);
  };

  const handleSelectVehicle = () => {
    console.log('handleSelectVehicle called. Navigating to /change-vehicle...'); // Updated diagnostic log
    navigate('/change-vehicle'); // Changed navigation path
  };

  const handleToggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'map' ? 'list' : 'map');
  };

  // New handler functions for enhanced features

  const toggleBatteryRangeFilter = () => {
    setBatteryRangeFilter(!batteryRangeFilter);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortDropdown(false);
  };

  const handleChargerTypeChange = (type) => {
    setSelectedChargerType(type);
    setShowFilterDropdown(false);
  };

  const handleRangeChange = (e) => {
    setEstimatedRange(Number(e.target.value));
  };

  const handleNextPhoto = () => {
    if (selectedStationPopup?.photos?.length > 1) {
      setPhotoIndex((prev) => (prev + 1) % selectedStationPopup.photos.length);
    }
  };

  const handlePrevPhoto = () => {
    if (selectedStationPopup?.photos?.length > 1) {
      setPhotoIndex((prev) => (prev - 1 + selectedStationPopup.photos.length) % selectedStationPopup.photos.length);
    }
  };

  const handleBookStation = (station) => {
    // Implement booking functionality or navigate to booking page
    console.log('Booking station:', station.id);
    // navigate(`/station-booking/${station.id}`);
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
    // Close other dropdown if open
    if (showSortDropdown) setShowSortDropdown(false);
  };

  const toggleSortDropdown = () => {
    setShowSortDropdown(!showSortDropdown);
    // Close other dropdown if open
    if (showFilterDropdown) setShowFilterDropdown(false);
  };

  // Geocoding search function
  const searchGeocoding = async (query) => {
    if (!MAPBOX_TOKEN || !query.trim()) return;
    
    try {
      setIsSearching(true);
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        // Focus search around user location if available, otherwise around India
        ...(userLocation 
          ? { proximity: `${userLocation.longitude},${userLocation.latitude}` }
          : { proximity: '78.9629,20.5937' }), // Default to center of India
        country: 'in', // Limit to India
        types: 'place,locality,neighborhood,address,poi',
        limit: 5
      });
      
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features.map(feature => ({
          id: feature.id,
          name: feature.place_name,
          coordinates: {
            longitude: feature.center[0],
            latitude: feature.center[1]
          }
        })));
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Geocoding search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search input change with debounce
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout (debounce)
    if (value.trim().length > 2) { // Only search if more than 2 characters
      searchTimeoutRef.current = setTimeout(() => {
        searchGeocoding(value);
      }, 500); // 500ms debounce
    } else {
      setShowSearchResults(false);
    }
  };
  
  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    if (result && result.coordinates) {
      // Fly to the selected location
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [result.coordinates.longitude, result.coordinates.latitude],
          zoom: 14,
          duration: 1500
        });
      }
      
      // Close search results
      setShowSearchResults(false);
      
      // Also find the nearest stations to this location and highlight them
      if (filteredStations.length > 0) {
        const stationsWithDistance = filteredStations.map(station => {
          const distance = getDistance(
            result.coordinates.latitude, 
            result.coordinates.longitude,
            station.originalLat !== undefined ? station.originalLat : station.latitude,
            station.originalLng !== undefined ? station.originalLng : station.longitude
          );
          return { ...station, distance };
        }).sort((a, b) => a.distance - b.distance);
        
        setNearbyStations(stationsWithDistance.slice(0, 3));
      }
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSearchResults && !e.target.closest('.search-bar-on-map')) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSearchResults]);

  return (
    <div className="driver-dashboard-mobile enhanced-driver-dashboard">
      <main className="map-view-full-container">
        {/* Search and filter UI matching the image */}
        <div className="map-search-container">
          {/* Search Location Input */}
          <div className="location-search-input">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search location..." 
              value={searchTerm}
              onChange={handleSearchInputChange}
            />
            {searchTerm && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setShowSearchResults(false);
                }}
              >
                <FaTimes size={14} />
              </button>
            )}
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {isSearching ? (
                  <div className="search-loading">Searching...</div>
                ) : (
                  <>
                    {searchResults.map(result => (
                      <div 
                        key={result.id} 
                        className="search-result-item"
                        onClick={() => handleSearchResultSelect(result)}
                      >
                        <span className="search-result-icon">📍</span>
                        <span className="search-result-name">{result.name}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Filter Chips Row */}
          <div className="filter-chips-row">
            {/* Vehicle Chip */}
            <button 
              className="filter-chip vehicle-chip"
              onClick={handleSelectVehicle}
            >
              <FaCar className="vehicle-chip-icon" />
              {/* Use Tata Nexon EV text as in the image */}
              {userVehicle?.name || "Tata Nexon EV"} 
              <FaChevronDown className="dropdown-icon" />
            </button>
            
            {/* All Chargers Filter */}
            <button 
              className={`filter-chip ${!showCompatibleOnly ? 'active' : ''}`}
              onClick={toggleCompatibleFilter}
            >
              All Chargers
            </button>
            
            {/* Available Filter with circle icon */}
            <button 
              className={`filter-chip available-toggle ${showAvailableOnly ? 'active' : ''}`}
              onClick={toggleAvailableFilter}
            >
              {showAvailableOnly && <span className="toggle-circle"></span>}
              Available
            </button>
          </div>
        </div>
        
        {/* Map Layers Button - top right corner */}
        {/* Removing this button as it has no functionality */}

        {/* Map Control Icons */}
        <div className="map-control-buttons">
          {/* Recenter Map Button */}
          <button className="map-control-button" onClick={flyToUserLocation} aria-label="Recenter map">
            <FaCrosshairs />
          </button>
          
          {/* Toggle list view button */}
          <button className="map-control-button" onClick={handleToggleViewMode} aria-label="Toggle list view">
            <FaListAlt />
          </button>
        </div>

        {/* Main Map or List View Area */}
        <div className="main-view-area">
          {/* Map View */}
          {viewMode === 'map' && (
            <>
              {/* Loading Overlay */}
              {loading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <p>Loading stations...</p>
                </div>
              )}
              
              {/* Error Overlay */}
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                  <button onClick={() => {
                    setLoading(true);
                    setError(null);
                    getAllStations()
                      .then(data => {
                        setRawStations(data);
                        setLoading(false);
                      })
                      .catch(err => {
                        console.error("Error fetching stations:", err);
                        setError('Failed to load stations. Please try again.');
                        setLoading(false);
                      });
                  }}>
                    Retry
                  </button>
                </div>
              )}
              
              {/* Mapbox Map */}
              {MAPBOX_TOKEN && (
                <Map
                  ref={mapRef}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  initialViewState={viewport}
                  onMove={evt => setViewport(evt.viewState)}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/streets-v11"
                >
                  <NavigationControl position="bottom-right" style={{ marginBottom: '80px' }} />

                  {/* Markers for stations */}
                  {filteredStations.map(station => (
                    <StationMarker
                      key={station.id}
                      station={{...station, userVehicle}}
                      onClick={handleMarkerClick}
                    />
                  ))}
                  
                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker longitude={userLocation.longitude} latitude={userLocation.latitude}>
                      <div className="user-location-dot"></div>
                    </Marker>
                  )}

                  {/* Map control buttons - Add the new buttons here */}
                  <div className="driver-map-control-buttons">
                    {/* List EV charging stations button */}
                    <button 
                      className="driver-map-control-btn list-stations-btn"
                      onClick={handleToggleViewMode}
                      title="List all stations"
                    >
                      <span className="btn-icon"><FaListAlt /></span>
                      <span className="btn-text">List Stations</span>
                    </button>
                    
                    {/* Live location button */}
                    <button 
                      className="driver-map-control-btn live-location-btn"
                      onClick={flyToUserLocation}
                      title="Go to my location"
                    >
                      <span className="btn-icon"><FaCrosshairs /></span>
                      <span className="btn-text">My Location</span>
                    </button>
                  </div>

                  {/* Show popup on smaller screens, enhanced panel on larger screens */}
                  {selectedStationPopup && window.innerWidth <= 768 && (
                    <Popup
                      longitude={selectedStationPopup.originalLng !== undefined ? selectedStationPopup.originalLng : selectedStationPopup.longitude}
                      latitude={selectedStationPopup.originalLat !== undefined ? selectedStationPopup.originalLat : selectedStationPopup.latitude}
                      onClose={() => setSelectedStationPopup(null)}
                      closeButton={true}
                      closeOnClick={false}
                      anchor="bottom"
                      className="station-popup"
                    >
                      <div className="popup-content">
                        <div className="popup-header">
                          <h3>{selectedStationPopup.name}</h3>
                          <span className={`popup-access-tag ${selectedStationPopup.accessType?.toLowerCase() || 'public'}`}>
                            {selectedStationPopup.accessType || 'Public'}
                          </span>
                        </div>
                        
                        <p className="popup-address">{selectedStationPopup.address}</p>
                        
                        {selectedStationPopup.isCompatible !== undefined && (
                          <p className={selectedStationPopup.isCompatible ? 'compatible-text' : 'not-compatible-text'}>
                            {selectedStationPopup.isCompatible ? 'Compatible with your vehicle' : 'May not be compatible'}
                          </p>
                        )}
                        
                        {/* Station Details */}
                        <div className="popup-details">
                          <div className="popup-detail-row">
                            <span className="popup-detail-label">Status:</span>
                            <span className={`popup-detail-value ${selectedStationPopup.status === 'Available' ? 'available' : 'unavailable'}`}>
                              {selectedStationPopup.status || 'Unknown'}
                            </span>
                          </div>
                          
                          {selectedStationPopup.chargerTypes && selectedStationPopup.chargerTypes.length > 0 && (
                            <div className="popup-detail-row">
                              <span className="popup-detail-label">Charger Types:</span>
                              <div className="popup-charger-types">
                                {selectedStationPopup.chargerTypes.map(type => (
                                  <span key={type} className="popup-charger-badge">{type}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {selectedStationPopup.distance !== undefined && (
                            <div className="popup-detail-row">
                              <span className="popup-detail-label">Distance:</span>
                              <span className="popup-detail-value">{selectedStationPopup.distance.toFixed(1)} km</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Get Directions Button */}
                        <button 
                          className="popup-directions-button"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the popup from closing
                            if (userLocation) {
                              const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedStationPopup.latitude},${selectedStationPopup.longitude}`;
                              window.open(url, '_blank');
                            }
                          }}
                          disabled={!userLocation}
                        >
                          <FaDirections /> Get Directions
                        </button>
                      </div>
                    </Popup>
                  )}
                  
                  {/* Enhanced Station Details Panel for larger screens */}
                  {selectedStationPopup && window.innerWidth > 768 && (
                    <div className="enhanced-station-details">
                      <div className="details-header">
                        <h2>{selectedStationPopup.name}</h2>
                        <button className="close-details" onClick={() => setSelectedStationPopup(null)}>×</button>
                      </div>
                      <div className="details-content">
                        {/* Station photos carousel - use dummy image if no photos available */}
                        <div className="station-photos">
                          <img 
                            src={selectedStationPopup.photos && selectedStationPopup.photos.length > 0 
                              ? selectedStationPopup.photos[photoIndex] 
                              : `https://via.placeholder.com/400x200?text=${encodeURIComponent(selectedStationPopup.name)}`} 
                            alt={selectedStationPopup.name}
                          />
                          {selectedStationPopup.photos && selectedStationPopup.photos.length > 1 && (
                            <div className="photo-nav">
                              <button onClick={handlePrevPhoto} aria-label="Previous photo">&#10094;</button>
                              <button onClick={handleNextPhoto} aria-label="Next photo">&#10095;</button>
                            </div>
                          )}
                        </div>
                        
                        <p className="station-address">{selectedStationPopup.address}</p>
                        
                        {selectedStationPopup.isCompatible !== undefined && (
                          <div className="compatibility-status">
                            <span className={selectedStationPopup.isCompatible ? 'compatible-text' : 'not-compatible-text'}>
                              {selectedStationPopup.isCompatible ? '✓ Compatible with your vehicle' : '✕ May not be compatible'}
                            </span>
                          </div>
                        )}
                        
                        <div className="details-section">
                          <h3>Charging Options</h3>
                          <div className="charges-grid">
                            {selectedStationPopup.chargerTypes && selectedStationPopup.chargerTypes.map(type => (
                              <div key={type} className="charge-type">
                                <span className="charge-type-name">{type}</span>
                                <span className="charge-type-details">
                                  {selectedStationPopup.power || '7.4'} kW - ₹{selectedStationPopup.pricePerKwh || '10'}/kWh
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {selectedStationPopup.amenities && selectedStationPopup.amenities.length > 0 && (
                          <div className="details-section">
                            <h3>Amenities</h3>
                            <div className="amenities-grid">
                              {selectedStationPopup.amenities.map((amenity, index) => (
                                <span key={index} className="amenity-tag">{amenity}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="action-buttons">
                          <button 
                            className="btn-action btn-directions"
                            onClick={() => {
                              if (userLocation) {
                                const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedStationPopup.latitude},${selectedStationPopup.longitude}`;
                                window.open(url, '_blank');
                              }
                            }}
                            disabled={!userLocation}
                          >
                            <FaDirections /> Get Directions
                          </button>
                          
                          <button 
                            className="booking-cta"
                            onClick={() => handleBookStation(selectedStationPopup)}
                            disabled={selectedStationPopup.status !== 'Available'}
                          >
                            {selectedStationPopup.status === 'Available' ? 'Book Now' : 'Currently Unavailable'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Map>
              )}
              
              {/* No Mapbox Token Warning */}
              {!MAPBOX_TOKEN && (
                <div className="map-loading-placeholder">
                  <div className="error-icon">⚠️</div>
                  <p>Map cannot be displayed. Mapbox token is missing.</p>
                </div>
              )}
              
              {/* No Vehicle Warning - if user needs to be guided to select one */}
              {!loading && !error && !userVehicle && filteredStations.length > 0 && (
                <div className="vehicle-missing-notice">
                  <p>To see compatible charging stations, please select your vehicle</p>
                  <button onClick={handleSelectVehicle} className="vehicle-select-button">
                    Select Vehicle
                  </button>
                </div>
              )}

              {/* Add a reminder banner even when user has vehicle selected */}
              {!loading && !error && viewMode === 'map' && userVehicle && (
                <div className="vehicle-info-banner">
                  <span>Current vehicle: {userVehicle.name}</span>
                  <button onClick={handleSelectVehicle} className="change-vehicle-button">
                    Change
                  </button>
                </div>
              )}
            </>
          )}

          {viewMode === 'list' && (
            <div className="stations-list-view-container mobile-optimized-list">
              {/* Mobile optimized filters */}
              <div className="enhanced-filter-bar mobile-optimized">
                <button 
                  className={`enhanced-filter-button ${showCompatibleOnly ? 'active' : ''}`}
                  onClick={toggleCompatibleFilter}
                >
                  {showCompatibleOnly ? 'Compatible' : 'All Chargers'}
                </button>
                
                <button 
                  className={`enhanced-filter-button ${showAvailableOnly ? 'active' : ''}`}
                  onClick={toggleAvailableFilter}
                >
                  {showAvailableOnly ? 'Available' : 'All Status'}
                </button>
                
                <button 
                  className={`enhanced-filter-button ${batteryRangeFilter ? 'active' : ''}`}
                  onClick={toggleBatteryRangeFilter}
                  disabled={!userVehicle || !userLocation}
                >
                  <FaBatteryHalf /> {estimatedRange} km
                </button>
                
                <button 
                  className="enhanced-filter-button"
                  onClick={toggleFilterDropdown}
                >
                  Charger Type
                </button>
                
                <button 
                  className="enhanced-filter-button"
                  onClick={toggleSortDropdown}
                >
                  <FaSort /> Sort
                </button>
              </div>
              
              {/* Loading and Error States */}
              {loading && (
                <div className="enhanced-loading-state mobile-optimized">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="skeleton-station-card">
                      <div className="skeleton-header"></div>
                      <div className="skeleton-content"></div>
                    </div>
                  ))}
                </div>
              )}
              
              {error && (
                <div className="enhanced-error-state">
                  <div className="error-icon">⚠️</div>
                  <h3>Unable to Load Stations</h3>
                  <p>{error}</p>
                  <button onClick={() => {
                    setLoading(true);
                    setError(null);
                    getAllStations()
                      .then(data => {
                        setRawStations(data);
                        setLoading(false);
                      })
                      .catch(err => {
                        console.error("Error fetching stations:", err);
                        setError('Failed to load stations. Please try again.');
                        setLoading(false);
                      });
                  }}>Try Again</button>
                </div>
              )}
              
              {!loading && !error && (
                <>
                  {/* Recently Viewed Stations - Horizontal Scrollable */}
                  {recentStations.length > 0 && (
                    <div className="recent-stations-section-mobile">
                      <h3>Recently Viewed</h3>
                      <div className="recent-stations-list-mobile">
                        {recentStations.map(station => (
                          <StationCard 
                            key={`recent-${station.id}`} 
                            station={station} 
                            onClick={handleMarkerClick}
                            isMobile={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                
                  {/* Group Stations by Distance */}
                  {filteredStations.length > 0 ? (
                    <div className="grouped-stations">
                      {(() => {
                        // Group stations by distance ranges
                        const groupedStations = {
                          'Nearby (< 5km)': [],
                          'Within 15km': [],
                          'Further Away (15km+)': []
                        };
                        
                        filteredStations.forEach(station => {
                          const distance = station.distance || 0;
                          if (distance < 5) {
                            groupedStations['Nearby (< 5km)'].push(station);
                          } else if (distance < 15) {
                            groupedStations['Within 15km'].push(station);
                          } else {
                            groupedStations['Further Away (15km+)'].push(station);
                          }
                        });
                        
                        return Object.entries(groupedStations)
                          .filter(([, stations]) => stations.length > 0)
                          .map(([group, stations]) => (
                            <div key={group} className="station-group-mobile">
                              <h3 className="station-group-heading-mobile">{group}</h3>
                              <div className="station-group-list">
                                {stations.map(station => (
                                  <StationCard
                                    key={station.id}
                                    station={station}
                                    onClick={handleMarkerClick}
                                    isMobile={true}
                                  />
                                ))}
                              </div>
                            </div>
                          ));
                      })()}
                    </div>
                  ) : (
                    <div className="no-stations-message mobile-optimized">
                      <p>No charging stations match your criteria.</p>
                      <button 
                        className="reset-filters-button mobile-optimized" 
                        onClick={() => {
                          setShowCompatibleOnly(false);
                          setShowAvailableOnly(false);
                          setBatteryRangeFilter(false);
                          setSelectedChargerType('all');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Nearby Stations Bar - Renders only in map view and if user location is available */}
        {viewMode === 'map' && userLocation && nearbyStations.length > 0 && (
          <div className="nearby-stations-carousel-container">
            <div className="nearby-station-cards-scrollable">
              {nearbyStations.map(station => {
                // Generate station class name for brand-specific styling
                let stationClassName = '';
                if (station.name) {
                  if (station.name.includes('ChargeZone') || station.name.includes('JW Marriott')) {
                    stationClassName = 'chargezone-jw';
                  } else if (station.name.includes('TML')) {
                    stationClassName = 'tml';
                  } else {
                    stationClassName = station.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                  }
                }
                
                // Get first letter for icon
                let stationInitial = 'S';
                if (station.name) {
                  if (station.name.includes('ChargeZone') || station.name.includes('JW Marriott')) {
                    stationInitial = 'C';
                  } else if (station.name.includes('TML')) {
                    stationInitial = 'T';
                  } else {
                    stationInitial = station.name.charAt(0);
                  }
                }
                
                // Format distance to show km with proper spacing
                const distance = station.distance ? 
                  `${station.distance.toFixed(1)} km` : '';
                
                return (
                  <div 
                    key={station.id} 
                    className="nearby-station-card"
                    onClick={() => handleMarkerClick(station)}
                    title={`${station.name} (${station.distance ? station.distance.toFixed(1) + ' km' : 'Unknown distance'})`}
                  >
                    {/* Add access type tag */}
                    <span className={`station-access-type-tag ${(station.accessType || 'public').toLowerCase()}`}>
                      {station.accessType || 'Public'}
                    </span>
                    
                    <div className="card-content-wrapper">
                      <div className="card-left">
                        {/* Use brand-specific class */}
                        <div className={`station-brand-icon-placeholder ${stationClassName}`}>
                          {stationInitial}
                        </div>
                      </div>
                      <div className="card-main-details">
                        <h3>{station.name}</h3>
                        <p className="station-address-line">
                          {station.address ? 
                            (station.address.length > 30 ? 
                              station.address.substring(0, 30) + '...' : 
                              station.address) : 
                            'Address unavailable'
                          }
                        </p>
                        {/* Fix status display */}
                        <p className={`station-availability ${
                          station.status === 'Available' ? 'status-available' : 
                          station.status === 'Occupied' ? 'status-unavailable' : 
                          'status-unknown'
                        }`}>
                          {station.status || 'Status N/A'} 
                          {station.status === 'Available' && <FaCheck className="available-check-icon"/>}
                        </p>
                      </div>
                      <div className="card-right-details">
                        {/* Show rating only if available */}
                        {station.rating && (
                          <div className="station-rating-placeholder actual-rating">
                            <span>{station.rating}</span>
                            <span className="star-icon">★</span>
                          </div>
                        )}
                        <p className="station-distance">{distance}</p>
                        <div className="station-charger-types">
                          {station.chargerTypes && station.chargerTypes.slice(0, 2).map(type => (
                            <span key={type} className="charger-type-badge">{type}</span>
                          ))}
                          {station.chargerTypes && station.chargerTypes.length > 2 && 
                            <span className="charger-type-badge">+{station.chargerTypes.length - 2}</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-navigation">
        {[ 
          { name: 'Map', icon: <FaMapMarkedAlt size={22} /> },
          { name: 'Trips', icon: <FaRoute size={22} /> },
          { name: 'Profile', icon: <FaUserCircle size={22} /> },
        ].map(item => (
          <button 
            key={item.name} 
            className={`bottom-nav-item ${activeBottomNav === item.name ? 'active' : ''}`}
            onClick={() => handleBottomNavClick(item.name)}
          >
            {item.icon}
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      
      {/* Mobile Station Details Bottom Sheet */}
      {selectedStationPopup && (
        <div className={`enhanced-station-details mobile-sheet ${isMobileDetailsOpen ? 'open' : ''}`}>
          <div className="details-header">
            <h2>{selectedStationPopup.name}</h2>
            <button className="close-details" onClick={() => setIsMobileDetailsOpen(false)}>×</button>
          </div>
          <div className="details-content">
            {/* Station photos carousel - use dummy image if no photos available */}
            <div className="station-photos">
              <img 
                src={selectedStationPopup.photos && selectedStationPopup.photos.length > 0 
                  ? selectedStationPopup.photos[photoIndex] 
                  : `https://via.placeholder.com/400x200?text=${encodeURIComponent(selectedStationPopup.name)}`} 
                alt={selectedStationPopup.name}
              />
              {selectedStationPopup.photos && selectedStationPopup.photos.length > 1 && (
                <div className="photo-nav">
                  <button onClick={handlePrevPhoto} aria-label="Previous photo">&#10094;</button>
                  <button onClick={handleNextPhoto} aria-label="Next photo">&#10095;</button>
                </div>
              )}
            </div>
            
            <p className="station-address">{selectedStationPopup.address}</p>
            
            {selectedStationPopup.isCompatible !== undefined && (
              <div className="compatibility-status">
                <span className={selectedStationPopup.isCompatible ? 'compatible-text' : 'not-compatible-text'}>
                  {selectedStationPopup.isCompatible ? '✓ Compatible with your vehicle' : '✕ May not be compatible'}
                </span>
              </div>
            )}
            
            <div className="details-section">
              <h3>Charging Options</h3>
              <div className="charges-grid">
                {selectedStationPopup.chargerTypes && selectedStationPopup.chargerTypes.map(type => (
                  <div key={type} className="charge-type">
                    <span className="charge-type-name">{type}</span>
                    <span className="charge-type-details">
                      {selectedStationPopup.power || '7.4'} kW - ₹{selectedStationPopup.pricePerKwh || '10'}/kWh
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedStationPopup.amenities && selectedStationPopup.amenities.length > 0 && (
              <div className="details-section">
                <h3>Amenities</h3>
                <div className="amenities-grid">
                  {selectedStationPopup.amenities.map((amenity, index) => (
                    <span key={index} className="amenity-tag">{amenity}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="action-buttons">
              <button 
                className="btn-action btn-directions"
                onClick={() => {
                  if (userLocation) {
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedStationPopup.latitude},${selectedStationPopup.longitude}`;
                    window.open(url, '_blank');
                  }
                }}
                disabled={!userLocation}
              >
                <FaDirections /> Get Directions
              </button>
              
              <button 
                className="booking-cta"
                onClick={() => handleBookStation(selectedStationPopup)}
                disabled={selectedStationPopup.status !== 'Available'}
              >
                {selectedStationPopup.status === 'Available' ? 'Book Now' : 'Currently Unavailable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
