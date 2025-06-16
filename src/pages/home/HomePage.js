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
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';
import { StationCardSkeleton, MapSkeleton } from '../../components/SkeletonLoader/SkeletonLoader';
import './HomePage.css';

// Lazy load MapSection for better performance
const MapSection = React.lazy(() => import('../../components/MapSection/MapSection'));

// Memoized constants to prevent recreation on every render
const CITY_LOCATIONS = {
  pune: indianCities.pune,
  delhi: indianCities.delhi,
  mumbai: indianCities.mumbai,
  bangalore: indianCities.bangalore,
  chennai: indianCities.chennai,
  hyderabad: indianCities.hyderabad
};

const EV_TIPS = [
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
];

// Memoized components for better performance
const MemoizedStationCard = React.memo(StationCard);
const MemoizedStationsListSection = React.memo(StationsListSection);

/**
 * Optimized HomePage Component with performance improvements:
 * - React.memo for child components
 * - useCallback for event handlers
 * - useMemo for expensive calculations
 * - Error boundaries for better error handling
 * - Lazy loading for heavy components
 * - Optimized state management
 */
const HomePage = React.memo(() => {
  // Initialize hooks first
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, logout } = useAuth();

  // Check for Firebase Auth action URLs and redirect to password reset page
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    if ((mode === 'resetPassword' || mode === 'action') && oobCode) {
      navigate(`/reset-password?mode=${mode}&oobCode=${oobCode}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const parallaxHeroContentRef = useParallax({ speed: 0.3, disableOnMobile: true });

  // Optimized state management - group related state
  const [pageState, setPageState] = useState({
    pageLoaded: false,
    loading: true,
    selectedCity: 'pune',
    locationFound: false,
    initialGeolocationAttempted: false
  });

  const [searchState, setSearchState] = useState({
    searchQuery: '',
    searchSuggestions: [],
    showSuggestions: false,
    isSearching: false
  });

  const [stationsData, setStationsData] = useState({
    allStations: [],
    currentCityStations: [],
    nearestStations: []
  });

  const [mapState, setMapState] = useState({
    userLocation: indianCities.pune,
    selectedStation: null,
    showPopup: false,
    viewState: {
      longitude: indianCities.pune.lng,
      latitude: indianCities.pune.lat,
      zoom: 12,
      bearing: 0,
      pitch: 0
    }
  });

  const [uiState, setUiState] = useState({
    profileMenuOpen: false,
    mobileMenuOpen: false,
    imageFallbackLevel: {},
    geolocationError: null,
    currentEvTip: '',
    isChatOpen: false,
    hasUnreadAiMessages: false,
    scrollProgress: 0,
    mousePosition: { x: 0, y: 0 },
    cursorType: 'default'
  });

  // Stats counters state with optimized structure
  const [counters, setCounters] = useState({
    stations: { value: 0, target: 150, counted: false },
    cities: { value: 0, target: 4, counted: false },
    users: { value: 0, target: 708, counted: false },
  });

  const [dynamicStats, setDynamicStats] = useState({
    chargingSessions: 0,
    carbonSaved: 0,
    lastUpdated: new Date()
  });

  // Refs
  const profileRef = useRef(null);
  const aboutRef = useRef(null);
  const stationsRef = useRef(null);
  const howItWorksRef = useRef(null);
  const searchInputRef = useRef(null);
  const stationsCounterRef = useRef(null);
  const citiesCounterRef = useRef(null);
  const usersCounterRef = useRef(null);

  // Intersection observers
  const aboutSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const howItWorksSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const nearestStationsSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const footerRef = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
  const evTipsSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const costEstimatorSectionRef = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

  // Common fallback image
  const commonFallbackImage = '/images/charging-stations/commonoimage.jpg';

  // Memoized calculations
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const getValidCoordinates = useCallback((station) => {
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
    const cityForFallback = station.city ? station.city.toLowerCase() : pageState.selectedCity.toLowerCase();
    const cityCoords = CITY_LOCATIONS[cityForFallback] || 
                       CITY_LOCATIONS[Object.keys(CITY_LOCATIONS).find(key => 
                         key.toLowerCase() === cityForFallback || 
                         cityForFallback.includes(key) ||
                         key.includes(cityForFallback)
                       )] || CITY_LOCATIONS.pune;
    
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
  }, [pageState.selectedCity]);

  // Optimized event handlers with useCallback
  const handleCityChange = useCallback(async (city) => {
    try {
      if (!city) {
        console.error('[HomePage] handleCityChange called with empty city');
        return;
      }
      
      const cityLower = String(city).toLowerCase();
      setPageState(prev => ({ ...prev, selectedCity: cityLower, loading: true }));
      
      let targetCityCoords = CITY_LOCATIONS[cityLower];
      
      if (!targetCityCoords) {
        const matchedCityKey = Object.keys(CITY_LOCATIONS).find(key => 
          key.toLowerCase() === cityLower || 
          cityLower.includes(key.toLowerCase()) ||
          key.toLowerCase().includes(cityLower)
        );
        
        if (matchedCityKey) {
          targetCityCoords = CITY_LOCATIONS[matchedCityKey];
        }
      }
      
      if (!targetCityCoords) {
        setMapState(prev => ({ ...prev, userLocation: CITY_LOCATIONS.pune }));
      } else {
        setMapState(prev => ({
          ...prev,
          userLocation: targetCityCoords,
          selectedStation: null,
          viewState: {
            longitude: targetCityCoords.lng,
            latitude: targetCityCoords.lat,
            zoom: 12, 
            bearing: 0, 
            pitch: 0, 
            transitionDuration: 1000
          }
        }));
      }
      
      const cityStations = await getStationsByCity(cityLower);
      
      if (cityStations.length === 0) {
        const allStns = await getAllStations();
        const coordsForFallback = targetCityCoords || CITY_LOCATIONS.pune;
        
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
          
        setStationsData(prev => ({ ...prev, currentCityStations: nearbyStations }));
      } else {
        setStationsData(prev => ({ ...prev, currentCityStations: cityStations }));
      }
    } catch (error) {
      console.error(`❌ Error in handleCityChange for ${city}:`, error);
    } finally {
      setPageState(prev => ({ ...prev, loading: false }));
    }
  }, [calculateDistance, getValidCoordinates]);

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setUiState(prev => ({ ...prev, mobileMenuOpen: !prev.mobileMenuOpen }));
  }, []);

  // Enhanced scrollToSection with smoother transitions
  const scrollToSection = useCallback((elementRef) => {
    if (elementRef && elementRef.current) {
      const startPosition = window.pageYOffset;
      const targetPosition = elementRef.current.offsetTop - 80;
      const distance = targetPosition - startPosition;
      
      const scrollDirection = distance > 0 ? 'scrolling-down' : 'scrolling-up';
      document.body.classList.add(scrollDirection);
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        document.body.classList.remove(scrollDirection);
        
        if (elementRef.current) {
          elementRef.current.classList.add('section-highlight');
          setTimeout(() => {
            elementRef.current.classList.remove('section-highlight');
          }, 1000);
        }
      }, Math.min(Math.abs(distance), 1000));
    }
  }, []);

  // Other handlers
  const handleJoinNow = useCallback(() => {
    if (currentUser) {
      navigate('/driver');
    } else {
      navigate('/signup');
    }
  }, [currentUser, navigate]);

  const handleViewStations = useCallback(() => {
    scrollToSection(stationsRef);
  }, [scrollToSection]);

  const handleGetStarted = useCallback(() => {
    navigate('/signup');
  }, [navigate]);

  const handleBookNow = useCallback((stationId) => {
    if (currentUser) {
      navigate(`/booking?stationId=${stationId}`);
    } else {
      navigate(`/login?redirect=/booking&stationId=${stationId}`);
    }
  }, [currentUser, navigate]);

  const handleLocateOnMap = useCallback((station) => {
    setMapState(prev => ({
      ...prev,
      selectedStation: station,
      showPopup: true,
      viewState: {
        longitude: station.longitude,
        latitude: station.latitude,
        zoom: 15,
        bearing: 0,
        pitch: 0,
        transitionDuration: 1000
      }
    }));
    scrollToSection(stationsRef);
    
    const element = document.getElementById(`station-${station.id}`);
    if (element) {
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
      }, 2000);
    }
  }, [scrollToSection]);

  const handleMarkerClick = useCallback((station) => {
    setMapState(prev => ({
      ...prev,
      selectedStation: station,
      showPopup: true
    }));
  }, []);

  const handleViewDetails = useCallback((station) => {
    handleLocateOnMap(station);
    
    setTimeout(() => {
      const stationElement = document.getElementById(`station-${station.id}`);
      if (stationElement) {
        stationElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500);
  }, [handleLocateOnMap]);

  // Update handleProfileNavigation function to properly handle all paths
  const handleProfileNavigation = useCallback((path) => {
    setUiState(prev => ({ ...prev, profileMenuOpen: false }));
    
    if (uiState.mobileMenuOpen) toggleMobileMenu();
    
    if (path === '/dashboard') {
      navigate('/driver');
    } else {
      navigate(path);
    }
  }, [navigate, uiState.mobileMenuOpen, toggleMobileMenu]);

  const handleLogout = useCallback(async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error("Failed to log out", error);
        alert("Logout failed. Please try again.");
      }
    }
  }, [logout, navigate]);

  const handleSocialLink = useCallback((platform) => {
    const socialUrls = {
      facebook: 'https://instagram.com/karrannrajput',
      twitter: 'https://x.com/KaranRa60411739',
      instagram: 'https://instagram.com/karrannrajput',
      linkedin: 'https://www.linkedin.com/in/karanrrajput'
    };
    
    if (socialUrls[platform]) {
      const newWindow = window.open();
      newWindow.opener = null;
      newWindow.location = socialUrls[platform];
    }
  }, []);

  const handleSearchInputChange = useCallback((event) => {
    const query = event.target.value;
    setSearchState(prev => ({ ...prev, searchQuery: query }));

    if (query.trim().length > 1) {
      const lowerQuery = query.toLowerCase();
      const suggestions = [];

      Object.keys(CITY_LOCATIONS).forEach(city => {
        if (city.toLowerCase().includes(lowerQuery)) {
          suggestions.push({ 
            id: `city-${city}`, 
            name: CITY_LOCATIONS[city].name || city, 
            type: 'City' 
          });
        }
      });

      stationsData.allStations.forEach(station => {
        if (station.name && station.name.toLowerCase().includes(lowerQuery)) {
          if (!suggestions.find(s => s.name.toLowerCase() === station.name.toLowerCase() && s.type === 'Station')) {
            suggestions.push({ id: station.id, name: station.name, type: 'Station' });
          }
        }
        if (station.address && station.address.toLowerCase().includes(lowerQuery)) {
          if (!suggestions.find(s => s.name.toLowerCase() === station.address.toLowerCase() && s.type === 'Address')) {
            suggestions.push({ id: `${station.id}-address`, name: station.address, type: 'Address' });
          }
        }
      });
      
      setSearchState(prev => ({ 
        ...prev, 
        searchSuggestions: suggestions.slice(0, 10),
        showSuggestions: true 
      }));
    } else {
      setSearchState(prev => ({ 
        ...prev, 
        searchSuggestions: [],
        showSuggestions: false 
      }));
    }
  }, [stationsData.allStations]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setSearchState(prev => ({
      ...prev,
      searchQuery: suggestion.name,
      searchSuggestions: [],
      showSuggestions: false
    }));
    
    if (suggestion.type === 'City') {
      handleCityChange(suggestion.name);
      setSearchState(prev => ({ ...prev, isSearching: false }));
    } else if (suggestion.type === 'Station' || suggestion.type === 'Address') {
      setSearchState(prev => ({ ...prev, isSearching: true }));
      setTimeout(() => handleSearchSubmit({ preventDefault: () => {} }), 0);
    }
  }, [handleCityChange]);

  const handleSearchSubmit = useCallback((event) => {
    event.preventDefault();
    const query = searchState.searchQuery.trim().toLowerCase();
    
    setSearchState(prev => ({ ...prev, showSuggestions: false }));
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    
    if (!query) {
      setSearchState(prev => ({ ...prev, isSearching: false }));
      handleCityChange(pageState.selectedCity);
      return;
    }

    setSearchState(prev => ({ ...prev, isSearching: true }));
    setPageState(prev => ({ ...prev, loading: true }));

    const results = stationsData.allStations.filter(station => 
      (station.name && station.name.toLowerCase().includes(query)) ||
      (station.address && station.address.toLowerCase().includes(query)) ||
      (station.city && station.city.toLowerCase().includes(query))
    );

    setStationsData(prev => ({ ...prev, currentCityStations: results }));

    if (results.length > 0) {
      const firstResultCoords = getValidCoordinates(results[0]);
      if (firstResultCoords.latitude && firstResultCoords.longitude) {
        setMapState(prev => ({
          ...prev,
          viewState: {
            longitude: firstResultCoords.longitude,
            latitude: firstResultCoords.latitude,
            zoom: 14,
            bearing: 0,
            pitch: 0,
            transitionDuration: 1000 
          }
        }));
      }
    }

    setPageState(prev => ({ ...prev, loading: false }));
  }, [searchState.searchQuery, stationsData.allStations, handleCityChange, pageState.selectedCity, getValidCoordinates]);

  // Function to show a new random EV tip
  const showNextTip = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * EV_TIPS.length);
    setUiState(prev => ({ ...prev, currentEvTip: EV_TIPS[randomIndex] }));
  }, []);

  // Toggle AI Chat Window
  const toggleChat = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      isChatOpen: !prev.isChatOpen,
      hasUnreadAiMessages: prev.isChatOpen ? false : prev.hasUnreadAiMessages
    }));
  }, []);

  // Callback for AiAssistantChat to signal a new message when chat is closed
  const handleNewAiMessage = useCallback(() => {
    if (!uiState.isChatOpen) {
      setUiState(prev => ({ ...prev, hasUnreadAiMessages: true }));
    }
  }, [uiState.isChatOpen]);

  const handleImageError = useCallback((stationId) => {
    const currentLevel = uiState.imageFallbackLevel[stationId] || 0;

    if (currentLevel === 0) {
      setUiState(prev => ({
        ...prev,
        imageFallbackLevel: {
          ...prev.imageFallbackLevel,
          [stationId]: 1,
        }
      }));
    } else if (currentLevel === 1) {
      setUiState(prev => ({
        ...prev,
        imageFallbackLevel: {
          ...prev.imageFallbackLevel,
          [stationId]: 2
        }
      }));
    }
  }, [uiState.imageFallbackLevel]);

  const handleImageLoad = useCallback((stationId) => {
    // Image loaded successfully
  }, []);

  // Initialize page
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageState(prev => ({ ...prev, pageLoaded: true }));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Initialize EV tip
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * EV_TIPS.length);
    setUiState(prev => ({ ...prev, currentEvTip: EV_TIPS[randomIndex] }));
  }, []);

  // Click outside handler for profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setUiState(prev => ({ ...prev, profileMenuOpen: false }));
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Geolocation effect
  useEffect(() => {
    if (!pageState.initialGeolocationAttempted) {
      setPageState(prev => ({ ...prev, initialGeolocationAttempted: true }));

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
            setMapState(prev => ({
              ...prev,
              userLocation: userCoords,
              viewState: {
                ...prev.viewState,
                longitude: userCoords.lng,
                latitude: userCoords.lat,
                zoom: 12
              }
            }));
            setPageState(prev => ({ ...prev, locationFound: true, loading: false }));

            const cities = Object.entries(CITY_LOCATIONS);
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
              
              if (pageState.selectedCity === 'pune') {
                handleCityChange(closestCityEntry[0]);
              }
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            let message = 'Could not retrieve your location.';
            if (error.code === error.PERMISSION_DENIED) {
              message = 'Location permission denied. Cannot show nearest stations.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message = 'Location information is unavailable.';
            } else if (error.code === error.TIMEOUT) {
              message = 'Location request timed out.';
            }
            setUiState(prev => ({ ...prev, geolocationError: message }));
            setPageState(prev => ({ ...prev, locationFound: false }));
            
            if (pageState.selectedCity === 'pune') {
              handleCityChange('pune');
            }
            setPageState(prev => ({ ...prev, loading: false }));
          }
        );
      } else {
        setUiState(prev => ({ ...prev, geolocationError: 'Geolocation is not supported by your browser.' }));
        if (pageState.selectedCity === 'pune') {
          handleCityChange('pune');
        }
        setPageState(prev => ({ ...prev, loading: false }));
      }
    }
  }, [pageState.initialGeolocationAttempted, calculateDistance, handleCityChange, pageState.selectedCity]);

  // Effect to calculate and set nearest stations
  useEffect(() => {
    if (pageState.locationFound && mapState.userLocation && stationsData.allStations.length > 0) {
      const stationsWithDistances = stationsData.allStations.map(station => {
        const stationCoords = getValidCoordinates(station);
        let distance = null;
        if (mapState.userLocation.lat && mapState.userLocation.lng && stationCoords.latitude && stationCoords.longitude) {
          distance = calculateDistance(
            mapState.userLocation.lat,
            mapState.userLocation.lng,
            stationCoords.latitude,
            stationCoords.longitude
          );
        }
        return { ...station, distance };
      }).filter(station => station.distance !== null && !isNaN(station.distance));

      stationsWithDistances.sort((a, b) => a.distance - b.distance);
      const newNearestStations = stationsWithDistances.slice(0, 5);
      
      setStationsData(prev => {
        if (prev.nearestStations.length !== newNearestStations.length) return { ...prev, nearestStations: newNearestStations };
        for (let i = 0; i < prev.nearestStations.length; i++) {
          if (prev.nearestStations[i].id !== newNearestStations[i].id) return { ...prev, nearestStations: newNearestStations };
        }
        return prev;
      });
    } else {
      setStationsData(prev => ({ ...prev, nearestStations: [] }));
    }
  }, [
    mapState.userLocation, 
    stationsData.allStations, 
    pageState.locationFound, 
    getValidCoordinates, 
    calculateDistance
  ]);

  // Add scroll event listener to animate sections on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      
      document.querySelectorAll('[data-scroll]').forEach(element => {
        const elementTop = element.getBoundingClientRect().top + scrollTop;
        const elementVisible = 150;
        
        if (scrollTop > elementTop - windowHeight + elementVisible) {
          element.classList.add('scroll-visible');
        } else {
          element.classList.remove('scroll-visible');
        }
      });
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Add effect to track scroll progress
  useEffect(() => {
    const handleScrollProgress = () => {
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrolled = (scrollTop / windowHeight) * 100;
      setUiState(prev => ({ ...prev, scrollProgress: scrolled }));
    };

    window.addEventListener('scroll', handleScrollProgress);

    return () => {
      window.removeEventListener('scroll', handleScrollProgress);
    };
  }, []);

  // Add effect for cursor follower
  useEffect(() => {
    const handleMouseMove = (e) => {
      setUiState(prev => ({ ...prev, mousePosition: { x: e.clientX, y: e.clientY } }));
      
      const target = e.target;
      const newCursorType = target.closest('button') || target.closest('a') || target.closest('.station-card') || target.closest('.feature') ? 'hover' : 'default';
      
      if (newCursorType !== uiState.cursorType) {
        setUiState(prev => ({ ...prev, cursorType: newCursorType }));
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [uiState.cursorType]);

  // Effect to mark sections as in-view for animations
  useEffect(() => {
    const handleSectionsInView = () => {
      const sections = document.querySelectorAll('section');
      const windowHeight = window.innerHeight;
      
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionBottom = section.getBoundingClientRect().bottom;
        
        if (sectionTop < windowHeight * 0.75 && sectionBottom > 0) {
          section.classList.add('in-view');
        }
      });
    };
    
    handleSectionsInView();
    window.addEventListener('scroll', handleSectionsInView);
    
    return () => {
      window.removeEventListener('scroll', handleSectionsInView);
    };
  }, []);

  // Function to animate counting
  const startCountingAnimation = useCallback((counterKey, targetValue) => {
    const duration = 2000;
    const frameDuration = 1000 / 60;
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
      
      setCounters(prev => ({
        ...prev,
        [counterKey]: {
          ...prev[counterKey],
          value: Math.round(currentValue),
          counted: currentFrame === totalFrames
        }
      }));
    }, frameDuration);
  }, []);

  // Effect to observe counter elements and trigger animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (entry.target === stationsCounterRef.current && !counters.stations.counted) {
              startCountingAnimation('stations', counters.stations.target);
            } else if (entry.target === citiesCounterRef.current && !counters.cities.counted) {
              startCountingAnimation('cities', counters.cities.target);
            } else if (entry.target === usersCounterRef.current && !counters.users.counted) {
              startCountingAnimation('users', counters.users.target);
            }
            
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.5 }
    );
    
    if (stationsCounterRef.current) observer.observe(stationsCounterRef.current);
    if (citiesCounterRef.current) observer.observe(citiesCounterRef.current);
    if (usersCounterRef.current) observer.observe(usersCounterRef.current);
    
    return () => {
      if (stationsCounterRef.current) observer.unobserve(stationsCounterRef.current);
      if (citiesCounterRef.current) observer.unobserve(citiesCounterRef.current);
      if (usersCounterRef.current) observer.unobserve(usersCounterRef.current);
    };
  }, [counters.stations.counted, counters.cities.counted, counters.users.counted, startCountingAnimation]);

  // Effect to update dynamic stats periodically
  useEffect(() => {
    const updateDynamicStats = () => {
      setDynamicStats(prev => ({
        chargingSessions: prev.chargingSessions + Math.floor(Math.random() * 1),
        carbonSaved: prev.carbonSaved + Math.floor(Math.random() * 2),
        lastUpdated: new Date()
      }));
    };

    const interval = setInterval(updateDynamicStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Add initial values for dynamic stats
  useEffect(() => {
    setDynamicStats({
      chargingSessions: Math.floor(Math.random() * 50),
      carbonSaved: Math.floor(Math.random() * 100),
      lastUpdated: new Date()
    });
  }, []);

  return (
    <ErrorBoundary>
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
          style={{ width: `${uiState.scrollProgress}%` }} 
        />
      </div>
      
      {/* Cursor Follower */}
      <div 
        className={`cursor-follower ${uiState.cursorType}`} 
        style={{ 
          left: `${uiState.mousePosition.x}px`, 
          top: `${uiState.mousePosition.y}px`,
          transform: `translate(-50%, -50%) scale(${uiState.cursorType === 'hover' ? 1.5 : 1})`,
          backgroundColor: uiState.cursorType === 'hover' ? 'rgba(12, 95, 44, 0.4)' : 'rgba(12, 95, 44, 0.2)'
        }}
      />

      {/* Overlay for mobile menu - conditionally rendered */}
      {uiState.mobileMenuOpen && <div className="mobile-menu-overlay" onClick={() => setUiState(prev => ({ ...prev, mobileMenuOpen: false }))}></div>}

      <header className={`home-header ${pageState.pageLoaded ? 'animate-on-load-slide-down' : 'initially-hidden'}`}>
        <div className="container header-container">
          <div 
            className="logo" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ cursor: 'pointer' }}
          >
            <span className="logo-text">EV Charging Network</span>
          </div>
          <button className={`hamburger-menu ${uiState.mobileMenuOpen ? 'open' : ''}`} onClick={() => setUiState(prev => ({ ...prev, mobileMenuOpen: !prev.mobileMenuOpen }))} aria-label="Toggle navigation menu" aria-expanded={uiState.mobileMenuOpen}>
            <div></div>
            <div></div>
            <div></div>
          </button>
          <nav className={`nav-links ${uiState.mobileMenuOpen ? 'open' : ''}`}>
            <a href="#about" className="nav-item" onClick={(e) => { e.preventDefault(); if(uiState.mobileMenuOpen) setUiState(prev => ({ ...prev, mobileMenuOpen: false })); scrollToSection(aboutRef); }}>
              About
            </a>
            <a 
              href="#stations" 
              className="nav-item"
              onClick={(e) => { e.preventDefault(); if(uiState.mobileMenuOpen) setUiState(prev => ({ ...prev, mobileMenuOpen: false })); scrollToSection(stationsRef); }}
            >
              Stations
            </a>
            <a 
              href="#how-it-works" 
              className="nav-item"
              onClick={(e) => { e.preventDefault(); if(uiState.mobileMenuOpen) setUiState(prev => ({ ...prev, mobileMenuOpen: false })); scrollToSection(howItWorksRef); }}
            >
              How it Works
            </a>
            <a
              href="#cost-estimator"
              className="nav-item"
              onClick={(e) => { e.preventDefault(); if(uiState.mobileMenuOpen) setUiState(prev => ({ ...prev, mobileMenuOpen: false })); scrollToSection(costEstimatorSectionRef[0]); }}
            >
              Cost Estimator
            </a>
            
            {/* Conditional rendering based on authentication status */}
            {currentUser ? (
              <div className="profile-menu-container" ref={profileRef}>
                <div className="profile-button" onClick={(e) => { e.preventDefault(); setUiState(prev => ({ ...prev, profileMenuOpen: !prev.profileMenuOpen })); }}>
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
                  <span className={`profile-chevron ${uiState.profileMenuOpen ? 'open' : ''}`}>▼</span>
                </div>
                {uiState.profileMenuOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <strong>
                        {currentUser.displayName || currentUser.email || "User"}
                      </strong>
                      <span className="profile-email">{currentUser.email}</span>
                    </div>
                    <div className="profile-dropdown-items">
                      <button onClick={(e) => { e.preventDefault(); handleProfileNavigation('/bookings'); }} className="profile-dropdown-button">
                        My Bookings
                      </button>
                      <button onClick={(e) => { e.preventDefault(); handleProfileNavigation('/dashboard'); }} className="profile-dropdown-button">
                        Dashboard
                      </button>
                      <button onClick={(e) => { e.preventDefault(); handleLogout(); }} className="logout-button">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link 
                  to="/login" 
                  className="btn-login" 
                  onClick={(e) => { 
                    if(uiState.mobileMenuOpen) {
                      setUiState(prev => ({ ...prev, mobileMenuOpen: false }));
                    }
                  }}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="btn-signup" 
                  onClick={(e) => { 
                    if(uiState.mobileMenuOpen) {
                      setUiState(prev => ({ ...prev, mobileMenuOpen: false }));
                    }
                  }}
                >
                  Sign Up
                </Link>
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
              className={pageState.pageLoaded ? 'animate-on-load-slide-down' : 'initially-hidden'} 
              style={{ animationDelay: '0.2s' }}
            >
              Find & Book EV Charging Stations
            </h1>
            <p 
              className={pageState.pageLoaded ? 'animate-on-load-slide-left' : 'initially-hidden'} 
              style={{ animationDelay: '0.4s' }}
            >
              India's largest network of EV charging stations. Find, book, and pay for charging sessions across major cities.
            </p>
            
            <form 
              onSubmit={handleSearchSubmit} 
              className={`search-bar-container ${pageState.pageLoaded ? 'animate-on-load-slide-right' : 'initially-hidden'}`} 
              style={{ animationDelay: '0.6s' }} // Search bar slides from right
              // Add onBlur with a timeout to handle suggestion clicks
              onBlur={(e) => {
                // Delay hiding suggestions to allow click event on suggestion item to fire
                setTimeout(() => {
                  // Check if the new focused element is part of the suggestions
                  if (!e.currentTarget.contains(document.activeElement)) {
                    setSearchState(prev => ({ ...prev, showSuggestions: false }));
                  }
                }, 150);
              }}
            >
              <input 
                type="text" 
                className="search-input"
                placeholder="Search by City, Station Name, Address..."
                value={searchState.searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => { if (searchState.searchQuery.trim().length > 1 && searchState.searchSuggestions.length > 0) setSearchState(prev => ({ ...prev, showSuggestions: true })); }}
                ref={searchInputRef} // Assign ref to input
              />
              <button type="submit" className="search-button">
                Search
              </button>
              {/* Display Search Suggestions */}
              {searchState.showSuggestions && searchState.searchSuggestions.length > 0 && (
                <div className="search-suggestions">
                  <ul>
                    {searchState.searchSuggestions.map((suggestion) => (
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
              className={`hero-cta ${pageState.pageLoaded ? 'animate-on-load-slide-up' : 'initially-hidden'}`} 
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
                <p className="stat-description">Across Pune's key locations</p>
                <div className="stat-progress">
                  <div className="progress-bar" style={{ width: `${(counters.stations.value / counters.stations.target) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon floating-animation">🏙️</div>
              <div ref={citiesCounterRef} className="counter-animation">
                <span className="counter-value">{counters.cities.value}+</span>
                <h3>Cities Covered</h3>
                <p className="stat-description">Expanding rapidly</p>
                <div className="stat-progress">
                  <div className="progress-bar" style={{ width: `${(counters.cities.value / counters.cities.target) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon floating-animation">👥</div>
              <div ref={usersCounterRef} className="counter-animation">
                <span className="counter-value">{counters.users.value}+</span>
                <h3>Happy EV Drivers</h3>
                <p className="stat-description">And growing daily</p>
                <div className="stat-progress">
                  <div className="progress-bar" style={{ width: `${(counters.users.value / counters.users.target) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Stats Section */}
          <div className="live-stats-container">
            <div className="live-stats-header">
              <h3>Live Impact</h3>
              <span className="live-indicator">
                <span className="pulse"></span>
                Live
              </span>
            </div>
            <div className="live-stats-grid">
              <div className="live-stat-item">
                <div className="live-stat-icon">⚡</div>
                <div className="live-stat-content">
                  <span className="live-stat-value">{dynamicStats.chargingSessions}</span>
                  <span className="live-stat-label">Charging Sessions Today</span>
                </div>
              </div>
              <div className="live-stat-item">
                <div className="live-stat-icon">🌱</div>
                <div className="live-stat-content">
                  <span className="live-stat-value">{dynamicStats.carbonSaved}kg</span>
                  <span className="live-stat-label">CO₂ Saved Today</span>
                </div>
              </div>
            </div>
            <div className="last-updated">
              Last updated: {dynamicStats.lastUpdated.toLocaleTimeString()}
            </div>
          </div>

          <div className="stats-highlight">
            <p>EV Charging Stations in Pune</p>
            <div className="highlight-details">
              <span>24/7 Support</span>
              <span>•</span>
              <span>Real-time Availability</span>
              <span>•</span>
              <span>Fast Charging</span>
            </div>
            <div className="highlight-features">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>DC Fast Charging</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔌</span>
                <span>Multiple Connectors</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>App Integration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section - Replaced with component */}
      <Suspense fallback={<div className="map-loading-placeholder"><div className="spinner"></div><p>Loading Map...</p></div>}>
        <MapSection 
          ref={stationsRef}
          loading={pageState.loading}
          mapboxToken={MAPBOX_TOKEN} 
          viewState={mapState.viewState}
          onViewStateChange={(newViewState) => setMapState(prev => ({ ...prev, viewState: newViewState }))}
          currentCityStations={stationsData.currentCityStations}
          getValidCoordinates={getValidCoordinates}
          selectedStation={mapState.selectedStation}
          showPopup={mapState.showPopup}
          onMarkerClick={(station) => setMapState(prev => ({ ...prev, selectedStation: station, showPopup: true }))}
          onClosePopup={() => setMapState(prev => ({ ...prev, showPopup: false }))}
          onBookNowPopup={handleBookNow}
          onViewDetailsPopup={handleViewDetails}
          cityLocations={CITY_LOCATIONS}
          selectedCity={pageState.selectedCity}
          onCityChange={(city) => {
            console.log("[HomePage] MapSection triggered city change for:", city);
            handleCityChange(city);
          }}
          data-scroll="fade-in"
        />
      </Suspense>
          
      {/* Stations List Section - Replaced with component */}
      <MemoizedStationsListSection
        loading={pageState.loading}
        isSearching={searchState.isSearching}
        searchQuery={searchState.searchQuery}
        selectedCity={pageState.selectedCity}
        currentCityStations={stationsData.currentCityStations}
        onBookNow={handleBookNow}
        onLocateOnMap={handleLocateOnMap}
        imageFallbackLevel={uiState.imageFallbackLevel}
        onImageError={(stationId) => setUiState(prev => ({ ...prev, imageFallbackLevel: { ...prev.imageFallbackLevel, [stationId]: 1 } }))}
        onImageLoad={(stationId) => setUiState(prev => ({ ...prev, imageFallbackLevel: { ...prev.imageFallbackLevel, [stationId]: 'loaded' } }))}
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
      {uiState.geolocationError && !pageState.locationFound && (
         <section className={`geolocation-error-section ${pageState.pageLoaded ? 'animate-on-load-fade-in' : 'initially-hidden'}`}>
            <div className="container">
               <p className="geolocation-error-message">⚠️ {uiState.geolocationError}</p>
            </div>
         </section>
      )}

      {/* Nearest Stations Section - Conditionally Rendered */}
      {pageState.locationFound && stationsData.nearestStations.length > 0 && (
        <section ref={nearestStationsSectionRef[0]} className={`nearest-stations-section ${nearestStationsSectionRef[1] ? 'is-visible' : ''}`}>
          <div className="container">
            <h2 className="initially-hidden animate-slide-up" data-scroll="slide-up">Stations Near You</h2>
            <div className="stations-grid nearest-stations-grid"> 
              {stationsData.nearestStations.map((station, index) => (
                <div key={`nearest-${station.id}`} data-scroll="stagger-item">
                  <StationCard
                    station={station}
                    onBookNow={handleBookNow}
                    onLocateOnMap={handleLocateOnMap}
                    imageFallbackLevel={uiState.imageFallbackLevel}
                    onImageError={(stationId) => setUiState(prev => ({ ...prev, imageFallbackLevel: { ...prev.imageFallbackLevel, [stationId]: 1 } }))}
                    onImageLoad={(stationId) => setUiState(prev => ({ ...prev, imageFallbackLevel: { ...prev.imageFallbackLevel, [stationId]: 'loaded' } }))}
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
          {uiState.currentEvTip && (
            <div className="tip-card initially-hidden animate-fade-in" style={{ animationDelay: '0.2s' }} data-scroll="fade-in">
              <p className="tip-text">{uiState.currentEvTip}</p>
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
                <li><Link to="/terms-and-conditions">Terms & Conditions</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
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
        {uiState.hasUnreadAiMessages && <span className="notification-badge">1</span>}
      </button>

      {/* AI Assistant Chat Window */}
      {/* The AiAssistantChat component itself will manage its open/close animation based on isOpen */}
      <AiAssistantChat isOpen={uiState.isChatOpen} onClose={toggleChat} onNewMessage={handleNewAiMessage} />

      </div>
    </ErrorBoundary>
  );
});

export default HomePage;