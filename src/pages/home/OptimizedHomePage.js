import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllStations, getStationsByCity } from '../../services/dataService';
import { indianCities } from '../../utils/formatters';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig';

// Optimized imports
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';
import NavigationHeader from '../../components/HomePage/NavigationHeader';
import HeroSection from '../../components/HomePage/HeroSection';
import StatsSection from '../../components/HomePage/StatsSection';
import { useOptimizedScroll, useOptimizedMouse } from '../../hooks/useOptimizedScroll';
import { StationCardSkeleton, MapSkeleton } from '../../components/SkeletonLoader/SkeletonLoader';
import useParallax from '../../hooks/useParallax';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import SEO from '../../components/SEO/SEO';

// Lazy loaded components for better performance
const MapSection = React.lazy(() => import('../../components/MapSection/MapSection'));
const StationsListSection = React.lazy(() => import('../../components/StationsListSection/StationsListSection'));
const CostEstimator = React.lazy(() => import('../../components/CostEstimator/CostEstimator'));
const AiAssistantChat = React.lazy(() => import('../../components/AiAssistantChat/AiAssistantChat'));
const StationCard = React.lazy(() => import('../../components/StationCard/StationCard'));

import './HomePage.css';
import '../../components/ErrorBoundary/ErrorBoundary.css';

// Memoized constants
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

const OptimizedHomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  // Optimized state management
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
    imageFallbackLevel: {},
    geolocationError: null,
    currentEvTip: '',
    isChatOpen: false,
    hasUnreadAiMessages: false,
    cursorType: 'default'
  });

  // Refs
  const parallaxHeroContentRef = useParallax({ speed: 0.3, disableOnMobile: true });
  const searchInputRef = useRef(null);
  const aboutRef = useRef(null);
  const stationsRef = useRef(null);
  const howItWorksRef = useRef(null);

  // Intersection observers
  const aboutSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const howItWorksSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const nearestStationsSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const footerRef = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
  const evTipsSectionRef = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const costEstimatorSectionRef = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

  // Optimized scroll and mouse handling
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useOptimizedScroll({
    onScrollProgress: setScrollProgress,
    onSectionInView: (sections) => {
      sections.forEach(section => {
        section.classList.add('in-view');
      });
    }
  });

  useOptimizedMouse((position, e) => {
    setMousePosition(position);
    const target = e.target;
    const newCursorType = target.closest('button') || target.closest('a') || 
                         target.closest('.station-card') || target.closest('.feature') 
                         ? 'hover' : 'default';
    
    if (newCursorType !== uiState.cursorType) {
      setUiState(prev => ({ ...prev, cursorType: newCursorType }));
    }
  });

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
    const cityCoords = CITY_LOCATIONS[cityForFallback] || CITY_LOCATIONS.pune;
    
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

  // Optimized event handlers
  const handleCityChange = useCallback(async (city) => {
    try {
      if (!city) return;
      
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
      console.error(`Error in handleCityChange for ${city}:`, error);
    } finally {
      setPageState(prev => ({ ...prev, loading: false }));
    }
  }, [calculateDistance, getValidCoordinates]);

  const handleSearchQueryChange = useCallback((event) => {
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
  }, [handleCityChange, handleSearchSubmit]);

  const handleSearchFocus = useCallback(() => {
    if (searchState.searchQuery.trim().length > 1 && searchState.searchSuggestions.length > 0) {
      setSearchState(prev => ({ ...prev, showSuggestions: true }));
    }
  }, [searchState.searchQuery, searchState.searchSuggestions.length]);

  const handleSearchBlur = useCallback((e) => {
    setTimeout(() => {
      if (!e.currentTarget.contains(document.activeElement)) {
        setSearchState(prev => ({ ...prev, showSuggestions: false }));
      }
    }, 150);
  }, []);

  // Initialize page
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageState(prev => ({ ...prev, pageLoaded: true }));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle Firebase Auth action URLs
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    if ((mode === 'resetPassword' || mode === 'action') && oobCode) {
      navigate(`/reset-password?mode=${mode}&oobCode=${oobCode}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Initialize EV tip
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * EV_TIPS.length);
    setUiState(prev => ({ ...prev, currentEvTip: EV_TIPS[randomIndex] }));
  }, []);

  // Memoized components
  const MemoizedAboutSection = useMemo(() => (
    <section id="about" ref={aboutRef} className={`about-section animated-bg-section ${aboutSectionRef[1] ? 'is-visible' : ''}`}>
      <div className="container" ref={aboutSectionRef[0]}>
        <h2 className="initially-hidden animate-slide-up" data-scroll="slide-up">
          India's Largest EV Charging Network
        </h2>
        <div className="features-grid stagger-children">
          <div className="feature initially-hidden stagger-child-1" data-scroll="stagger-item">
            <div className="feature-icon floating-animation" aria-hidden="true">🔌</div>
            <h3>Widespread Coverage</h3>
            <p>Access to thousands of charging points across major Indian cities.</p>
          </div>
          <div className="feature initially-hidden stagger-child-2" data-scroll="stagger-item">
            <div className="feature-icon floating-animation" aria-hidden="true">⚡</div>
            <h3>Fast Charging</h3>
            <p>DC fast charging options to get you back on the road quickly.</p>
          </div>
          <div className="feature initially-hidden stagger-child-3" data-scroll="stagger-item">
            <div className="feature-icon floating-animation" aria-hidden="true">📱</div>
            <h3>Easy Booking</h3>
            <p>Book and pay for charging sessions directly from your phone.</p>
          </div>
        </div>
      </div>
    </section>
  ), [aboutSectionRef]);

  const MemoizedHowItWorksSection = useMemo(() => (
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
            onClick={() => navigate('/signup')} 
            className="btn-large"
            aria-label="Get started with EV Charging Network"
          >
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  ), [howItWorksSectionRef, navigate]);

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
            style={{ width: `${scrollProgress}%` }} 
          />
        </div>
        
        {/* Cursor Follower */}
        <div 
          className={`cursor-follower ${uiState.cursorType}`} 
          style={{ 
            left: `${mousePosition.x}px`, 
            top: `${mousePosition.y}px`,
            transform: `translate(-50%, -50%) scale(${uiState.cursorType === 'hover' ? 1.5 : 1})`,
            backgroundColor: uiState.cursorType === 'hover' ? 'rgba(12, 95, 44, 0.4)' : 'rgba(12, 95, 44, 0.2)'
          }}
        />

        <NavigationHeader pageLoaded={pageState.pageLoaded} />

        <HeroSection
          pageLoaded={pageState.pageLoaded}
          parallaxHeroContentRef={parallaxHeroContentRef}
          searchQuery={searchState.searchQuery}
          onSearchQueryChange={handleSearchQueryChange}
          onSearchSubmit={handleSearchSubmit}
          searchSuggestions={searchState.searchSuggestions}
          showSuggestions={searchState.showSuggestions}
          onSuggestionClick={handleSuggestionClick}
          onSearchFocus={handleSearchFocus}
          onSearchBlur={handleSearchBlur}
        />

        {MemoizedAboutSection}

        <StatsSection />

        {/* Map Section with Error Boundary */}
        <ErrorBoundary fallback={<MapSkeleton />}>
          <Suspense fallback={<MapSkeleton />}>
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
              onBookNowPopup={(stationId) => {
                if (currentUser) {
                  navigate(`/booking?stationId=${stationId}`);
                } else {
                  navigate(`/login?redirect=/booking&stationId=${stationId}`);
                }
              }}
              onViewDetailsPopup={(station) => {
                setMapState(prev => ({ ...prev, selectedStation: station, showPopup: true }));
                setTimeout(() => {
                  const stationElement = document.getElementById(`station-${station.id}`);
                  if (stationElement) {
                    stationElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 500);
              }}
              cityLocations={CITY_LOCATIONS}
              selectedCity={pageState.selectedCity}
              onCityChange={handleCityChange}
              data-scroll="fade-in"
            />
          </Suspense>
        </ErrorBoundary>
          
        {/* Stations List Section */}
        <ErrorBoundary fallback={<div>Error loading stations</div>}>
          <Suspense fallback={<StationCardSkeleton />}>
            <StationsListSection
              loading={pageState.loading}
              isSearching={searchState.isSearching}
              searchQuery={searchState.searchQuery}
              selectedCity={pageState.selectedCity}
              currentCityStations={stationsData.currentCityStations}
              onBookNow={(stationId) => {
                if (currentUser) {
                  navigate(`/booking?stationId=${stationId}`);
                } else {
                  navigate(`/login?redirect=/booking&stationId=${stationId}`);
                }
              }}
              onLocateOnMap={(station) => {
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
                if (stationsRef.current) {
                  stationsRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              imageFallbackLevel={uiState.imageFallbackLevel}
              onImageError={(stationId) => {
                const currentLevel = uiState.imageFallbackLevel[stationId] || 0;
                if (currentLevel < 2) {
                  setUiState(prev => ({
                    ...prev,
                    imageFallbackLevel: {
                      ...prev.imageFallbackLevel,
                      [stationId]: currentLevel + 1
                    }
                  }));
                }
              }}
              onImageLoad={() => {}}
              commonFallbackImage="/images/charging-stations/commonoimage.jpg"
            />
          </Suspense>
        </ErrorBoundary>

        {MemoizedHowItWorksSection}

        {/* Cost Estimator Section */}
        <section ref={costEstimatorSectionRef[0]} className={`cost-estimator-section animated-bg-section ${costEstimatorSectionRef[1] ? 'is-visible' : ''}`}>
          <div className="container">
            <h2 className="initially-hidden animate-slide-up" data-scroll="slide-up">
              Estimate Charging Cost & Time
            </h2>
            <div className="initially-hidden animate-fade-in" style={{ animationDelay: '0.2s' }} data-scroll="fade-in">
              <ErrorBoundary fallback={<div>Error loading cost estimator</div>}>
                <Suspense fallback={<div>Loading cost estimator...</div>}>
                  <CostEstimator />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </section>

        {/* Geolocation Error Message */}
        {uiState.geolocationError && !pageState.locationFound && (
          <section className={`geolocation-error-section ${pageState.pageLoaded ? 'animate-on-load-fade-in' : 'initially-hidden'}`}>
            <div className="container">
              <p className="geolocation-error-message">⚠️ {uiState.geolocationError}</p>
            </div>
          </section>
        )}

        {/* Nearest Stations Section */}
        {pageState.locationFound && stationsData.nearestStations.length > 0 && (
          <section ref={nearestStationsSectionRef[0]} className={`nearest-stations-section ${nearestStationsSectionRef[1] ? 'is-visible' : ''}`}>
            <div className="container">
              <h2 className="initially-hidden animate-slide-up" data-scroll="slide-up">Stations Near You</h2>
              <div className="stations-grid nearest-stations-grid"> 
                {stationsData.nearestStations.map((station, index) => (
                  <div key={`nearest-${station.id}`} data-scroll="stagger-item">
                    <ErrorBoundary fallback={<StationCardSkeleton />}>
                      <Suspense fallback={<StationCardSkeleton />}>
                        <StationCard
                          station={station}
                          onBookNow={(stationId) => {
                            if (currentUser) {
                              navigate(`/booking?stationId=${stationId}`);
                            } else {
                              navigate(`/login?redirect=/booking&stationId=${stationId}`);
                            }
                          }}
                          onLocateOnMap={(station) => {
                            setMapState(prev => ({ 
                              ...prev, 
                              selectedStation: station, 
                              showPopup: true 
                            }));
                            if (stationsRef.current) {
                              stationsRef.current.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          imageFallbackLevel={uiState.imageFallbackLevel}
                          onImageError={(stationId) => {
                            const currentLevel = uiState.imageFallbackLevel[stationId] || 0;
                            if (currentLevel < 2) {
                              setUiState(prev => ({
                                ...prev,
                                imageFallbackLevel: {
                                  ...prev.imageFallbackLevel,
                                  [stationId]: currentLevel + 1
                                }
                              }));
                            }
                          }}
                          onImageLoad={() => {}}
                          commonFallbackImage="/images/charging-stations/commonoimage.jpg"
                          animationIndex={index}
                        />
                      </Suspense>
                    </ErrorBoundary>
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
                <button 
                  onClick={() => {
                    const randomIndex = Math.floor(Math.random() * EV_TIPS.length);
                    setUiState(prev => ({ ...prev, currentEvTip: EV_TIPS[randomIndex] }));
                  }} 
                  className="btn-next-tip"
                  aria-label="Show another EV tip"
                >
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
                    onClick={() => window.open('https://facebook.com/evchargingnetwork', '_blank', 'noopener,noreferrer')}
                    className="social-link"
                    aria-label="Facebook"
                  >
                    <span role="img" aria-hidden="true">🅕</span> 
                  </button>
                  <button 
                    onClick={() => window.open('https://twitter.com/evchargingnetwork', '_blank', 'noopener,noreferrer')}
                    className="social-link"
                    aria-label="Twitter"
                  >
                    <span role="img" aria-hidden="true">𝕏</span>
                  </button>
                  <button 
                    onClick={() => window.open('https://instagram.com/evchargingnetwork', '_blank', 'noopener,noreferrer')}
                    className="social-link"
                    aria-label="Instagram"
                  >
                    <span role="img" aria-hidden="true">📷</span>
                  </button>
                  <button 
                    onClick={() => window.open('https://linkedin.com/company/evchargingnetwork', '_blank', 'noopener,noreferrer')}
                    className="social-link"
                    aria-label="LinkedIn"
                  >
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
        <button 
          onClick={() => setUiState(prev => ({ 
            ...prev, 
            isChatOpen: !prev.isChatOpen,
            hasUnreadAiMessages: prev.isChatOpen ? false : prev.hasUnreadAiMessages
          }))} 
          className="ai-assistant-fab" 
          aria-label="Toggle AI Assistant Chat"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
          </svg>
          {uiState.hasUnreadAiMessages && <span className="notification-badge">1</span>}
        </button>

        {/* AI Assistant Chat Window */}
        <ErrorBoundary fallback={<div>Error loading AI chat</div>}>
          <Suspense fallback={<div>Loading AI chat...</div>}>
            <AiAssistantChat 
              isOpen={uiState.isChatOpen} 
              onClose={() => setUiState(prev => ({ ...prev, isChatOpen: false }))} 
              onNewMessage={() => {
                if (!uiState.isChatOpen) {
                  setUiState(prev => ({ ...prev, hasUnreadAiMessages: true }));
                }
              }} 
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default OptimizedHomePage; 