import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAllStations } from '../services/dataService';

// Performance monitoring hook
const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
      
      return () => observer.disconnect();
    }
  }, []);
};

// Helper functions
const getDistance = (lat1, lon1, lat2, lon2) => {
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
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

const getJitteredCoordinates = (lat, lng, stationId) => {
  const jitterAmount = 0.00001;
  const idHash = stationId ? stationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.random() * 1000;
  const latOffset = (idHash % 10 - 5) * jitterAmount;
  const lngOffset = (idHash % 10 - 5) * jitterAmount;
  return { latitude: lat + latOffset, longitude: lng + lngOffset };
};

const DEFAULT_FALLBACK_COORDS = { latitude: 18.5204, longitude: 73.8567 }; // Pune

export const useDriverDashboard = () => {
  const reactRouterLocation = useLocation();
  const { state } = reactRouterLocation;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Enable performance monitoring in development
  if (process.env.NODE_ENV === 'development') {
    usePerformanceMonitoring();
  }

  // Grouped state management
  const [dashboardState, setDashboardState] = useState({
    loading: true,
    error: null,
    refreshing: false,
    actionError: null,
    viewTransition: ''
  });

  const [locationState, setLocationState] = useState({
    userLocation: null,
    locationPermissionDenied: false,
    viewport: {
      longitude: 78.9629,
      latitude: 20.5937,
      zoom: 4.5,
      bearing: 0,
      pitch: 0
    }
  });

  const [stationState, setStationState] = useState({
    rawStations: [],
    selectedStationPopup: null,
    nearbyStations: [],
    recentStations: []
  });

  const [filterState, setFilterState] = useState({
    showCompatibleOnly: false,
    showAvailableOnly: false,
    batteryRangeFilter: false,
    selectedChargerType: 'all',
    showFilterDropdown: false,
    showSortDropdown: false
  });

  const [uiState, setUiState] = useState({
    activeBottomNav: 'Map',
    viewMode: 'map',
    isMobileDetailsOpen: false,
    isPullToRefreshActive: false,
    showTripPlanner: false
  });

  const [vehicleState, setVehicleState] = useState({
    userVehicle: state?.vehicle || null
  });

  const [searchState, setSearchState] = useState({
    searchTerm: '',
    searchResults: [],
    isSearching: false,
    showSearchResults: false
  });

  const [tripState, setTripState] = useState({
    tripRoute: null
  });

  // Refs
  const pullStartY = useRef(0);
  const listRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Memoized haptic feedback
  const triggerHapticFeedback = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Memoized error feedback
  const showErrorFeedback = useCallback((message) => {
    setDashboardState(prev => ({ ...prev, actionError: message }));
    triggerHapticFeedback();
    
    setTimeout(() => {
      setDashboardState(prev => ({ ...prev, actionError: null }));
    }, 3000);
  }, [triggerHapticFeedback]);

  // Enhanced fetch stations function with retry logic and performance monitoring
  const fetchStations = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    
    try {
      if (process.env.NODE_ENV === 'development') {
        performance.mark('fetchStations-start');
      }
      
      setDashboardState(prev => ({ ...prev, loading: true, error: null }));
      
      // Check cache freshness
      const cacheTimestamp = localStorage.getItem('stations_cache_timestamp');
      const cacheAge = cacheTimestamp ? Date.now() - new Date(cacheTimestamp).getTime() : Infinity;
      const cacheMaxAge = 5 * 60 * 1000; // 5 minutes
      
      if (!navigator.onLine) {
        const cachedStationsJson = localStorage.getItem('cached_stations');
        if (cachedStationsJson) {
          const cachedStations = JSON.parse(cachedStationsJson);
          setStationState(prev => ({ ...prev, rawStations: cachedStations }));
          setDashboardState(prev => ({ ...prev, error: null }));
          return cachedStations;
        } else {
          setDashboardState(prev => ({ 
            ...prev, 
            error: 'You are offline and no cached station data is available.' 
          }));
          setStationState(prev => ({ ...prev, rawStations: [] }));
          throw new Error('Offline with no cached data');
        }
      }
      
      // Use cache if fresh enough
      if (cacheAge < cacheMaxAge) {
        const cachedStationsJson = localStorage.getItem('cached_stations');
        if (cachedStationsJson) {
          const cachedStations = JSON.parse(cachedStationsJson);
          setStationState(prev => ({ ...prev, rawStations: cachedStations }));
          setDashboardState(prev => ({ ...prev, error: null }));
          
          // Fetch fresh data in background
          getAllStations().then(freshData => {
            setStationState(prev => ({ ...prev, rawStations: freshData }));
            try {
              localStorage.setItem('cached_stations', JSON.stringify(freshData));
              localStorage.setItem('stations_cache_timestamp', new Date().toISOString());
            } catch (cacheError) {
              console.warn('Failed to cache fresh stations data:', cacheError);
            }
          }).catch(err => {
            console.warn('Background fetch failed:', err);
          });
          
          return cachedStations;
        }
      }
      
      const stationData = await getAllStations();
      setStationState(prev => ({ ...prev, rawStations: stationData }));
      setDashboardState(prev => ({ ...prev, error: null }));
      
      try {
        localStorage.setItem('cached_stations', JSON.stringify(stationData));
        localStorage.setItem('stations_cache_timestamp', new Date().toISOString());
      } catch (cacheError) {
        console.warn('Failed to cache stations data:', cacheError);
      }
      
      if (process.env.NODE_ENV === 'development') {
        performance.mark('fetchStations-end');
        performance.measure('fetchStations', 'fetchStations-start', 'fetchStations-end');
      }
      
      return stationData;
    } catch (err) {
      console.error(`Error fetching stations (attempt ${retryCount + 1}):`, err);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        setTimeout(() => {
          fetchStations(retryCount + 1);
        }, retryDelay);
        return;
      }
      
      setDashboardState(prev => ({ ...prev, error: 'Failed to load stations after multiple attempts.' }));
      setStationState(prev => ({ ...prev, rawStations: [] }));
      throw err;
    } finally {
      setDashboardState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Memoized processed stations
  const stations = useMemo(() => {
    const stationCoordinatesCount = {};
    
    let processedStations = stationState.rawStations.map(station => {
      let lat = parseFloat(station.latitude);
      let lng = parseFloat(station.longitude);

      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        lat = DEFAULT_FALLBACK_COORDS.latitude;
        lng = DEFAULT_FALLBACK_COORDS.longitude;
      }
      
      const coordKey = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
      stationCoordinatesCount[coordKey] = (stationCoordinatesCount[coordKey] || 0) + 1;
      
      let stationWithCoords = { ...station, latitude: lat, longitude: lng };

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

      if (locationState.userLocation) {
        const sLat = stationWithCoords.originalLat !== undefined ? stationWithCoords.originalLat : stationWithCoords.latitude;
        const sLng = stationWithCoords.originalLng !== undefined ? stationWithCoords.originalLng : stationWithCoords.longitude;
        const distance = getDistance(locationState.userLocation.latitude, locationState.userLocation.longitude, sLat, sLng);
        stationWithCoords.distance = distance;
      }
      return stationWithCoords;
    });
    
    if (vehicleState.userVehicle && vehicleState.userVehicle.compatibleChargerTypes) {
      return processedStations.map(station => {
        const isCompatible = station.chargerTypes && 
          station.chargerTypes.some(type => 
            vehicleState.userVehicle.compatibleChargerTypes.includes(type)
          );
        return { ...station, isCompatible };
      });
    }
    
    return processedStations;
  }, [stationState.rawStations, vehicleState.userVehicle, locationState.userLocation]);

  // Memoized filtered stations
  const filteredStations = useMemo(() => {
    let filtered = stations;
    
    if (vehicleState.userVehicle && filterState.showCompatibleOnly) {
      filtered = filtered.filter(station => station.isCompatible);
    }
    
    if (filterState.showAvailableOnly) {
      filtered = filtered.filter(station => station.status === 'Available');
    }
    
    if (locationState.userLocation) {
      filtered = [...filtered].sort((a, b) => {
        return (a.distance || Infinity) - (b.distance || Infinity);
      });
    }
    
    return filtered;
  }, [stations, filterState.showCompatibleOnly, filterState.showAvailableOnly, vehicleState.userVehicle, locationState.userLocation]);

  // Action handlers
  const handleToggleViewMode = useCallback(() => {
    triggerHapticFeedback();
    setDashboardState(prev => ({ ...prev, viewTransition: 'view-exit' }));
    
    setTimeout(() => {
      setUiState(prev => ({ ...prev, viewMode: prev.viewMode === 'map' ? 'list' : 'map' }));
      setDashboardState(prev => ({ ...prev, viewTransition: 'view-enter' }));
      
      setTimeout(() => {
        setDashboardState(prev => ({ ...prev, viewTransition: '' }));
      }, 300);
    }, 300);
  }, [triggerHapticFeedback]);

  const handleMarkerClick = useCallback((station) => {
    triggerHapticFeedback();
    setStationState(prev => ({ ...prev, selectedStationPopup: station }));
    
    setStationState(prev => {
      if (!prev.recentStations.some(s => s.id === station.id)) {
        return {
          ...prev,
          recentStations: [station, ...prev.recentStations].slice(0, 5)
        };
      }
      return prev;
    });
    
    setUiState(prev => ({ ...prev, isMobileDetailsOpen: true }));
  }, [triggerHapticFeedback]);

  const handleBottomNavClick = useCallback((navItem) => {
    setUiState(prev => ({ ...prev, activeBottomNav: navItem }));
    
    if (navItem === 'Profile') {
      navigate('/profile');
    } else if (navItem === 'Trips') {
      navigate('/trips');
    } else if (navItem === 'Map') {
      if (reactRouterLocation.pathname !== '/driver') {
        navigate('/driver');
      }
    } else if (navItem === 'Route') {
      setUiState(prev => ({ ...prev, showTripPlanner: !prev.showTripPlanner }));
      if (uiState.showTripPlanner) {
        setTripState({ tripRoute: null });
      }
    }
  }, [navigate, reactRouterLocation.pathname, uiState.showTripPlanner]);

  const toggleCompatibleFilter = useCallback(() => {
    setFilterState(prev => ({ ...prev, showCompatibleOnly: !prev.showCompatibleOnly }));
  }, []);

  const toggleAvailableFilter = useCallback(() => {
    setFilterState(prev => ({ ...prev, showAvailableOnly: !prev.showAvailableOnly }));
  }, []);

  const handleSelectVehicle = useCallback(() => {
    navigate('/change-vehicle');
  }, [navigate]);

  // Location handling
  const requestLocationPermission = useCallback(() => {
    triggerHapticFeedback();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationState(prev => ({
            ...prev,
            userLocation: { latitude, longitude },
            locationPermissionDenied: false,
            viewport: { ...prev.viewport, latitude, longitude, zoom: 14 }
          }));
        },
        (err) => {
          console.warn("Permission denied again:", err.message);
          showErrorFeedback("Location access is required for best experience. Please enable it in your browser settings.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  }, [triggerHapticFeedback, showErrorFeedback]);

  // Effects
  useEffect(() => {
    const fetchUserVehicle = async () => {
      if (!vehicleState.userVehicle && currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().vehicle) {
            setVehicleState({ userVehicle: userDoc.data().vehicle });
          }
        } catch (err) {
          console.error("Error fetching user vehicle:", err);
        }
      }
    };
    
    fetchUserVehicle();
  }, [currentUser, vehicleState.userVehicle]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationState(prev => ({
            ...prev,
            userLocation: { latitude, longitude },
            locationPermissionDenied: false,
            viewport: { ...prev.viewport, latitude, longitude, zoom: 12 }
          }));
        },
        (err) => {
          console.warn("Error getting user location:", err.message);
          setLocationState(prev => ({
            ...prev,
            locationPermissionDenied: true,
            viewport: { ...prev.viewport, latitude: 20.5937, longitude: 78.9629, zoom: 5 }
          }));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      setLocationState(prev => ({ ...prev, locationPermissionDenied: true }));
    }

    fetchStations();
    
    const handleOnline = () => {
      console.log("App is back online! Refreshing data...");
      fetchStations();
    };
    
    const handleOffline = () => {
      console.log("App is offline. Using cached data if available.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchStations]);

  useEffect(() => {
    if (locationState.userLocation && filteredStations.length > 0) {
      const stationsWithDistance = filteredStations.map(station => {
        const sLat = station.originalLat !== undefined ? station.originalLat : station.latitude;
        const sLng = station.originalLng !== undefined ? station.originalLng : station.longitude;
        const distance = getDistance(locationState.userLocation.latitude, locationState.userLocation.longitude, sLat, sLng);
        return { ...station, distance };
      }).sort((a, b) => a.distance - b.distance);

      setStationState(prev => ({ ...prev, nearbyStations: stationsWithDistance.slice(0, 3) }));
    } else {
      setStationState(prev => ({ ...prev, nearbyStations: [] }));
    }
  }, [locationState.userLocation, filteredStations]);

  return {
    // State
    dashboardState,
    locationState,
    stationState,
    filterState,
    uiState,
    vehicleState,
    searchState,
    tripState,
    
    // Computed values
    stations,
    filteredStations,
    
    // Actions
    handleToggleViewMode,
    handleMarkerClick,
    handleBottomNavClick,
    toggleCompatibleFilter,
    toggleAvailableFilter,
    handleSelectVehicle,
    requestLocationPermission,
    fetchStations,
    triggerHapticFeedback,
    showErrorFeedback,
    
    // State setters for direct updates
    setDashboardState,
    setLocationState,
    setStationState,
    setFilterState,
    setUiState,
    setVehicleState,
    setSearchState,
    setTripState,
    
    // Refs
    pullStartY,
    listRef,
    searchTimeoutRef
  };
}; 