import React, { forwardRef, useEffect, useState, useRef } from 'react';
import Map, { NavigationControl, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapSection.css'; // To be created

// Helper function to ensure we always have an array (can be moved to a utils file later)
const ensureArray = (possibleArray) => {
  if (!possibleArray) return [];
  return Array.isArray(possibleArray) ? possibleArray : [];
};

// Simple map container ID that we'll use as a string for the Map component
const MAPBOX_CONTAINER_ID = "mapbox-container-element";

const MapSection = forwardRef(({
  loading,
  mapboxToken,
  viewState,
  onViewStateChange,
  currentCityStations,
  getValidCoordinates, // This function might need to be passed or defined within if it doesn't rely on HomePage state not passed down
  selectedStation,
  showPopup,
  onMarkerClick,
  onClosePopup,
  onBookNowPopup,
  onViewDetailsPopup,
  cityLocations,
  selectedCity,
  onCityChange,
}, ref) => {
  // State to track if we should render the map
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const mapContainerRef = useRef(null); // Ref for the map container div
  const mapRef = useRef(null); // Ref for the map instance
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState(false); // Track if scroll zoom is enabled
  
  // Wait until after mount to render the map
  useEffect(() => {
    // Short delay to ensure DOM is ready before we try to initialize the map
    const timer = setTimeout(() => {
      console.log("[MapSection] Attempting to set shouldRenderMap to true");
      setShouldRenderMap(true);
    }, 500); // Adjusted delay slightly
    
    return () => clearTimeout(timer);
  }, []);
  
  // City buttons rendering with the restored UI style
  const renderStyledCityButtons = () => {
    if (!cityLocations || Object.keys(cityLocations).length === 0) {
      console.log("[MapSection] No cityLocations to render buttons for.");
      return <div>No cities available for selection.</div>;
    }
    
    console.log("[MapSection] Rendering styled city buttons. Selected city:", selectedCity);
    console.log("[MapSection] onCityChange prop type:", typeof onCityChange);

    return (
      <div className="simple-city-buttons-container">
        <div className="city-selector-label">Select a City:</div>
        <div className="simple-city-buttons">
          {Object.keys(cityLocations).map(cityKey => (
            <button
              key={`styled-city-${cityKey}`}
              type="button"
              data-city={cityKey}
              className={`simple-city-btn ${selectedCity && selectedCity.toLowerCase() === cityKey.toLowerCase() ? 'active' : ''}`}
              onClick={() => {
                console.log(`[MapSection] STYLED BUTTON CLICKED FOR: ${cityKey}`);
                if (typeof onCityChange === 'function') {
                  console.log('[MapSection] onCityChange IS a function. Calling it with:', cityKey);
                  onCityChange(cityKey);
                } else {
                  console.error('[MapSection] onCityChange IS NOT A FUNCTION or is undefined. Type:', typeof onCityChange);
                }
              }}
            >
              {cityKey.charAt(0).toUpperCase() + cityKey.slice(1)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Very simple function to render markers when the map is ready
  const renderMarkers = () => {
    if (!currentCityStations) return null;
    return ensureArray(currentCityStations).map(station => {
      const coords = getValidCoordinates(station);
      if (!coords || typeof coords.longitude !== 'number' || typeof coords.latitude !== 'number') {
        return null;
      }
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
              fontSize: selectedStation && selectedStation.id === station.id ? '24px' : '20px',
              color: selectedStation && selectedStation.id === station.id ? 'red' : 'blue'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onMarkerClick(station);
            }}
          >
            📍
          </div>
        </Marker>
      );
    });
  };

  // Very simple function to render popup when needed
  const renderPopup = () => {
    if (!selectedStation || !showPopup || !getValidCoordinates) return null;
    
    const coords = getValidCoordinates(selectedStation);
    if (!coords) return null;

    return (
      <Popup
        longitude={coords.longitude}
        latitude={coords.latitude}
        anchor="bottom"
        onClose={onClosePopup}
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
              onClick={() => onBookNowPopup(selectedStation.id)} 
              className="popup-btn-book"
            >
              Book Now
            </button>
            <button 
              onClick={() => onViewDetailsPopup(selectedStation)} 
              className="popup-btn-details"
            >
              More Details
            </button>
          </div>
        </div>
      </Popup>
    );
  };

  return (
    <section id="stations" className="map-section" ref={ref}>
      <div className="container">
        <h2>EV Charging Stations in {selectedCity ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1) : 'Selected City'}</h2>
        
        {renderStyledCityButtons()}
        
        <p className="section-intro">Below is a map of available charging stations. Click on any marker to see details.</p>
        
        <div className="map-container" id={MAPBOX_CONTAINER_ID} ref={mapContainerRef}>
          {(loading || !shouldRenderMap) && (
            <div className="map-loading-placeholder">
              <div className="spinner"></div>
              <p>{!shouldRenderMap ? 'Initializing map UI...' : (loading ? 'Loading Map & Stations...' : 'Preparing map...')}</p>
            </div>
          )}
          
          {!loading && shouldRenderMap && mapboxToken && (
            <Map
              ref={mapRef}
              mapboxAccessToken={mapboxToken}
              initialViewState={viewState}
              onMove={evt => onViewStateChange(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              container={MAPBOX_CONTAINER_ID} 
              style={{ width: '100%', height: '100%' }}
              scrollZoom={scrollZoomEnabled}
              onClick={() => {
                if (!scrollZoomEnabled) {
                  setScrollZoomEnabled(true);
                }
              }}
            >
              <NavigationControl position="top-right" />
              {renderMarkers()}
              {renderPopup()}
            </Map>
          )}
          
          {!loading && shouldRenderMap && !mapboxToken && (
            <div className="map-loading-placeholder">
              <p>Map token not available. Map cannot be displayed.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export default MapSection; 