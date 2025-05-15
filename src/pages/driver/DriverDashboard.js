import React, { useState, useEffect, useRef, useMemo } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './DriverDashboard.css';
import { getAllStations } from '../../services/dataService';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig';
import { 
  FaMapMarkedAlt, FaWallet, FaBullhorn, FaRoute, FaShoppingBag, FaUserCircle, 
  FaFilter, FaCrosshairs, FaListAlt, FaSearch, FaChevronDown, FaCheck 
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
  const [viewMode, setViewMode] = useState('map'); // ADDED_LINE: 'map' or 'list' view
  const [nearbyStations, setNearbyStations] = useState([]); // ADDED_LINE: For closest station suggestions
  
  // User vehicle state
  const [userVehicle, setUserVehicle] = useState(state?.vehicle || null);
  const [showCompatibleOnly, setShowCompatibleOnly] = useState(false);

  const [viewport, setViewport] = useState({
    longitude: 78.9629, // MODIFIED_LINE: India's approximate longitude
    latitude: 20.5937,  // MODIFIED_LINE: India's approximate latitude
    zoom: 4.5,            // MODIFIED_LINE: Zoom level for an overview of India
    bearing: 0,
    pitch: 0
  });

  const mapRef = useRef();

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

  // Filtered stations based on compatibility preference
  const filteredStations = useMemo(() => {
    // When no vehicle is selected, always show all stations
    if (!userVehicle) {
      console.log('DriverDashboard: filteredStations (no vehicle):', stations); // ADDED_LOG
      return stations;
    }
    
    // Only filter by compatibility if user has a vehicle and wants compatible stations only
    if (showCompatibleOnly) {
      const compatibleStations = stations.filter(station => station.isCompatible);
      console.log('DriverDashboard: filteredStations (compatible only):', compatibleStations); // ADDED_LOG
      return compatibleStations;
    }
    
    console.log('DriverDashboard: filteredStations (all with vehicle):', stations); // ADDED_LOG
    return stations;
  }, [stations, showCompatibleOnly, userVehicle]);

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

  const handleSelectVehicle = () => {
    console.log('handleSelectVehicle called. Navigating to /change-vehicle...'); // Updated diagnostic log
    navigate('/change-vehicle'); // Changed navigation path
  };

  const handleToggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'map' ? 'list' : 'map');
  };

  return (
    <div className="driver-dashboard-mobile">
      <main className="map-view-full-container">
        <section className="search-and-filters-on-map">
          <div className="search-bar-on-map">
            <FaSearch className="search-icon-on-map" />
            <input type="text" placeholder="Search location ..." />
            <FaFilter className="filter-icon-on-map" />
          </div>
          <div className="filters-on-map">
            {userVehicle ? (
              <button className="filter-chip" onClick={handleSelectVehicle}>
                {userVehicle.name.length > 15 
                  ? `${userVehicle.name.substring(0, 15)}...` 
                  : userVehicle.name} 
                <FaChevronDown size={12}/>
              </button>
            ) : (
              <button className="filter-chip" onClick={handleSelectVehicle}>Select Vehicle <FaChevronDown size={12}/></button>
            )}
            
            <button 
              className={`filter-chip ${showCompatibleOnly ? 'active' : ''}`}
              onClick={toggleCompatibleFilter}
              disabled={!userVehicle}
            >
              {showCompatibleOnly ? 'Compatible' : 'All Chargers'}
            </button>
            
            <button className="filter-chip">Available</button>
          </div>
        </section>

        {/* Main Map or List View Area */}
        <div className="main-view-area">
          {viewMode === 'map' && MAPBOX_TOKEN && (
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
                <Marker
                  key={station.id} // Ensure unique key for each marker
                  longitude={station.longitude}
                  latitude={station.latitude}
                  onClick={() => handleMarkerClick(station)}
                >
                  {/* Apply station-marker base class and conditional classes for status/compatibility */}
                  <div 
                    className={`station-marker ${station.status === 'Available' ? 'available' : (station.status === 'Occupied' ? 'occupied' : 'unknown')} ${station.isCompatible ? 'compatible' : ''} ${userVehicle ? '' : 'no-vehicle'}`}
                    title={station.name}
                  >⚡</div> 
                </Marker>
              ))}
              
              {/* User Location Marker */}
              {userLocation && (
                <Marker longitude={userLocation.longitude} latitude={userLocation.latitude}>
                  <div className="user-location-dot"></div>
                </Marker>
              )}

              {selectedStationPopup && (
                <Popup
                  longitude={selectedStationPopup.originalLng !== undefined ? selectedStationPopup.originalLng : selectedStationPopup.longitude}
                  latitude={selectedStationPopup.originalLat !== undefined ? selectedStationPopup.originalLat : selectedStationPopup.latitude}
                  onClose={() => setSelectedStationPopup(null)}
                  closeButton={true}
                  closeOnClick={false}
                  anchor="bottom"
                  className="station-popup"
                >
                  <div>
                    <h3>{selectedStationPopup.name}</h3>
                    <p>{selectedStationPopup.address}</p>
                    {selectedStationPopup.isCompatible !== undefined && (
                      <p className={selectedStationPopup.isCompatible ? 'compatible-text' : 'not-compatible-text'}>
                        {selectedStationPopup.isCompatible ? 'Compatible with your vehicle' : 'May not be compatible'}
                      </p>
                    )}
                    {/* Add more details or a button to navigate/get directions */}
                  </div>
                </Popup>
              )}
            </Map>
          )}
          {viewMode === 'map' && !MAPBOX_TOKEN && (
             <div className="map-loading-placeholder">Map cannot be displayed. Mapbox token is missing.</div>
          )}

          {viewMode === 'list' && (
            <div className="stations-list-view-container">
              {/* Search and filter chips can be re-integrated here if needed for list view specifically */}
              {/* For now, showing a simple list based on filteredStations from map view */}
              {loading && <p className="list-loading-message">Loading stations...</p>}
              {error && <p className="list-error-message">{error}</p>}
              {!loading && !error && filteredStations.length === 0 && <p className="list-empty-message">No stations found.</p>}
              {!loading && !error && filteredStations.length > 0 && (
                <div className="station-cards-list">
                  {filteredStations.map(station => (
                    <div key={station.id} className="station-list-card-item" onClick={() => handleMarkerClick(station)}>
                      <div className="list-card-left">
                        {/* Placeholder for Brand Icon */}
                        <div className="list-station-brand-icon">
                          {station.name ? station.name.charAt(0) : 'S'} 
                        </div>
                      </div>
                      <div className="list-card-main">
                        <h3 className="list-station-name">{station.name}</h3>
                        <p className="list-station-address">{station.address ? station.address.split(',')[0] : 'Address details'}</p>
                        <p className={`list-station-availability ${station.status === 'Available' ? 'available' : 'unavailable'}`}>
                          {station.status || 'Status N/A'} {/* Placeholder for status */}
                          {station.status === 'Available' && <FaCheck className="icon" />}
                          {station.status === 'Unavailable' && <span className="icon">✕</span>}
                        </p>
                      </div>
                      <div className="list-card-right">
                        <span className={`list-station-access ${station.accessType?.toLowerCase()}`}>{station.accessType || 'Public'}</span>
                        {/* Placeholder for Rating */}
                        <div className="list-station-rating">
                          <span>{station.rating || '4.3'}</span> <span className="star">★</span>
                        </div>
                        {/* Conditional "New" Tag placeholder */}
                        {station.isNew && <span className="list-station-new-tag">New</span>}
                        {station.distance !== undefined && (
                          <p className="list-station-distance">{station.distance.toFixed(1)} kms</p>
                        )}
                        <div className="list-station-chargers">
                          {station.chargerTypes && station.chargerTypes.slice(0,2).map(type => (
                            <span key={type} className="type-badge">{type}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nearby Stations Bar - Renders only in map view and if user location is available */}
        {viewMode === 'map' && userLocation && nearbyStations.length > 0 && (
          <div className="nearby-stations-carousel-container">
            {/* Optional: Title for the carousel if needed, though image doesn't show one explicitly above cards */}
            {/* <h4>Nearby Stations:</h4> */}
            <div className="nearby-station-cards-scrollable">
              {nearbyStations.map(station => (
                <div 
                  key={station.id} 
                  className="nearby-station-card"
                  onClick={() => handleMarkerClick(station)}
                  title={`${station.name} (${station.distance.toFixed(1)} km away)`}
                >
                  <div className="card-content-wrapper">
                    <div className="card-left">
                      {/* Placeholder for Brand Icon. You can replace this with an <img> tag if you have icon URLs */}
                      <div className="station-brand-icon-placeholder">
                        {station.name ? station.name.charAt(0) : 'S'}
                      </div>
                    </div>
                    <div className="card-main-details">
                      <h3>{station.name}</h3>
                      <p className="station-address-line">{station.address ? station.address.split(',')[0] : 'Address unavailable'}</p>
                      {/* Placeholder for Availability - assuming station.status might exist */}
                      <p className={`station-availability ${station.status === 'Available' ? 'status-available' : 'status-unavailable'}`}>
                        {station.status || 'Status N/A'} {/* Default to 'Status N/A' if not present */}
                        {station.status === 'Available' && <FaCheck className="available-check-icon"/>}
                      </p>
                    </div>
                    <div className="card-right-details">
                      {/* Placeholder for Rating */}
                      <div className="station-rating-placeholder">
                        <span>{station.rating || '4.2'}</span>{/* Default to 4.2 if not present */} 
                        <span className="star-icon">★</span>
                      </div>
                      <p className="station-distance">{station.distance.toFixed(1)} km</p>
                      <div className="station-charger-types">
                        {station.chargerTypes && station.chargerTypes.slice(0, 2).map(type => (
                          <span key={type} className="charger-type-badge">{type}</span>
                        ))}
                        {/* Add ellipsis or +more if more than 2 types */} 
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="map-actions-overlay">
          <div className="map-action-button recenter-button" onClick={flyToUserLocation}>
            <FaCrosshairs />
          </div>
          <div className="map-action-button list-toggle-button" onClick={handleToggleViewMode}> {/* MODIFIED_LINE */}
            {viewMode === 'map' ? <FaListAlt /> : <FaMapMarkedAlt />} {/* Toggle icon based on viewMode */}
          </div>
        </div>
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
    </div>
  );
};

export default DriverDashboard;
