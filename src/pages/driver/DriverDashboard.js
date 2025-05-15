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

const DriverDashboard = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [rawStations, setRawStations] = useState([]); // Store raw stations from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStationPopup, setSelectedStationPopup] = useState(null);
  const [activeBottomNav, setActiveBottomNav] = useState('Map');
  
  // User vehicle state
  const [userVehicle, setUserVehicle] = useState(state?.vehicle || null);
  const [showCompatibleOnly, setShowCompatibleOnly] = useState(false);

  const [viewport, setViewport] = useState({
    longitude: DEFAULT_FALLBACK_COORDS.longitude,
    latitude: DEFAULT_FALLBACK_COORDS.latitude,
    zoom: 11,
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

  // Process stations to ensure valid coordinates and mark compatibility
  const stations = useMemo(() => {
    const stationCoordinatesCount = {};
    
    // First, process all stations for coordinates
    const processedStations = rawStations.map(station => {
      let lat = parseFloat(station.latitude);
      let lng = parseFloat(station.longitude);

      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        lat = DEFAULT_FALLBACK_COORDS.latitude;
        lng = DEFAULT_FALLBACK_COORDS.longitude;
      }
      
      const coordKey = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
      stationCoordinatesCount[coordKey] = (stationCoordinatesCount[coordKey] || 0) + 1;
      
      // Apply jitter if more than one station is at the exact same (rounded) spot
      if (stationCoordinatesCount[coordKey] > 1) {
        const jittered = getJitteredCoordinates(lat, lng, station.id);
        return { 
          ...station, 
          latitude: jittered.latitude, 
          longitude: jittered.longitude, 
          originalLat: lat, 
          originalLng: lng 
        };
      }
      return { ...station, latitude: lat, longitude: lng }; 
    });
    
    // Now, add compatibility information if user has a vehicle
    if (userVehicle && userVehicle.compatibleChargerTypes) {
      return processedStations.map(station => {
        // Check if station has charger types and if any match the vehicle's compatible types
        const isCompatible = station.chargerTypes && 
          station.chargerTypes.some(type => 
            userVehicle.compatibleChargerTypes.includes(type)
          );
        
        return { ...station, isCompatible };
      });
    }
    
    return processedStations;
  }, [rawStations, userVehicle]);

  // Filtered stations based on compatibility preference
  const filteredStations = useMemo(() => {
    // When no vehicle is selected, always show all stations
    if (!userVehicle) {
      return stations;
    }
    
    // Only filter by compatibility if user has a vehicle and wants compatible stations only
    if (showCompatibleOnly) {
      return stations.filter(station => station.isCompatible);
    }
    
    return stations;
  }, [stations, showCompatibleOnly, userVehicle]);

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
    }
  };

  const toggleCompatibleFilter = () => {
    setShowCompatibleOnly(!showCompatibleOnly);
  };

  const handleSelectVehicle = () => {
    console.log('handleSelectVehicle called. Navigating to /change-vehicle...'); // Updated diagnostic log
    navigate('/change-vehicle'); // Changed navigation path
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

        {MAPBOX_TOKEN ? (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={viewport}
            onMove={evt => setViewport(evt.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
          >
            <NavigationControl position="bottom-right" style={{ marginBottom: '80px' }} />

            {userLocation && (
              <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
                <div className="user-location-marker"></div>
              </Marker>
            )}

            {/* Use the filtered stations for rendering markers */}
            {filteredStations.map(station => {
              // Coordinates are already validated and potentially jittered by useMemo
              if (station.latitude && station.longitude) { // Basic check again, though useMemo should handle invalids
                return (
                  <Marker key={station.id} longitude={station.longitude} latitude={station.latitude} anchor="bottom" onClick={(e) => { e.originalEvent.stopPropagation(); handleMarkerClick(station); }}>
                    <div className={`station-marker 
                      ${station.availability ? 'available' : 'occupied'}
                      ${userVehicle && station.isCompatible ? 'compatible' : ''}
                    `}>
                      {userVehicle && station.isCompatible && <FaCheck className="compatibility-icon" />}
                      ⚡
                    </div>
                  </Marker>
                );
              }
              return null;
            })}

            {selectedStationPopup && (
              <Popup 
                longitude={parseFloat(selectedStationPopup.originalLng !== undefined ? selectedStationPopup.originalLng : selectedStationPopup.longitude)} 
                latitude={parseFloat(selectedStationPopup.originalLat !== undefined ? selectedStationPopup.originalLat : selectedStationPopup.latitude)} 
                onClose={() => setSelectedStationPopup(null)} 
                closeOnClick={false} 
                anchor="top" 
                offset={25}
              >
                <div className="station-popup">
                  <h4>{selectedStationPopup.name || 'N/A'}</h4>
                  <p>{selectedStationPopup.address || 'Address not available'}</p>
                  <p>Status: {selectedStationPopup.hasOwnProperty('availability') ? (selectedStationPopup.availability ? 'Available' : 'Occupied') : 'Status unknown'}</p>
                  {userVehicle && selectedStationPopup.isCompatible && (
                    <p className="compatibility-notice">✓ Compatible with your vehicle</p>
                  )}
                  {userVehicle && !selectedStationPopup.isCompatible && (
                    <p className="incompatibility-notice">✗ Not compatible with your vehicle</p>
                  )}
                  {selectedStationPopup.chargerTypes && (
                    <p>Charger Types: {selectedStationPopup.chargerTypes.join(', ')}</p>
                  )}
                </div>
              </Popup>
            )}
            <div className="map-action-button recenter-button" onClick={flyToUserLocation}>
                <FaCrosshairs size={20} />
            </div>
            <div className="map-action-button list-toggle-button">
                <FaListAlt size={20} /> 
            </div>
          </Map>
        ) : (
          <p className="map-token-error">Mapbox token is not configured. Map cannot be displayed.</p>
        )}
        
        {loading && <div className="loading-overlay">Loading stations...</div>}
        {error && <div className="error-message">{error}</div>}
        
        {!userVehicle && !loading && (
          <div className="vehicle-missing-notice">
            No vehicle selected. Showing all charging stations. Select a vehicle to see compatible stations.
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
            {item.new && <span className="new-badge">New</span>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default DriverDashboard;
