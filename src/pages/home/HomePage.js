import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Map, { NavigationControl, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { indianCities, formatCurrency } from '../../utils/formatters';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig';
import { useAuth } from '../../contexts/AuthContext';
import { getAllStations, getStationsByCity } from '../../services/dataService';
import './HomePage.css';

// Log token availability for debugging
console.log("Mapbox token directly imported:", MAPBOX_TOKEN ? "Yes" : "No");

// Helper function to ensure we always have an array
const ensureArray = (possibleArray) => {
  if (!possibleArray) return [];
  return Array.isArray(possibleArray) ? possibleArray : [];
};

// Helper function to safely handle array or null values
const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  // If it's a single value, wrap it in an array
  return [value];
};

/**
 * HomePage Component:
 * A public landing page for the application.
 */
const HomePage = () => {
  // First initialize all hooks that don't depend on others
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // State for mobile menu
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
  const [nearestStations, setNearestStations] = useState([]); // State for nearest stations
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [isSearching, setIsSearching] = useState(false); // State to track search status
  const [geolocationError, setGeolocationError] = useState(null); // State for geolocation errors

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

  // Function to get valid coordinates for stations - fixed for Firebase data structure
  // Wrapped in useCallback and moved before usage in useEffect
  const getValidCoordinates = useCallback((station) => {
    // First check for direct number values (as shown in Firebase)
    if (typeof station.latitude === 'number' && typeof station.longitude === 'number') {
      // Numbers coming directly from Firebase
      if (station.latitude !== 0 && station.longitude !== 0) {
        return {
          latitude: station.latitude,
          longitude: station.longitude
        };
      }
    }
    
    // Check for string values that need parsing
    if (station.latitude && station.longitude) {
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);
      
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return {
          latitude: lat,
          longitude: lng
        };
      }
    }
    
    // Otherwise, use city center coordinates as fallback with wider distribution
    if (station.city) {
      const cityName = station.city.toLowerCase();
      
      // More deterministic distribution with station ID as seed
      const getStationPosition = (stationId, cityCoords) => {
        // Create a simple hash from the station ID or name
        const hash = typeof stationId === 'string' ? 
          stationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) :
          stationId || Math.floor(Math.random() * 1000);
        
        // Create a predictable but distributed angle (0-360 degrees)
        const angle = (hash % 360) * (Math.PI / 180);
        
        // Distance from city center (0.5km to 3km)
        const distance = 0.5 + (hash % 25) / 10; // 0.5km to 3km
        
        // Convert to lat/lng offsets using trigonometry
        const latOffset = Math.sin(angle) * distance * 0.009; // ~1km = 0.009 degrees latitude
        const lngOffset = Math.cos(angle) * distance * 0.009 / Math.cos(cityCoords.lat * Math.PI / 180);
        
        return {
          latitude: cityCoords.lat + latOffset,
          longitude: cityCoords.lng + lngOffset
        };
      };
      
      // Check if we have coordinates for this city
      for (const [key, coords] of Object.entries(cityLocations)) {
        if (cityName.includes(key) || key.includes(cityName)) {
          return getStationPosition(station.id, coords);
        }
      }
    }
    
    // If no match found, use a better scatter pattern based on station ID
    console.warn(`No valid coordinates for station: ${station.name || 'Unknown'} (${station.id || 'No ID'})`);
    
    // Use selected city coordinates
    const cityCoords = cityLocations[selectedCity.toLowerCase()] || cityLocations.pune;
    
    // Generate a relatively unique ID for this station if none exists
    const uniqueId = station.id || station.name?.replace(/\s+/g, '') || Math.random().toString(36).substring(2, 10);
    
    // Create a scattered pattern with distance increasing from center
    const hashCode = String(uniqueId).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const angle = Math.abs(hashCode % 360) * (Math.PI / 180);
    const distance = (Math.abs(hashCode) % 30) / 10 + 1; // 1-4km
    
    return {
      latitude: cityCoords.lat + (Math.sin(angle) * 0.009 * distance),
      longitude: cityCoords.lng + (Math.cos(angle) * 0.009 * distance / Math.cos(cityCoords.lat * Math.PI / 180))
    };
  }, [selectedCity, cityLocations]); // Dependencies for getValidCoordinates

  // Calculate distance between two points (Haversine formula)
  // Wrapped in useCallback and moved before usage in useEffect
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
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
  }, []); // Empty dependency array as it's a pure function

  // Fetch all stations when component loads
  useEffect(() => {
    const loadStations = async () => {
      try {
        console.log('🔍 Starting to load stations...');
        setLoading(true);
        const stations = await getAllStations();
        console.log('📊 Stations fetched:', stations ? stations.length : 0, 'stations');
        console.log('📋 First station (sample):', stations && stations.length ? stations[0] : 'No stations');
        setAllStations(stations || []);
        
        // Set current city stations
        const cityStations = await getStationsByCity(selectedCity);
        console.log(`📍 ${selectedCity} stations:`, cityStations ? cityStations.length : 0, 'stations');
        setCurrentCityStations(cityStations || []);
      } catch (error) {
        console.error('❌ Error loading stations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStations();
  }, []);

  // Render debug info in development mode
  const renderDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div style={{
        margin: '20px 0',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <h4>Debug Information</h4>
        <p>All Stations: {allStations?.length || 0}</p>
        <p>Current City Stations: {currentCityStations?.length || 0}</p>
        <p>Selected City: <strong>{selectedCity}</strong></p>
        <p>Location Found: {locationFound ? 'Yes' : 'No'}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button onClick={() => console.log('All Stations:', allStations)}>
            Log All Stations
          </button>
          <button onClick={() => {
            // Show cities from all stations
            const cities = [...new Set(allStations.map(s => s.city))];
            console.log('Available cities:', cities);
          }}>
            Log Available Cities
          </button>
          <button onClick={async () => {
            // Force reload city data
            console.log(`Manual reload for city: ${selectedCity}`);
            const cityStations = await getStationsByCity(selectedCity);
            setCurrentCityStations(cityStations);
            console.log(`Reloaded ${cityStations.length} stations`);
          }} style={{ backgroundColor: '#28a745', color: 'white' }}>
            Reload City Data
          </button>
        </div>
        
        {/* Show cities from data with buttons to select each */}
        <div style={{ marginTop: '10px' }}>
          <p><strong>Cities in Data:</strong></p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {[...new Set(allStations.map(s => s.city))]
              .filter(Boolean)
              .map(cityName => (
                <button 
                  key={cityName} 
                  onClick={() => handleCityChange(cityName)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: cityName.toLowerCase() === selectedCity.toLowerCase() ? '#007bff' : '#e9ecef',
                    color: cityName.toLowerCase() === selectedCity.toLowerCase() ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {cityName}
                </button>
              ))
            }
          </div>
        </div>
        
        {allStations?.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <p><strong>First Station Sample:</strong></p>
            <pre style={{ 
              background: '#f0f0f0', 
              padding: '5px', 
              fontSize: '12px',
              maxHeight: '100px',
              overflow: 'auto' 
            }}>
              {JSON.stringify(allStations[0], null, 2)}
            </pre>
            <p>
              <strong>Coordinate Status:</strong> {' '}
              {allStations.filter(s => s.latitude === 0 || s.longitude === 0).length} stations with zero coordinates
            </p>
          </div>
        )}
      </div>
    );
  };

  // Event handlers
  const handleCityChange = async (city) => {
    // Ensure we normalize city name to lowercase for lookup
    const cityLower = city.toLowerCase();
    setSelectedCity(city); // Keep original city case for display
    
    // Find the location coordinates - handle case differences
    const cityCoords = cityLocations[cityLower] || 
                      cityLocations[Object.keys(cityLocations).find(key => 
                        key.toLowerCase() === cityLower || 
                        cityLower.includes(key) ||
                        key.includes(cityLower)
                      )];

    // Log warning and use default if city coordinates not found
    if (!cityCoords) {
      console.warn(`⚠️ City coordinates not found for: ${city}`);
      console.log('Available city keys:', Object.keys(cityLocations));
      // Use Pune as fallback
      setUserLocation(cityLocations.pune);
    } else {
      setUserLocation(cityCoords);
    }
    
    setSelectedStation(null);
    
    try {
      setLoading(true);
      console.log(`🔄 Changing city to: ${city}`);
      
      // Get stations for the selected city
      const cityStations = await getStationsByCity(city);
      console.log(`📊 Retrieved ${cityStations.length} stations for ${city}`);
      
      // Add fallback logic if no stations found
      if (cityStations.length === 0) {
        console.log(`⚠️ No stations found for ${city}, showing all nearby stations instead`);
        
        // Get all stations and filter by proximity to city center
        const allStations = await getAllStations();
        
        // Use the found city coordinates or default to Pune
        const targetCoords = cityCoords || cityLocations.pune;
        
        const stationsWithDistance = allStations.map(station => {
          const distance = calculateDistance(
            targetCoords.lat,
            targetCoords.lng,
            station.latitude || station.lat || 0,
            station.longitude || station.lng || 0
          );
          return { ...station, distance };
        });
        
        // Get the closest 10 stations to this city's center
        const nearbyStations = stationsWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10);
        
        console.log(`📍 Showing ${nearbyStations.length} nearby stations instead`);
        setCurrentCityStations(nearbyStations);
      } else {
        setCurrentCityStations(cityStations);
      }
      
      // Only update map view if city coordinates were found
      if (cityCoords) {
        setViewState({
          longitude: cityCoords.lng,
          latitude: cityCoords.lat,
          zoom: 12,
          bearing: 0,
          pitch: 0,
          transitionDuration: 1000
        });
      }
    } catch (error) {
      console.error(`❌ Error loading stations for ${city}:`, error);
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
          setLoading(false); // Set loading to false after location found and processed
        },
        (error) => {
          console.error('Error getting location:', error);
          let message = 'Could not retrieve your location.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location permission denied. Cannot show nearest stations.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Location information is unavailable.';
          } else if (error.code === error.TIMEOUT) {
            message = 'Location request timed out.';
          }
          setGeolocationError(message);
          setLocationFound(false);
          setLoading(false); // Also set loading to false on error to allow map to attempt render with default
        }
      );
    } else {
      setGeolocationError('Geolocation is not supported by your browser.');
      // Geolocation not supported, set loading to false to allow render with defaults
      setLoading(false);
    }
  }, []);

  // Effect to calculate and set nearest stations
  useEffect(() => {
    if (locationFound && userLocation && allStations.length > 0) {
      const stationsWithDistances = allStations.map(station => {
        const stationCoords = getValidCoordinates(station);
        if (stationCoords.latitude === undefined || stationCoords.longitude === undefined) {
          return { ...station, distance: Infinity }; // Put stations with no coords last
        }
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          stationCoords.latitude,
          stationCoords.longitude
        );
        return { ...station, distance };
      }).filter(station => station.distance !== null && !isNaN(station.distance));

      stationsWithDistances.sort((a, b) => a.distance - b.distance);
      setNearestStations(stationsWithDistances.slice(0, 5)); // Show top 5 nearest
    } else {
      setNearestStations([]); // Clear if no location or no stations
    }
  }, [userLocation, allStations, locationFound, calculateDistance, getValidCoordinates]); // Added calculateDistance and getValidCoordinates to deps

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission if wrapped in a form
    const query = searchQuery.trim().toLowerCase();
    
    if (!query) {
      // If search is cleared, reset to selected city view
      setIsSearching(false);
      handleCityChange(selectedCity); // Reload current city stations
      return;
    }

    setIsSearching(true);
    setLoading(true); // Show loading indicators

    console.log(`🔍 Searching for: "${query}"`);

    // Simulate search by filtering allStations (replace with backend search in production)
    const results = allStations.filter(station => 
      (station.name && station.name.toLowerCase().includes(query)) ||
      (station.address && station.address.toLowerCase().includes(query)) ||
      (station.city && station.city.toLowerCase().includes(query))
    );

    console.log(`📊 Found ${results.length} results`);
    setCurrentCityStations(results);

    // Update map view to focus on the first result, if any
    if (results.length > 0) {
      const firstResultCoords = getValidCoordinates(results[0]);
      if (firstResultCoords.latitude && firstResultCoords.longitude) {
        setViewState({
          longitude: firstResultCoords.longitude,
          latitude: firstResultCoords.latitude,
          zoom: 14, // Zoom closer for search results
          bearing: 0,
          pitch: 0,
          transitionDuration: 1000 
        });
      }
    } else {
      // Optional: Handle no results (e.g., keep current view or show wider view)
      console.log('No stations found for the search query.');
      // Maybe show a notification to the user
    }

    setLoading(false); // Hide loading indicators
  };

  // Placeholder skeleton component for station cards
  const StationCardSkeleton = () => (
    <div className="station-card station-card-skeleton">
      <div className="skeleton skeleton-image"></div>
      <div className="station-content">
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text short"></div>
        <div className="skeleton skeleton-details"></div>
        <div className="skeleton skeleton-cta"></div>
      </div>
    </div>
  );

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
          {/* Hamburger Menu Icon - visible on mobile */}
          <button className={`hamburger-menu ${mobileMenuOpen ? 'open' : ''}`} onClick={toggleMobileMenu} aria-label="Toggle navigation menu" aria-expanded={mobileMenuOpen}>
            <div></div>
            <div></div>
            <div></div>
          </button>
          <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#about" className="nav-item" onClick={() => { if(mobileMenuOpen) toggleMobileMenu(); scrollToSection(aboutRef); }}>
              About
            </a>
            <a 
              href="#stations" 
              className="nav-item"
              onClick={(e) => { e.preventDefault(); if(mobileMenuOpen) toggleMobileMenu(); scrollToSection(stationsRef); }}
            >
              Stations
            </a>
            <a 
              href="#how-it-works" 
              className="nav-item"
              onClick={(e) => { e.preventDefault(); if(mobileMenuOpen) toggleMobileMenu(); scrollToSection(howItWorksRef); }}
            >
              How it Works
            </a>
            
            {/* Conditional rendering based on authentication status */}
            {currentUser ? (
              <div className="profile-menu-container" ref={profileRef}>
                <div className="profile-button" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
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
                      <button onClick={() => { if(mobileMenuOpen) toggleMobileMenu(); handleLogout(); }} className="logout-button">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login" onClick={() => { if(mobileMenuOpen) toggleMobileMenu(); }}>Login</Link>
                <Link to="/signup" className="btn-signup" onClick={() => { if(mobileMenuOpen) toggleMobileMenu(); }}>Sign Up</Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-banner">
        <div className="container">
          <div className="hero-content">
            <h1>Find EV Charging Stations Near You</h1>
            <p>Discover convenient and reliable charging stations for your electric vehicle across Pune and beyond.</p>
            
            {/* Search Bar Added */}
            <form onSubmit={handleSearchSubmit} className="search-bar-container">
              <input 
                type="text" 
                className="search-input"
                placeholder="Search by City, Station Name, Address..."
                value={searchQuery}
                onChange={handleSearchInputChange}
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </form>

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

      {/* Map Section */}
      <section id="stations" ref={stationsRef} className="map-section">
        <div className="container">
          {/* City Selector UI */}
          <div className="city-selector-container">
            <h3>Select a City:</h3>
            <div className="cities-buttons-grid">
              {Object.keys(cityLocations).map((cityName) => (
                <button
                  key={cityName}
                  className={`city-button ${selectedCity.toLowerCase() === cityName.toLowerCase() ? 'active' : ''}`}
                  onClick={() => handleCityChange(cityName)}
                >
                  {cityName.charAt(0).toUpperCase() + cityName.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <h2>EV Charging Stations in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h2>
          <p className="section-intro">Below is a map of available charging stations. Click on any marker to see details.</p>
          <div className="map-container" id="map-container">
            {/* Map Loading Placeholder */}
            {loading && (
              <div className="map-loading-placeholder">
                <div className="spinner"></div>
                <p>Loading Map & Stations...</p>
              </div>
            )}
            {!loading && (
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl position="top-right" />
                
                {/* Add markers for charging stations with better null checking */}
                {ensureArray(currentCityStations).map(station => {
                  // Get valid coordinates for this station
                  const coords = getValidCoordinates(station);
                  
                  return (
                    <Marker
                      key={station.id || `marker-${Math.random()}`}
                      longitude={coords.longitude}
                      latitude={coords.latitude}
                      anchor="bottom"
                    >
                      <div 
                        className="map-marker" 
                        style={{ 
                          cursor: 'pointer',
                          color: selectedStation && selectedStation.id === station.id ? '#ff6b6b' : '#4a90e2'
                        }}
                        onClick={(e) => {
                          // Even more robustly stop propagation
                          if (e && typeof e.stopPropagation === 'function') {
                            e.stopPropagation();
                          }
                          if (e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
                            e.originalEvent.stopPropagation();
                          }
                          handleMarkerClick(station);
                        }}
                      >
                        📍
                      </div>
                    </Marker>
                  );
                })}
                
                {/* Add popup for selected station */}
                {selectedStation && showPopup && (
                  <Popup
                    longitude={getValidCoordinates(selectedStation).longitude}
                    latitude={getValidCoordinates(selectedStation).latitude}
                    anchor="bottom"
                    onClose={() => setShowPopup(false)}
                    closeOnClick={false}
                    className="station-popup"
                    style={{ maxWidth: '300px' }}
                  >
                    <div className="popup-content">
                      <h3>{selectedStation.name || 'EV Charging Station'}</h3>
                      <div className="popup-rating">
                        <span>★</span> {selectedStation.rating || '4.0'}
                      </div>
                      <p className="popup-address">{selectedStation.address || 'Location information not available'}</p>
                      <div className="popup-details">
                        <p><strong>Type:</strong> {selectedStation.type || 'Standard'}</p>
                        <p><strong>Power:</strong> {selectedStation.power ? `${selectedStation.power} kW` : 'Variable'}</p>
                        <p><strong>Price:</strong> {selectedStation.pricePerKwh ? `₹${selectedStation.pricePerKwh}/kWh` : 'Contact station'}</p>
                        <p><strong>Hours:</strong> {selectedStation.hours || '24 hours'}</p>
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
                            handleViewDetails(selectedStation);
                            setShowPopup(false);
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
          </div>
        </div>
      </section>

      {/* Stations List Section */}
      <section className="stations-list-section">
        <div className="container">
          {/* Title changes based on search state */}
          <h2>{isSearching ? `Search Results for "${searchQuery}"` : `Charging Stations in ${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}`}</h2>
          
          {/* Stations Loading Placeholder -> Replaced with Skeletons */}
          {loading && (
            <div className="stations-grid stations-loading-skeletons">
              {[...Array(6)].map((_, index) => <StationCardSkeleton key={index} />)} 
            </div>
          )}

          {!loading && currentCityStations?.length === 0 && (
             <p className="no-stations-message">
                {isSearching ? "No stations found matching your search." : `No stations currently listed for ${selectedCity}.`}
            </p>
          )}

          {!loading && currentCityStations?.length > 0 && (
            <div className="stations-grid">
              {currentCityStations.map(station => (
                <div key={station.id || `station-${Math.random()}`} id={`station-${station.id}`} className="station-card">
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
                    <div className="station-rating">
                      <span className="star-icon">★</span>
                      {station.rating}
                    </div>
                  </div>
                  <div className="station-content">
                    <h3>{station.name}</h3>
                    <p className="address">{station.address}</p>
                    <div className="station-details">
                      <div className="detail">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{station.type || 'Standard'}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Power:</span>
                        <span className="detail-value">{station.power ? `${station.power} kW` : 'Variable'}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value"> 
                          {station.pricePerKwh ? `₹${station.pricePerKwh}/kWh` : 'Contact station'}
                        </span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Hours:</span>
                        <span className="detail-value">{station.hours || '24 hours'}</span>
                      </div>
                    </div>
                    <div className="station-amenities">
                      <span className="detail-label">Amenities:</span>
                      <div className="amenity-tags">
                        {safeArray(station.amenities).length > 0 ? (
                          safeArray(station.amenities).map((amenity, idx) => (
                            <span key={idx} className="amenity-tag">{amenity}</span>
                          ))
                        ) : (
                          <span>Not available</span>
                        )}
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
          )}
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

      {/* Geolocation Error Message - Conditionally Rendered */}
      {geolocationError && !locationFound && (
         <section className="geolocation-error-section">
            <div className="container">
               <p className="geolocation-error-message">⚠️ {geolocationError}</p>
            </div>
         </section>
      )}

      {/* Nearest Stations Section - Conditionally Rendered */}
      {locationFound && nearestStations.length > 0 && (
        <section className="nearest-stations-section">
          <div className="container">
            <h2>Stations Near You</h2>
            <div className="stations-grid nearest-stations-grid"> 
              {nearestStations.map(station => (
                <div key={`nearest-${station.id}`} className="station-card nearest-station-card">
                  <div className="station-image">
                    <img 
                      src={
                        imageFallbackLevel[station.id] === 0 && station.image ? station.image :
                        imageFallbackLevel[station.id] === 1 && station.fallbackImage ? station.fallbackImage :
                        commonFallbackImage
                      }
                      alt={station.name || 'Charging Station'}
                      onError={() => handleImageError(station.id)}
                      onLoad={() => handleImageLoad(station.id)}
                      loading="lazy"
                    />
                    {station.rating && (
                      <div className="station-rating">
                        <span className="star-icon">★</span>
                        {station.rating}
                      </div>
                    )}
                  </div>
                  <div className="station-content">
                    <h3>{station.name || 'EV Station'}</h3>
                    <p className="address">{station.address || 'Address not available'}</p>
                    {station.distance !== undefined && (
                      <p className="distance-info">
                        <strong>Distance:</strong> {station.distance.toFixed(1)} km away
                      </p>
                    )}
                    <div className="station-details">
                      <div className="detail">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{station.type || 'Standard'}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Power:</span>
                        <span className="detail-value">{station.power ? `${station.power} kW` : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="station-cta">
                      <button onClick={() => handleBookNow(station.id)} className="btn-book">
                        Book Now
                      </button>
                      <button onClick={() => handleLocateOnMap(station)} className="btn-locate">
                        Details & Map
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
  );
};

export default HomePage;