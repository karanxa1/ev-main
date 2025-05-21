import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map from 'react-map-gl';
import { FaMapMarkedAlt, FaHistory, FaSave, FaRoute, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig';
import TripPlanner from '../../components/TripPlanner/TripPlanner';
import 'mapbox-gl/dist/mapbox-gl.css';
import './TripsPage.css';

// Debounce function
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

const TripsPage = () => {
  const [origin, setOrigin] = useState({ address: '', coordinates: null });
  const [destination, setDestination] = useState({ address: '', coordinates: null });
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [isOriginLoading, setIsOriginLoading] = useState(false);
  const [isDestinationLoading, setIsDestinationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [tripRoute, setTripRoute] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const [isPlannerExpanded, setIsPlannerExpanded] = useState(true);
  const [viewMode, setViewMode] = useState('planner'); // 'planner' or 'history'
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [stations, setStations] = useState([]);
  const [userVehicle, setUserVehicle] = useState(null);
  const { currentUser } = useAuth();
  
  const mapRef = useRef();

  // Fetch user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          // Set user's location as default origin
          if (!origin.coordinates) {
            // Reverse geocode to get address
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`)
              .then(res => res.json())
              .then(data => {
                if (data && data.features && data.features.length > 0) {
                  setOrigin({
                    address: data.features[0].place_name,
                    coordinates: { longitude, latitude }
                  });
                }
              })
              .catch(err => console.error('Error reverse geocoding:', err));
          }
        },
        (err) => console.warn("Error getting user location:", err.message)
      );
    }
    
    // Fetch stations data (mock data for now, would be from your actual API)
    // This would typically come from your data service
    const fetchStations = async () => {
      try {
        // Replace with actual data fetching
        const mockStations = [
          {
            id: 'station1',
            name: 'City Center Charging Hub',
            latitude: 18.52,
            longitude: 73.86,
            status: 'Available',
            chargerTypes: ['CCS2', 'Type 2'],
            pricePerKwh: 12
          },
          {
            id: 'station2',
            name: 'Highway Fast Charger',
            latitude: 18.55,
            longitude: 73.90,
            status: 'Available',
            chargerTypes: ['CHAdeMO', 'CCS2'],
            pricePerKwh: 15
          }
          // Add more mock stations as needed
        ];
        setStations(mockStations);
      } catch (err) {
        console.error('Error fetching stations:', err);
      }
    };
    
    fetchStations();
    
    // Fetch user's vehicle (if available)
    // This would typically come from your auth context or user data service
    const fetchUserVehicle = async () => {
      try {
        // Replace with actual data fetching
        const mockVehicle = {
          name: 'Tata Nexon EV',
          range: 350, // km
          batteryCapacity: 40, // kWh
          compatibleChargerTypes: ['CCS2', 'Type 2']
        };
        setUserVehicle(mockVehicle);
      } catch (err) {
        console.error('Error fetching user vehicle:', err);
      }
    };
    
    fetchUserVehicle();
    
    // Fetch saved trips if user is logged in
    if (currentUser) {
      fetchSavedTrips();
    }
  }, [currentUser]);
  
  // Fetch saved trips from Firebase
  const fetchSavedTrips = async () => {
    try {
      if (!currentUser) return;
      
      const tripsQuery = query(
        collection(db, 'trips'), 
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(tripsQuery);
      const trips = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSavedTrips(trips);
    } catch (err) {
      console.error('Error fetching saved trips:', err);
    }
  };

  const fetchGeocodingSuggestions = async (query, type) => {
    if (!query || query.length < 3) {
      if (type === 'origin') setOriginSuggestions([]);
      if (type === 'destination') setDestinationSuggestions([]);
      return;
    }

    if (type === 'origin') setIsOriginLoading(true);
    if (type === 'destination') setIsDestinationLoading(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=IN`
      );
      const data = await response.json();
      if (data && data.features) {
        if (type === 'origin') {
          setOriginSuggestions(data.features);
        } else {
          setDestinationSuggestions(data.features);
        }
      }
    } catch (error) {
      console.error('Error fetching geocoding suggestions:', error);
      if (type === 'origin') setOriginSuggestions([]);
      if (type === 'destination') setDestinationSuggestions([]);
    }
    if (type === 'origin') setIsOriginLoading(false);
    if (type === 'destination') setIsDestinationLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchSuggestions = useCallback(debounce(fetchGeocodingSuggestions, 300), [MAPBOX_TOKEN]);

  const handleInputChange = (type, value) => {
    if (type === 'origin') {
      setOrigin({ address: value, coordinates: null });
      debouncedFetchSuggestions(value, 'origin');
    } else {
      setDestination({ address: value, coordinates: null });
      debouncedFetchSuggestions(value, 'destination');
    }
  };

  const handleSuggestionClick = (type, suggestion) => {
    if (type === 'origin') {
      setOrigin({
        address: suggestion.place_name,
        coordinates: {
          longitude: suggestion.geometry.coordinates[0],
          latitude: suggestion.geometry.coordinates[1]
        }
      });
      setOriginSuggestions([]);
    } else {
      setDestination({
        address: suggestion.place_name,
        coordinates: {
          longitude: suggestion.geometry.coordinates[0],
          latitude: suggestion.geometry.coordinates[1]
        }
      });
      setDestinationSuggestions([]);
    }
  };

  const handleSubmitTrip = (e) => {
    e.preventDefault();
    if (!origin.coordinates || !destination.coordinates) {
      alert("Please select valid origin and destination locations from the suggestions.");
      return;
    }
    
    // Show the trip planner with the selected locations
    setShowTripPlanner(true);
    setIsPlannerExpanded(true);
  };
  
  const handleRouteCalculated = (routeData) => {
    console.log('Route calculated:', routeData);
    setTripRoute(routeData);
    
    // Zoom map to show the route
    if (mapRef.current && routeData) {
      zoomToRoute(routeData);
    }
  };
  
  const zoomToRoute = (routeData) => {
    if (!mapRef.current) return;
    
    // Calculate bounds to include all points (origin, destination, stops)
    const points = [
      [routeData.origin.longitude, routeData.origin.latitude],
      [routeData.destination.longitude, routeData.destination.latitude],
      ...(routeData.stops || []).map(stop => [stop.longitude, stop.latitude])
    ];
    
    // Find min/max coordinates
    const bounds = points.reduce(
      (acc, point) => ({
        minLng: Math.min(acc.minLng, point[0]),
        maxLng: Math.max(acc.maxLng, point[0]),
        minLat: Math.min(acc.minLat, point[1]),
        maxLat: Math.max(acc.maxLat, point[1]),
      }),
      { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
    );
    
    // Fit the map to the bounds
    mapRef.current.fitBounds(
      [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
      { padding: 50, duration: 1000 }
    );
  };
  
  const handleSaveTrip = async () => {
    if (!currentUser) {
      alert("Please log in to save trips.");
      return;
    }
    
    if (!tripRoute) {
      alert("Please plan a trip first.");
      return;
    }
    
    try {
      const tripData = {
        userId: currentUser.uid,
        origin: {
          name: origin.address,
          coordinates: origin.coordinates
        },
        destination: {
          name: destination.address,
          coordinates: destination.coordinates
        },
        distance: tripRoute.distance,
        duration: tripRoute.duration,
        stops: tripRoute.stops || [],
        timestamp: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'trips'), tripData);
      console.log('Trip saved with ID:', docRef.id);
      
      // Update the saved trips list
      setSavedTrips([{ id: docRef.id, ...tripData }, ...savedTrips]);
      
      alert('Trip saved successfully!');
    } catch (err) {
      console.error('Error saving trip:', err);
      alert('Failed to save trip. Please try again.');
    }
  };
  
  const handleSelectSavedTrip = (trip) => {
    setSelectedTrip(trip);
    
    // Set origin and destination from saved trip
    setOrigin(trip.origin);
    setDestination(trip.destination);
    
    // Create a route object for the map
    const routeData = {
      origin: trip.origin.coordinates,
      destination: trip.destination.coordinates,
      stops: trip.stops || [],
      distance: trip.distance,
      duration: trip.duration
    };
    
    setTripRoute(routeData);
    zoomToRoute(routeData);
    
    // Switch to planner view to show the trip details
    setViewMode('planner');
  };

  return (
    <div className="trips-page-container">
      <div className="trips-header">
        <h1>Trip Planner</h1>
        <p>Plan your journey with optimal charging stops</p>
        
        <div className="view-toggle">
          <button 
            className={`view-toggle-btn ${viewMode === 'planner' ? 'active' : ''}`}
            onClick={() => setViewMode('planner')}
          >
            <FaRoute /> Plan Trip
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'history' ? 'active' : ''}`}
            onClick={() => setViewMode('history')}
          >
            <FaHistory /> Saved Trips
          </button>
        </div>
      </div>

      <div className="trips-content">
        {viewMode === 'planner' ? (
          <div className="trip-planner-view">
            {!showTripPlanner ? (
              <form onSubmit={handleSubmitTrip} className="trip-form">
                <div className="trip-input-group">
                  <span className="dot-icon origin-dot"></span>
                  <input 
                    type="text"
                    id="origin"
                    value={origin.address}
                    onChange={(e) => handleInputChange('origin', e.target.value)}
                    placeholder="Enter Origin"
                    className="trip-input"
                    autoComplete="off"
                  />
                  <div className="input-connector"></div>
                  {isOriginLoading && <div className="suggestions-loading">Loading...</div>}
                  {originSuggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {originSuggestions.map((suggestion) => (
                        <li key={suggestion.id} onClick={() => handleSuggestionClick('origin', suggestion)}>
                          {suggestion.place_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="trip-input-group">
                  <span className="dot-icon destination-dot"></span>
                  <input 
                    type="text"
                    id="destination"
                    value={destination.address}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    placeholder="Enter Destination"
                    className="trip-input"
                    autoComplete="off"
                  />
                  {isDestinationLoading && <div className="suggestions-loading">Loading...</div>}
                  {destinationSuggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {destinationSuggestions.map((suggestion) => (
                        <li key={suggestion.id} onClick={() => handleSuggestionClick('destination', suggestion)}>
                          {suggestion.place_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="btn-plan-trip"
                  disabled={!origin.coordinates || !destination.coordinates}
                >
                  <FaRoute /> Plan Route
                </button>
              </form>
            ) : (
              <div className={`trip-details-panel ${isPlannerExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="trip-panel-header" onClick={() => setIsPlannerExpanded(!isPlannerExpanded)}>
                  <div className="trip-summary">
                    <div className="trip-endpoints">
                      <span>{origin.address.split(',')[0]}</span>
                      <FaArrowRight className="trip-arrow" />
                      <span>{destination.address.split(',')[0]}</span>
                    </div>
                    {tripRoute && (
                      <div className="trip-stats">
                        <span>{Math.round(tripRoute.distance)} km</span>
                        <span>{Math.round(tripRoute.duration * 60)} min</span>
                      </div>
                    )}
                  </div>
                  <span className="panel-toggle">{isPlannerExpanded ? '−' : '+'}</span>
                </div>
                
                {isPlannerExpanded && (
                  <div className="trip-planner-content">
                    <div className="trip-actions">
                      <button 
                        className="btn-save-trip" 
                        onClick={handleSaveTrip}
                        disabled={!tripRoute || !currentUser}
                      >
                        <FaSave /> Save Trip
                      </button>
                      <button 
                        className="btn-new-trip"
                        onClick={() => {
                          setShowTripPlanner(false);
                          setTripRoute(null);
                        }}
                      >
                        <FaRoute /> New Trip
                      </button>
                    </div>
                    
                    <TripPlanner
                      userLocation={userLocation}
                      stations={stations}
                      userVehicle={userVehicle}
                      onRouteCalculated={handleRouteCalculated}
                      mapRef={mapRef}
                      onClose={() => setShowTripPlanner(false)}
                      initialOrigin={origin}
                      initialDestination={destination}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="map-container">
              {MAPBOX_TOKEN ? (
                <Map
                  ref={mapRef}
                  initialViewState={{
                    longitude: 78.9629, // Default to center of India
                    latitude: 20.5937,
                    zoom: 4
                  }}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Map markers and route visualization would be rendered here */}
                </Map>
              ) : (
                <div className="map-placeholder">
                  <p>Map loading error: Mapbox token not configured.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="saved-trips-view">
            <h2>Your Saved Trips</h2>
            {currentUser ? (
              savedTrips.length > 0 ? (
                <div className="saved-trips-list">
                  {savedTrips.map(trip => (
                    <div 
                      key={trip.id} 
                      className={`saved-trip-card ${selectedTrip?.id === trip.id ? 'selected' : ''}`}
                      onClick={() => handleSelectSavedTrip(trip)}
                    >
                      <div className="trip-card-header">
                        <div className="trip-date">
                          {new Date(trip.timestamp).toLocaleDateString()}
                        </div>
                        <div className="trip-distance">
                          {Math.round(trip.distance)} km
                        </div>
                      </div>
                      
                      <div className="trip-locations">
                        <div className="trip-location">
                          <span className="location-dot origin"></span>
                          <span className="location-name">{trip.origin.name.split(',')[0]}</span>
                        </div>
                        
                        {trip.stops && trip.stops.length > 0 && (
                          <div className="trip-stops">
                            {trip.stops.length} charging {trip.stops.length === 1 ? 'stop' : 'stops'}
                          </div>
                        )}
                        
                        <div className="trip-location">
                          <span className="location-dot destination"></span>
                          <span className="location-name">{trip.destination.name.split(',')[0]}</span>
                        </div>
                      </div>
                      
                      <button className="btn-view-trip">
                        <FaMapMarkedAlt /> View Route
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-saved-trips">
                  <p>You haven't saved any trips yet.</p>
                  <button 
                    className="btn-plan-new-trip"
                    onClick={() => setViewMode('planner')}
                  >
                    <FaRoute /> Plan Your First Trip
                  </button>
                </div>
              )
            ) : (
              <div className="login-prompt">
                <p>Please log in to save and view your trips.</p>
                <button className="btn-login">Log In</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsPage; 