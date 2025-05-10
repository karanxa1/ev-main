import React, { forwardRef } from 'react';
import Map, { NavigationControl, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapSection.css'; // To be created

// Helper function to ensure we always have an array (can be moved to a utils file later)
const ensureArray = (possibleArray) => {
  if (!possibleArray) return [];
  return Array.isArray(possibleArray) ? possibleArray : [];
};

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
  return (
    <section id="stations" className="map-section" ref={ref}>
      <div className="container">
        {/* City Selector UI */}
        <div className="city-selector-container">
          <h3>Select a City:</h3>
          <div className="cities-buttons-grid">
            {Object.keys(cityLocations).map((cityName) => (
              <button
                key={cityName}
                className={`city-button ${selectedCity.toLowerCase() === cityName.toLowerCase() ? 'active' : ''}`}
                onClick={() => onCityChange(cityName)}
              >
                {cityName.charAt(0).toUpperCase() + cityName.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <h2>EV Charging Stations in {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h2>
        <p className="section-intro">Below is a map of available charging stations. Click on any marker to see details.</p>
        <div className="map-container" id="map-container">
          {loading && (
            <div className="map-loading-placeholder">
              <div className="spinner"></div>
              <p>Loading Map & Stations...</p>
            </div>
          )}
          {!loading && mapboxToken && (
            <Map
              mapboxAccessToken={mapboxToken}
              {...viewState}
              onMove={evt => onViewStateChange(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="top-right" />
              
              {ensureArray(currentCityStations).map(station => {
                const coords = getValidCoordinates(station);
                if (!coords || typeof coords.longitude !== 'number' || typeof coords.latitude !== 'number') {
                  // console.warn('Skipping marker for station with invalid coordinates:', station);
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
                        // color: selectedStation && selectedStation.id === station.id ? '#ff6b6b' : '#4a90e2' // selectedStation prop needs to be consistently an object or null
                        fontSize: selectedStation && selectedStation.id === station.id ? '24px' : '20px', // Example style change
                        color: selectedStation && selectedStation.id === station.id ? 'red' : 'blue'
                      }}
                      onClick={(e) => {
                        if (e && typeof e.stopPropagation === 'function') {
                          e.stopPropagation();
                        }
                        if (e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
                          e.originalEvent.stopPropagation();
                        }
                        onMarkerClick(station);
                      }}
                    >
                      📍
                    </div>
                  </Marker>
                );
              })}
              
              {selectedStation && showPopup && (
                <Popup
                  longitude={getValidCoordinates(selectedStation).longitude}
                  latitude={getValidCoordinates(selectedStation).latitude}
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
                        onClick={() => {
                          onViewDetailsPopup(selectedStation);
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
          {!loading && !mapboxToken && (
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