import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Map, { NavigationControl, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { indianCities } from '../../utils/formatters';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig';
import { useAuth } from '../../contexts/AuthContext';
import { getAllStations, getStationsByCity } from '../../services/dataService';
import StationCard from '../../components/StationCard/StationCard';
import StationsListSection from '../../components/StationsListSection/StationsListSection';
import useParallax from '../../hooks/useParallax';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import CostEstimator from '../../components/CostEstimator/CostEstimator';
import AiAssistantChat from '../../components/AiAssistantChat/AiAssistantChat';
import SEO from '../../components/SEO/SEO';
import './HomePage.css';

// Lazy load MapSection
const MapSection = React.lazy(() => import('../../components/MapSection/MapSection'));

// Log token availability for debugging
console.log("Mapbox token directly imported:", MAPBOX_TOKEN ? "Yes" : "No");

/**
 * HomePage Component:
 * A public landing page for the application.
 */
const HomePage = () => {
  // First initialize all hooks that don't depend on others
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, logout } = useAuth();

  // Check for Firebase Auth action URLs and redirect to password reset page
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    if ((mode === 'resetPassword' || mode === 'action') && oobCode) {
      // Redirect to password reset page with the URL parameters
      navigate(`/reset-password?mode=${mode}&oobCode=${oobCode}`, { replace: true });
    }
  }, [searchParams, navigate]);
  const parallaxHeroContentRef = useParallax({ speed: 0.3, disableOnMobile: true });

  // State for page load animations
  const [pageLoaded, setPageLoaded] = useState(false);
  useEffect(() => {
    // Brief delay to allow initial render then trigger load animations
    const timer = setTimeout(() => setPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Refs for sections to animate on scroll
  const aboutSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const howItWorksSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  // const mapSectionContainerRef = useIntersectionObserver({ threshold: 0.1, triggerOnce: true }); // For MapSection wrapper
  // const stationsListTitleRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true }); // For StationsListSection Title
  const nearestStationsSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const footerRef = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
  const evTipsSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true }); // Observer for EV Tips
  const costEstimatorSectionRef = useIntersectionObserver({ threshold: 0.1, triggerOnce: true }); // Observer for Cost Estimator

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
  const [currentEvTip, setCurrentEvTip] = useState(''); // State for EV Tip
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null); // Ref for search input
  const [isChatOpen, setIsChatOpen] = useState(false); // State for AI Chat window
  const [hasUnreadAiMessages, setHasUnreadAiMessages] = useState(false); // State for AI new message badge
  const [initialGeolocationAttempted, setInitialGeolocationAttempted] = useState(false); // New state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorType, setCursorType] = useState('default'); // For different cursor states
  // Stats counters state
  const [counters, setCounters] = useState({
    stations: { value: 0, target: 1000, counted: false },
    cities: { value: 0, target: 25, counted: false },
    users: { value: 0, target: 5000, counted: false },
  });
  // Refs for counter elements
  const stationsCounterRef = useRef(null);
  const citiesCounterRef = useRef(null);
  const usersCounterRef = useRef(null);

  // Common fallback image that's guaranteed to exist
  const commonFallbackImage = '/images/charging-stations/commonoimage.jpg';

  // Define city locations - MEMOIZED
  const cityLocations = useMemo(() => ({
    pune: indianCities.pune,
    delhi: indianCities.delhi,
    mumbai: indianCities.mumbai,
    bangalore: indianCities.bangalore,
    chennai: indianCities.chennai,
    hyderabad: indianCities.hyderabad
  }), []); // Empty dependency array as indianCities is a static import

  // Add EV tips data
  const evTips = useMemo(() => [
    "Regularly check your EV's tire pressure. Properly inflated tires can improve efficiency and range.",
    "Precondition your EV's cabin while it's still plugged in to save battery charge, especially in extreme weather.",
    "Smooth acceleration and deceleration significantly extend your EV's range.",
    "Using regenerative braking effectively can recapture a surprising amount of energy.",
    "Understand your EV's optimal charging speed; consistently using the fastest possible DC chargers isn't always best for battery longevity.",
    "Keep your EV's software updated for potential performance and feature improvements.",
    "Plan your routes for longer trips, noting charging station availability and types.",
    "Even a small amount of daily charging can be more beneficial for battery health than deep discharging and full recharging.",
    "Lighten your load. Unnecessary weight in your EV reduces its range.",
    "Most public chargers require an app or RFID card. Set these up beforehand for convenience."
  ], []);

  // Function to show a new random EV tip
  const showNextTip = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * evTips.length);
    setCurrentEvTip(evTips[randomIndex]);
  }, [evTips]);

  // Effect to set an initial EV tip on load
  useEffect(() => {
    if (evTips.length > 0) {
      showNextTip();
    }
  }, [evTips, showNextTip]);

  // Calculate distance between two points (Haversine formula)
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
  }, []);

  // Memoize getValidCoordinates as well, as it's used in handleCityChange indirectly (via setViewState in handleSearchSubmit, if results[0] is used)
  // and potentially other places. It depends on selectedCity and cityLocations.
  const getValidCoordinates = useCallback((station) => {
    // First check for direct number values (as shown in Firebase)
    if (typeof station.latitude === 'number' && typeof station.longitude === 'number') {
      if (station.latitude !== 0 && station.longitude !== 0) {
        return { latitude: station.latitude, longitude: station.longitude };
      }
    }
    if (station.latitude && station.longitude) {
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return { latitude: lat, longitude: lng };
      }
    }
    const cityForFallback = station.city ? station.city.toLowerCase() : selectedCity.toLowerCase();
    const cityCoords = cityLocations[cityForFallback] || 
                       cityLocations[Object.keys(cityLocations).find(key => 
                         key.toLowerCase() === cityForFallback || 
                         cityForFallback.includes(key) ||
                         key.includes(cityForFallback)
                       )] || cityLocations.pune;
    const getStationPosition = (stationId, baseCoords) => {
        const hash = typeof stationId === 'string' ? 
          stationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) :
          stationId || Math.floor(Math.random() * 1000);
        const angle = (hash % 360) * (Math.PI / 180);
      const distance = 0.5 + (hash % 25) / 10;
      const latOffset = Math.sin(angle) * distance * 0.009;
      const lngOffset = Math.cos(angle) * distance * 0.009 / Math.cos(baseCoords.lat * Math.PI / 180);
      return { latitude: baseCoords.lat + latOffset, longitude: baseCoords.lng + lngOffset };
      };
    return getStationPosition(station.id || station.name, cityCoords);
  }, [selectedCity, cityLocations]);

  const handleCityChange = useCallback(async (city) => {
    try {
      if (!city) {
        console.error('[HomePage] handleCityChange called with empty city');
        return;
      }
      
      console.log('[HomePage] handleCityChange called with city:', city);
      
      // Normalize city name to lowercase for consistency
      const cityLower = String(city).toLowerCase();
      // Set selected city first to update UI immediately
      setSelectedCity(cityLower);
      
      // Find city coordinates - with safeguards
      let targetCityCoords = cityLocations[cityLower];
      
      // Fallback for cities not directly in cityLocations
      if (!targetCityCoords) {
        const matchedCityKey = Object.keys(cityLocations).find(key => 
          key.toLowerCase() === cityLower || 
          cityLower.includes(key.toLowerCase()) ||
          key.toLowerCase().includes(cityLower)
        );
        
        if (matchedCityKey) {
          targetCityCoords = cityLocations[matchedCityKey];
        }
      }
      
      // Set user location based on city coordinates
      if (!targetCityCoords) {
        console.log('[HomePage] No target coords found, falling back to pune');
        setUserLocation(cityLocations.pune);
      } else {
        setUserLocation(targetCityCoords);
        
        // Update map view to focus on selected city
        setViewState({
          longitude: targetCityCoords.lng,
          latitude: targetCityCoords.lat,
          zoom: 12, 
          bearing: 0, 
          pitch: 0, 
          transitionDuration: 1000
        });
      }
      
      // Reset selected station when changing city
      setSelectedStation(null);
      
      // Load stations for the selected city
      setLoading(true);
      console.log('[HomePage] Fetching stations for city:', cityLower);
      
      // Fetch stations for the city
      const cityStations = await getStationsByCity(cityLower);
      console.log('[HomePage] Stations fetched:', cityStations.length);
      
      if (cityStations.length === 0) {
        // No stations found for the city - get nearest stations instead
        const allStns = await getAllStations();
        const coordsForFallback = targetCityCoords || cityLocations.pune;
        
        const stationsWithDistance = allStns.map(station => {
          const stationCoords = getValidCoordinates(station);
          const distance = calculateDistance(
            coordsForFallback.lat, coordsForFallback.lng,
            stationCoords.latitude, stationCoords.longitude
          );
          return { ...station, distance };
        });
        
        const nearbyStations = stationsWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10);
          
        setCurrentCityStations(nearbyStations);
      } else {
        setCurrentCityStations(cityStations);
      }
    } catch (error) {
      console.error(`❌ Error in handleCityChange for ${city}:`, error);
    } finally {
      setLoading(false);
    }
  }, [cityLocations, calculateDistance, getValidCoordinates]);
  
  // Add this debugging effect to verify handleCityChange works on mount
  useEffect(() => {
    console.log('[HomePage] handleCityChange reference is valid:', typeof handleCityChange === 'function');
    console.log('[HomePage] Initial selectedCity:', selectedCity);
  }, [handleCityChange, selectedCity]);

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
    }
  };

  const handleImageLoad = (stationId) => {
    // setImagesLoaded(prev => ({
    //   ...prev,
    //   [stationId]: 'loaded'
    // }));
  };

  // Enhanced scrollToSection with smoother transitions
  const scrollToSection = (elementRef) => {
    if (elementRef && elementRef.current) {
      // Track the scroll starting position
      const startPosition = window.pageYOffset;
      const targetPosition = elementRef.current.offsetTop - 80; // Subtract header height
      const distance = targetPosition - startPosition;
      
      // Add animation class based on scroll direction
      const scrollDirection = distance > 0 ? 'scrolling-down' : 'scrolling-up';
      document.body.classList.add(scrollDirection);
      
      // Perform the smooth scroll
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      // Remove the animation class after the scroll completes
      setTimeout(() => {
        document.body.classList.remove(scrollDirection);
        
        // Add highlight effect to the target section
        if (elementRef.current) {
          elementRef.current.classList.add('section-highlight');
          setTimeout(() => {
            elementRef.current.classList.remove('section-highlight');
          }, 1000);
        }
      }, Math.min(Math.abs(distance), 1000)); // Base timeout on scroll distance, max 1 second
    }
  };

  // Add scroll event listener to animate sections on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      
      // Add scroll-based animation classes to elements with data-scroll attribute
      document.querySelectorAll('[data-scroll]').forEach(element => {
        const elementTop = element.getBoundingClientRect().top + scrollTop;
        const elementVisible = 150; // How many pixels from the top before the element becomes visible
        
        if (scrollTop > elementTop - windowHeight + elementVisible) {
          element.classList.add('scroll-visible');
        } else {
          element.classList.remove('scroll-visible');
        }
      });
    };
    
    // Initial check on component mount
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Other handlers
  const handleJoinNow = () => {
    if (currentUser) {
      navigate('/driver'); // Corrected: Navigate to /driver for the driver page
    } else {
      navigate('/signup');
    }
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

  // Update handleProfileNavigation function to properly handle all paths
  const handleProfileNavigation = (path) => {
    console.log(`Attempting to navigate to: ${path}`); // DEBUGGING LINE
    // Close the profile dropdown menu
    setProfileMenuOpen(false);
    
    // Also close mobile menu if open
    if(mobileMenuOpen) toggleMobileMenu();
    
    if (path === '/dashboard') {
      // Always navigate to /driver-dashboard as per request
      navigate('/driver-dashboard');
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
    // Only attempt geolocation if it hasn't been attempted yet
    if (!initialGeolocationAttempted) {
      console.log('[HomePage Geolocation] Attempting initial geolocation...');
      setInitialGeolocationAttempted(true); // Mark that we've tried

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
            console.log('[HomePage Geolocation] Success. Coords:', userCoords);
            setUserLocation(userCoords);
            setLocationFound(true);
            setViewState(prev => ({
              ...prev,
              longitude: userCoords.lng,
              latitude: userCoords.lat,
              zoom: 12
            }));

            // Determine closest city and set it, ONLY if no city was pre-selected or forced
            // This part is crucial: we still want to find the closest city
            // but the call to handleCityChange might be the issue if it's too aggressive.
            const cities = Object.entries(cityLocations);
            if (cities.length > 0) {
              let closestCityEntry = cities[0];
              let minDistance = calculateDistance(
                userCoords.lat, userCoords.lng,
                closestCityEntry[1].lat, closestCityEntry[1].lng
              );
              cities.forEach(([cityName, coords]) => {
                const dist = calculateDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestCityEntry = [cityName, coords];
                }
              });
              console.log('[HomePage Geolocation] Closest city determined:', closestCityEntry[0]);
              // Important: Check if the selectedCity is still the default 'pune' before overriding
              // Or, better yet, this effect should probably *not* call handleCityChange if a manual selection is in progress.
              // For now, let's defer to handleCityChange but be mindful.
              // If selectedCity is still 'pune' (initial default), then update.
              if (selectedCity === 'pune') { // Only change if it's still the default
                 console.log('[HomePage Geolocation] Setting city to closest:', closestCityEntry[0]);
                 handleCityChange(closestCityEntry[0]);
              } else {
                 console.log('[HomePage Geolocation] A city is already selected, not changing to closest automatically.');
              }
            }
            setLoading(false); // Stop loading after geolocation success and potential city change
          },
          (error) => {
            console.error('[HomePage Geolocation] Error getting location:', error);
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
            // Fallback to a default city ONLY if no city has been selected yet or if it's still 'pune'
            if (selectedCity === 'pune') { // Only default to Pune if no other city was selected
              console.log('[HomePage Geolocation] Failed, falling back to default city Pune.');
              handleCityChange('pune');
            } else {
              console.log('[HomePage Geolocation] Failed, but a city is already selected, not changing to Pune.');
            }
            setLoading(false);
          }
        );
      } else {
        setGeolocationError('Geolocation is not supported by your browser.');
        // Fallback to a default city ONLY if no city has been selected yet or if it's still 'pune'
        if (selectedCity === 'pune') {  // Only default to Pune if no other city was selected
            console.log('[HomePage Geolocation] Not supported, falling back to default city Pune.');
            handleCityChange('pune');
        } else {
            console.log('[HomePage Geolocation] Not supported, but a city is already selected, not changing to Pune.');
        }
        setLoading(false);
      }
    } else {
      console.log('[HomePage Geolocation] Initial geolocation already attempted, skipping.');
      // If geolocation was already attempted and failed, and we are still on 'pune', ensure loading is false.
      // This can happen if the user manually selected Pune after a failed geolocation.
      if (selectedCity === 'pune' && !locationFound) {
          setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGeolocationAttempted, calculateDistance, cityLocations, handleCityChange, selectedCity]); // Added selectedCity to dependencies
  // Make sure handleCityChange is stable (already wrapped in useCallback)

  // Effect to calculate and set nearest stations
  useEffect(() => {
    if (locationFound && userLocation && allStations.length > 0) {
      const stationsWithDistances = allStations.map(station => {
        const stationCoords = getValidCoordinates(station); // Use memoized function
        let distance = null;
        if (userLocation.lat && userLocation.lng && stationCoords.latitude && stationCoords.longitude) {
          distance = calculateDistance( // Use memoized function
            userLocation.lat,
            userLocation.lng,
            stationCoords.latitude,
            stationCoords.longitude
          );
        }
        return { ...station, distance };
      }).filter(station => station.distance !== null && !isNaN(station.distance));

      stationsWithDistances.sort((a, b) => a.distance - b.distance);
      const newNearestStations = stationsWithDistances.slice(0, 5);
      
      setNearestStations(current => {
        if (current.length !== newNearestStations.length) return newNearestStations;
        for (let i = 0; i < current.length; i++) {
          if (current[i].id !== newNearestStations[i].id) return newNearestStations;
        }
        return current;
      });
    } else {
      setNearestStations([]);
    }
  }, [
    userLocation, 
    allStations, 
    locationFound, 
    // selectedCity, // selectedCity is a dep of getValidCoordinates, which is a dep
    // cityLocations, // cityLocations is a dep of getValidCoordinates, which is a dep
    getValidCoordinates, 
    calculateDistance
  ]);

  const handleSearchInputChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query.trim().length > 1) { // Start suggesting after 2 characters
      const lowerQuery = query.toLowerCase();
      const suggestions = [];

      // Suggest Cities
      Object.keys(cityLocations).forEach(city => {
        if (city.toLowerCase().includes(lowerQuery)) {
          suggestions.push({ id: `city-${city}`, name: cityLocations[city].name || city, type: 'City' });
        }
      });

      // Suggest Station Names
      allStations.forEach(station => {
        if (station.name && station.name.toLowerCase().includes(lowerQuery)) {
          // Avoid duplicate station names if city also matched
          if (!suggestions.find(s => s.name.toLowerCase() === station.name.toLowerCase() && s.type === 'Station')) {
            suggestions.push({ id: station.id, name: station.name, type: 'Station' });
          }
        }
        // Suggest Station Addresses (simple check)
        if (station.address && station.address.toLowerCase().includes(lowerQuery)) {
          if (!suggestions.find(s => s.name.toLowerCase() === station.address.toLowerCase() && s.type === 'Address')) {
             // Use a truncated address or a specific part if too long
            suggestions.push({ id: `${station.id}-address`, name: station.address, type: 'Address' });
          }
        }
      });
      
      // Limit number of suggestions
      setSearchSuggestions(suggestions.slice(0, 10)); 
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.name); // Set search query to the suggestion name
    setSearchSuggestions([]);
    setShowSuggestions(false);
    // Trigger search immediately
    // We need to simulate an event or call a modified search submit handler
    // For now, let's directly filter/update based on the suggestion type
    if (suggestion.type === 'City') {
      handleCityChange(suggestion.name);
      setIsSearching(false); // Not a free-form search if a city is chosen
    } else if (suggestion.type === 'Station' || suggestion.type === 'Address') {
      // For stations/addresses, perform a general search that would find this item
      // The main handleSearchSubmit logic will filter based on searchQuery
      const fakeEvent = { preventDefault: () => {} }; // Mock event object
      // Ensure handleSearchSubmit uses the updated searchQuery from state
      // It might be better to pass the query directly to handleSearchSubmit if it were refactored
      // For now, relying on state update and then calling it.
      setIsSearching(true);
      // Timeout to allow state to update before search submission
      setTimeout(() => handleSearchSubmit(fakeEvent), 0); 
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission if wrapped in a form
    const query = searchQuery.trim().toLowerCase();
    
    // Hide suggestions when search is submitted
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur(); // Remove focus from input
    }
    
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

  // Toggle AI Chat Window
  const toggleChat = () => {
    console.log('[HomePage] toggleChat called. Current isChatOpen:', isChatOpen);
    setIsChatOpen(prevIsChatOpen => {
      const newIsChatOpen = !prevIsChatOpen;
      console.log('[HomePage] new isChatOpen will be:', newIsChatOpen);
      // If opening the chat, mark messages as read
      if (newIsChatOpen) {
        setHasUnreadAiMessages(false);
      }
      return newIsChatOpen;
    });
  };

  // Callback for AiAssistantChat to signal a new message when chat is closed
  const handleNewAiMessage = useCallback(() => {
    if (!isChatOpen) {
      setHasUnreadAiMessages(true);
    }
  }, [isChatOpen]);

  console.log('[HomePage] Rendering. isChatOpen:', isChatOpen); // Log on every render

  // Log currentCityStations length on every render
  console.log(`[HomePage Mobile Debug] Rendering. Number of currentCityStations: ${currentCityStations.length}`);
  if (currentCityStations.length > 0) {
    console.log('[HomePage Mobile Debug] First station in currentCityStations:', currentCityStations[0]);
  }
  console.log('[HomePage Mobile Debug] Geolocation error state:', geolocationError);
  console.log('[HomePage Mobile Debug] Location found state:', locationFound);
  
  // Debug citys city selectors  
  console.log('[HomePage Debug] indianCities value:', indianCities);
  console.log('[HomePage Debug] cityLocations value:', cityLocations);
  console.log('[HomePage Debug] selectedCity value:', selectedCity);
  console.log('[HomePage Debug] handleCityChange reference:', !!handleCityChange);

  // Add effect to track scroll progress
  useEffect(() => {
    const handleScrollProgress = () => {
      // Calculate how far down the page the user has scrolled
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrolled = (scrollTop / windowHeight) * 100;
      setScrollProgress(scrolled);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScrollProgress);

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScrollProgress);
    };
  }, []);

  // Add effect for cursor follower
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Check if hovering over interactive elements to change cursor appearance
      const target = e.target;
      if (target.closest('button') || target.closest('a') || target.closest('.station-card') || target.closest('.feature')) {
        setCursorType('hover');
      } else {
        setCursorType('default');
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Effect to mark sections as in-view for animations
  useEffect(() => {
    const handleSectionsInView = () => {
      const sections = document.querySelectorAll('section');
      const windowHeight = window.innerHeight;
      
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionBottom = section.getBoundingClientRect().bottom;
        
        // If section is in viewport
        if (sectionTop < windowHeight * 0.75 && sectionBottom > 0) {
          section.classList.add('in-view');
        }
      });
    };
    
    // Initialize sections
    handleSectionsInView();
    
    // Add scroll listener
    window.addEventListener('scroll', handleSectionsInView);
    
    return () => {
      window.removeEventListener('scroll', handleSectionsInView);
    };
  }, []);

  // Function to animate counting
  const startCountingAnimation = (counterKey, targetValue) => {
    const duration = 2000; // 2 seconds
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const increment = targetValue / totalFrames;
    
    let currentFrame = 0;
    let currentValue = 0;
    
    const counter = setInterval(() => {
      currentFrame++;
      currentValue += increment;
      
      if (currentFrame === totalFrames) {
        clearInterval(counter);
        currentValue = targetValue;
      }
      
      // Update the state with new value
      setCounters(prev => ({
        ...prev,
        [counterKey]: {
          ...prev[counterKey],
          value: Math.round(currentValue),
          counted: currentFrame === totalFrames
        }
      }));
    }, frameDuration);
  };

  // Effect to observe counter elements and trigger animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Check which counter this is
            if (entry.target === stationsCounterRef.current && !counters.stations.counted) {
              startCountingAnimation('stations', counters.stations.target);
            } else if (entry.target === citiesCounterRef.current && !counters.cities.counted) {
              startCountingAnimation('cities', counters.cities.target);
            } else if (entry.target === usersCounterRef.current && !counters.users.counted) {
              startCountingAnimation('users', counters.users.target);
            }
            
            // Add visible class for animation
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.5 }
    );
    
    // Observe counter elements if they exist
    if (stationsCounterRef.current) observer.observe(stationsCounterRef.current);
    if (citiesCounterRef.current) observer.observe(citiesCounterRef.current);
    if (usersCounterRef.current) observer.observe(usersCounterRef.current);
    
    return () => {
      if (stationsCounterRef.current) observer.unobserve(stationsCounterRef.current);
      if (citiesCounterRef.current) observer.unobserve(citiesCounterRef.current);
      if (usersCounterRef.current) observer.unobserve(usersCounterRef.current);
    };
  }, [counters.stations.counted, counters.cities.counted, counters.users.counted]);

  return (
    <div className="home-page">
      <SEO 
        title="Find & Book EV Charging Stations"
        description="India's largest network of EV charging stations. Find, book, and pay for charging sessions across major cities. Real-time availability and seamless booking experience."
        keywords="EV charging, electric vehicle, charging stations, India, booking, real-time availability, Pune, Mumbai, Delhi, Bangalore"
        ogImage="/images/og-image.jpg"
        canonicalUrl={window.location.href}
      />
      
      {/* Scroll Progress Indicator */}
      <div className="scroll-progress-container">
        <div 
          className="scroll-progress-bar" 
          style={{ width: `${scrollProgress}%` }} 
        />
      </div>
      
      {/* Cursor Follower */}
      <div 
        className={`cursor-follower ${cursorType}`} 
        style={{ 
          left: `${mousePosition.x}px`, 
          top: `${mousePosition.y}px`,
          transform: `translate(-50%, -50%) scale(${cursorType === 'hover' ? 1.5 : 1})`,
          backgroundColor: cursorType === 'hover' ? 'rgba(12, 95, 44, 0.4)' : 'rgba(12, 95, 44, 0.2)'
        }}
      />

      {/* Overlay for mobile menu - conditionally rendered */}
      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>}

      <header className={`home-header ${pageLoaded ? 'animate-on-load-slide-down' : 'initially-hidden'}`}>
        <div className="container header-container">
          <div 
            className="logo" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ cursor: 'pointer' }}
          >
            <span className="logo-text">EV Charging Network</span>
          </div>
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
            <a
              href="#cost-estimator"
              className="nav-item"
              onClick={(e) => { e.preventDefault(); if(mobileMenuOpen) toggleMobileMenu(); scrollToSection(costEstimatorSectionRef[0]); }}
            >
              Cost Estimator
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
                  <span className={`profile-chevron ${profileMenuOpen ? 'open' : ''}`}>▼</span>
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
                      <button onClick={() => handleProfileNavigation('/bookings')} className="profile-dropdown-button">
                        My Bookings
                      </button>
                      <button onClick={() => handleProfileNavigation('/dashboard')} className="profile-dropdown-button">
                        Dashboard
                      </button>
                      <button onClick={() => handleLogout()} className="logout-button">
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
          <div className="hero-content" ref={parallaxHeroContentRef}>
            <h1 
              className={pageLoaded ? 'animate-on-load-slide-down' : 'initially-hidden'} 
              style={{ animationDelay: '0.2s' }}
            >
              Find & Book EV Charging Stations
            </h1>
            <p 
              className={pageLoaded ? 'animate-on-load-slide-left' : 'initially-hidden'} 
              style={{ animationDelay: '0.4s' }}
            >
              India's largest network of EV charging stations. Find, book, and pay for charging sessions across major cities.
            </p>
            
            <form 
              onSubmit={handleSearchSubmit} 
              className={`search-bar-container ${pageLoaded ? 'animate-on-load-slide-right' : 'initially-hidden'}`} 
              style={{ animationDelay: '0.6s' }} // Search bar slides from right
              // Add onBlur with a timeout to handle suggestion clicks
              onBlur={(e) => {
                // Delay hiding suggestions to allow click event on suggestion item to fire
                setTimeout(() => {
                  // Check if the new focused element is part of the suggestions
                  if (!e.currentTarget.contains(document.activeElement)) {
                    setShowSuggestions(false);
                  }
                }, 150);
              }}
            >
              <input 
                type="text" 
                className="search-input"
                placeholder="Search by City, Station Name, Address..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => { if (searchQuery.trim().length > 1 && searchSuggestions.length > 0) setShowSuggestions(true); }}
                ref={searchInputRef} // Assign ref to input
              />
              <button type="submit" className="search-button">
                Search
              </button>
              {/* Display Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions">
                  <ul>
                    {searchSuggestions.map((suggestion) => (
                      <li 
                        key={suggestion.id} 
                        onClick={() => handleSuggestionClick(suggestion)}
                        // Use onMouseDown to ensure it fires before onBlur of the input
                        onMouseDown={(e) => { 
                          e.preventDefault(); // Prevent input from losing focus immediately
                          handleSuggestionClick(suggestion); 
                        }}
                      >
                        {suggestion.name}
                        {suggestion.type && <span className="suggestion-type">{suggestion.type}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>

            <div 
              className={`hero-cta ${pageLoaded ? 'animate-on-load-slide-up' : 'initially-hidden'}`} 
              style={{ animationDelay: '0.8s' }} // CTA buttons slide from bottom
            >
              <button 
                onClick={handleJoinNow} 
                className="btn-primary pulse-animation"
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
      <section id="about" ref={aboutRef} className={`about-section animated-bg-section ${aboutSectionRef[1] ? 'is-visible' : ''}`}>
        <div className="container" ref={aboutSectionRef[0]}>
          <h2 className="initially-hidden animate-slide-up" data-scroll="slide-up">India's Largest EV Charging Network</h2>
          <div className="features-grid stagger-children">
            <div className="feature initially-hidden stagger-child-1" data-scroll="stagger-item">
              <div className="feature-icon floating-animation">🔌</div>
              <h3>Widespread Coverage</h3>
              <p>Access to thousands of charging points across major Indian cities.</p>
            </div>
            <div className="feature initially-hidden stagger-child-2" data-scroll="stagger-item">
              <div className="feature-icon floating-animation">⚡</div>
              <h3>Fast Charging</h3>
              <p>DC fast charging options to get you back on the road quickly.</p>
            </div>
            <div className="feature initially-hidden stagger-child-3" data-scroll="stagger-item">
              <div className="feature-icon floating-animation">📱</div>
              <h3>Easy Booking</h3>
              <p>Book and pay for charging sessions directly from your phone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="stats-section" data-scroll="fade-in">
        <div className="container">
          <h2 data-scroll="slide-up">Our Impact In Numbers</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon floating-animation">🔋</div>
              <div ref={stationsCounterRef} className="counter-animation">
                <span className="counter-value">{counters.stations.value}+</span>
                <h3>Charging Stations</h3>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon floating-animation">🏙️</div>
              <div ref={citiesCounterRef} className="counter-animation">
                <span className="counter-value">{counters.cities.value}+</span>
                <h3>Cities Covered</h3>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon floating-animation">👥</div>
              <div ref={usersCounterRef} className="counter-animation">
                <span className="counter-value">{counters.users.value}+</span>
                <h3>Happy EV Drivers</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section - Replaced with component */}
      <Suspense fallback={<div className="map-loading-placeholder"><div className="spinner"></div><p>Loading Map...</p></div>}>
        <MapSection 
          ref={stationsRef}
          loading={loading}
          mapboxToken={MAPBOX_TOKEN} 
          viewState={viewState}
          onViewStateChange={setViewState}
          currentCityStations={currentCityStations}
          getValidCoordinates={getValidCoordinates}
          selectedStation={selectedStation}
          showPopup={showPopup}
          onMarkerClick={handleMarkerClick}
          onClosePopup={() => setShowPopup(false)}
          onBookNowPopup={handleBookNow}
          onViewDetailsPopup={handleViewDetails}
          cityLocations={cityLocations}
          selectedCity={selectedCity}
          onCityChange={(city) => {
            console.log("[HomePage] MapSection triggered city change for:", city);
            handleCityChange(city);
          }}
          data-scroll="fade-in"
        />
      </Suspense>
          
      {/* Stations List Section - Replaced with component */}
      <StationsListSection
        loading={loading}
        isSearching={isSearching}
        searchQuery={searchQuery}
        selectedCity={selectedCity}
        currentCityStations={currentCityStations}
        onBookNow={handleBookNow}
        onLocateOnMap={handleLocateOnMap}
        imageFallbackLevel={imageFallbackLevel}
        onImageError={handleImageError}
        onImageLoad={handleImageLoad}
        commonFallbackImage={commonFallbackImage}
      />

      {/* How It Works Section */}
      <section id="how-it-works" ref={howItWorksRef} className={`how-it-works animated-bg-section ${howItWorksSectionRef[1] ? 'is-visible' : ''}`}>
        <div className="container" ref={howItWorksSectionRef[0]}>
          <h2 className="initially-hidden animate-slide-up" data-scroll="slide-up">How It Works</h2>
          <div className="steps stagger-children">
            <div className="step initially-hidden stagger-child-1" data-scroll="stagger-item">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create a free account in seconds and set up your EV vehicle details.</p>
            </div>
            <div className="step initially-hidden stagger-child-2" data-scroll="stagger-item">
              <div className="step-number">2</div>
              <h3>Find Stations</h3>
              <p>Discover charging stations near you with real-time availability.</p>
            </div>
            <div className="step initially-hidden stagger-child-3" data-scroll="stagger-item">
              <div className="step-number">3</div>
              <h3>Book & Charge</h3>
              <p>Reserve your slot and charge your vehicle hassle-free.</p>
            </div>
            <div className="step initially-hidden stagger-child-4" data-scroll="stagger-item">
              <div className="step-number">4</div>
              <h3>Pay Seamlessly</h3>
              <p>Pay securely through the app using multiple payment options.</p>
            </div>
          </div>
          <div className={`cta-container initially-hidden ${howItWorksSectionRef[1] ? 'animate-slide-up' : ''}`} style={{ animationDelay: '0.5s'}} data-scroll="slide-up">
            <button 
              onClick={handleGetStarted} 
              className="btn-large"
            >
              Get Started Today
            </button>
          </div>
        </div>
      </section>

      {/* Cost Estimator Section */}
      <section ref={costEstimatorSectionRef[0]} className={`cost-estimator-section animated-bg-section ${costEstimatorSectionRef[1] ? 'is-visible' : ''}`}>
        <div className="container">
          <h2 className="initially-hidden animate-slide-up" data-scroll="slide-up">Estimate Charging Cost & Time</h2>
          <div className="initially-hidden animate-fade-in" style={{ animationDelay: '0.2s' }} data-scroll="fade-in">
            <CostEstimator />
          </div>
        </div>
      </section>

      {/* Geolocation Error Message - Conditionally Rendered */}
      {geolocationError && !locationFound && (
         <section className={`geolocation-error-section ${pageLoaded ? 'animate-on-load-fade-in' : 'initially-hidden'}`}>
            <div className="container">
               <p className="geolocation-error-message">⚠️ {geolocationError}</p>
            </div>
         </section>
      )}

      {/* Nearest Stations Section - Conditionally Rendered */}
      {locationFound && nearestStations.length > 0 && (
        <section ref={nearestStationsSectionRef[0]} className={`nearest-stations-section ${nearestStationsSectionRef[1] ? 'is-visible' : ''}`}>
          <div className="container">
            <h2 className="initially-hidden animate-slide-up" data-scroll="slide-up">Stations Near You</h2>
            <div className="stations-grid nearest-stations-grid"> 
              {nearestStations.map((station, index) => (
                <div key={`nearest-${station.id}`} data-scroll="stagger-item">
                  <StationCard
                    station={station}
                    onBookNow={handleBookNow}
                    onLocateOnMap={handleLocateOnMap}
                    imageFallbackLevel={imageFallbackLevel}
                    onImageError={handleImageError}
                    onImageLoad={handleImageLoad}
                    commonFallbackImage={commonFallbackImage}
                    animationIndex={index}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EV Tips Section */}
      <section ref={evTipsSectionRef[0]} className={`ev-tips-section ${evTipsSectionRef[1] ? 'is-visible' : ''}`}>
        <div className="container">
          <h2 className="initially-hidden animate-slide-up" data-scroll="slide-up">EV Pro Tips</h2>
          {currentEvTip && (
            <div className="tip-card initially-hidden animate-fade-in" style={{ animationDelay: '0.2s' }} data-scroll="fade-in">
              <p className="tip-text">{currentEvTip}</p>
              <button onClick={showNextTip} className="btn-next-tip">
                Show Another Tip
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef[0]} className={`footer ${footerRef[1] ? 'is-visible animate-fade-in' : 'initially-hidden'}`}>
        <div className="container" data-scroll="fade-in">
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
                <li>Email: karanravirajput@gmail.com</li>
                <li>Phone: +91 9309963483</li>
                <li>Address: Pune, Maharashtra, India</li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Connect with Us</h4>
              <div className="social-links">
                <button 
                  onClick={() => handleSocialLink('facebook')}
                  className="social-link"
                  aria-label="Facebook"
                >
                  {/* Placeholder for Facebook Icon (e.g., Unicode or SVG) */}
                  <span role="img" aria-hidden="true">🅕</span> 
                </button>
                <button 
                  onClick={() => handleSocialLink('twitter')}
                  className="social-link"
                  aria-label="Twitter"
                >
                  {/* Placeholder for Twitter Icon */}
                  <span role="img" aria-hidden="true">𝕏</span>
                </button>
                <button 
                  onClick={() => handleSocialLink('instagram')}
                  className="social-link"
                  aria-label="Instagram"
                >
                  {/* Placeholder for Instagram Icon */}
                  <span role="img" aria-hidden="true">📷</span>
                </button>
                <button 
                  onClick={() => handleSocialLink('linkedin')}
                  className="social-link"
                  aria-label="LinkedIn"
                >
                  {/* Placeholder for LinkedIn Icon */}
                  <span role="img" aria-hidden="true">🅛</span>
                </button>
              </div>
            </div>
          </div>
          <div className="copyright">
            <p>© 2023 EV Charging Network. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Assistant Floating Action Button */}
      <button onClick={toggleChat} className="ai-assistant-fab" aria-label="Toggle AI Assistant Chat">
        {/* Placeholder for an icon (e.g., SVG or a Unicode character) */}
        {/* Using a simple SVG for a chat bubble icon */}
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          <path d="M0 0h24v24H0z" fill="none"/>
        </svg>
        {hasUnreadAiMessages && <span className="notification-badge">1</span>}
      </button>

      {/* AI Assistant Chat Window */}
      {/* The AiAssistantChat component itself will manage its open/close animation based on isOpen */}
      <AiAssistantChat isOpen={isChatOpen} onClose={toggleChat} onNewMessage={handleNewAiMessage} />

    </div>
  );
};

export default HomePage;