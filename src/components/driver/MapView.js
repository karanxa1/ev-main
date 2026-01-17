import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl';
import { MAPBOX_TOKEN } from '../../services/mapboxConfig';
import Supercluster from 'supercluster';
import StationMarker from './StationMarker';
import UserLocationMarker from './UserLocationMarker';
import TripRouteLayer from './TripRouteLayer';
import { FaExclamationTriangle, FaCrosshairs } from 'react-icons/fa';

const MapView = ({
  viewport,
  setViewport,
  filteredStations,
  userLocation,
  selectedStationPopup,
  setSelectedStationPopup,
  onMarkerClick,
  tripRoute,
  loading,
  error,
  locationPermissionDenied,
  onRetry,
  onRequestLocation,
  triggerHapticFeedback,
  userVehicle,
  theme = 'light'
}) => {
  const mapRef = useRef();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clusterUpdateTimeout, setClusterUpdateTimeout] = useState(null);
  
  // Memoized supercluster index
  const superclusterIndex = useMemo(() => {
    return new Supercluster({
      radius: 40,
      maxZoom: 16
    });
  }, []);

  // Memoized clusters calculation
  const clusters = useMemo(() => {
    if (filteredStations.length === 0 || !mapRef.current) return [];
    
    try {
      const points = filteredStations.map(station => ({
        type: 'Feature',
        properties: { 
          cluster: false,
          stationId: station.id,
          station: station
        },
        geometry: {
          type: 'Point',
          coordinates: [station.longitude, station.latitude]
        }
      }));
      
      superclusterIndex.load(points);
      
      const map = mapRef.current.getMap();
      if (!map) return [];
      
      const bounds = map.getBounds();
      if (!bounds) return [];
      
      const bbox = [
        bounds.getWest(), 
        bounds.getSouth(), 
        bounds.getEast(), 
        bounds.getNorth()
      ];
      
      const zoom = Math.floor(map.getZoom());
      return superclusterIndex.getClusters(bbox, zoom);
    } catch (err) {
      console.error("Error generating clusters:", err);
      return [];
    }
  }, [filteredStations, viewport, superclusterIndex]);

  // Memoized cluster click handler
  const handleClusterClick = useCallback((cluster) => {
    const expansionZoom = Math.min(
      superclusterIndex.getClusterExpansionZoom(cluster.properties.cluster_id),
      20
    );
    
    mapRef.current.getMap().flyTo({
      center: cluster.geometry.coordinates,
      zoom: expansionZoom,
      duration: 500
    });
    
    triggerHapticFeedback();
  }, [superclusterIndex, triggerHapticFeedback]);

  // Optimized move end handler with debouncing
  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current || filteredStations.length === 0 || !mapLoaded) return;
    
    // Clear existing timeout
    if (clusterUpdateTimeout) {
      clearTimeout(clusterUpdateTimeout);
    }
    
    // Debounce cluster updates for better performance
    const timeout = setTimeout(() => {
      try {
        const map = mapRef.current.getMap();
        const bounds = map.getBounds();
        if (!bounds) return;
        
        const bbox = [
          bounds.getWest(), 
          bounds.getSouth(), 
          bounds.getEast(), 
          bounds.getNorth()
        ];
        
        const zoom = Math.floor(map.getZoom());
        const clustersData = superclusterIndex.getClusters(bbox, zoom);
        // Update clusters through parent component if needed
      } catch (err) {
        console.error("Error updating clusters:", err);
      }
    }, 150); // 150ms debounce
    
    setClusterUpdateTimeout(timeout);
  }, [filteredStations, superclusterIndex, mapLoaded, clusterUpdateTimeout]);

  // Handle map load
  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clusterUpdateTimeout) {
        clearTimeout(clusterUpdateTimeout);
      }
    };
  }, [clusterUpdateTimeout]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="map-loading-placeholder">
        <div className="error-icon">⚠️</div>
        <p>Map cannot be displayed. Mapbox token is missing.</p>
      </div>
    );
  }

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading stations...</p>
        </div>
      )}
      
      {/* Location Permission Warning */}
      {locationPermissionDenied && (
        <div className="location-permission-warning" role="alert">
          <div className="warning-icon">
            <FaExclamationTriangle aria-hidden="true" />
          </div>
          <div className="warning-content">
            <h3>Location Access Required</h3>
            <p>Enable location access to find nearby charging stations and get accurate directions</p>
            <button 
              className="enable-location-btn" 
              onClick={onRequestLocation}
              aria-label="Enable location access"
            >
              <FaCrosshairs aria-hidden="true" /> Enable Location
            </button>
          </div>
        </div>
      )}
      
      {/* Error Overlay */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={onRetry}>Retry</button>
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={viewport}
        onMove={evt => setViewport(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onLoad={handleMapLoad}
        mapStyle={theme === 'dark' ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12"}
        style={{ width: '100%', height: '100%' }}
        renderWorldCopies={false}
        maxPitch={0} 
        attributionControl={false}
        interactiveLayerIds={['stations-layer']}
        cursor="default"
      >
        <NavigationControl position="bottom-right" style={{ marginBottom: '80px' }} />

        {/* Clustered Markers */}
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount, cluster_id } = cluster.properties;
          
          if (isCluster) {
            return (
              <Marker
                key={`cluster-${cluster_id}`}
                longitude={longitude}
                latitude={latitude}
              >
                <div
                  className="cluster-marker"
                  style={{
                    width: `${30 + (pointCount / filteredStations.length) * 20}px`,
                    height: `${30 + (pointCount / filteredStations.length) * 20}px`,
                  }}
                  onClick={() => handleClusterClick(cluster)}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }
          
          // Individual station marker
          const station = cluster.properties.station;
          return (
            <StationMarker
              key={`station-${station.id}`}
              station={station}
              onClick={onMarkerClick}
              userVehicle={userVehicle}
            />
          );
        })}
        
        {/* User Location Marker */}
        {userLocation && (
          <UserLocationMarker location={userLocation} />
        )}
        
        {/* Trip Route Visualization */}
        {tripRoute && (
          <TripRouteLayer tripRoute={tripRoute} />
        )}

        {/* Station Popup for smaller screens */}
        {selectedStationPopup && window.innerWidth <= 768 && (
          <Popup
            longitude={selectedStationPopup.originalLng || selectedStationPopup.longitude}
            latitude={selectedStationPopup.originalLat || selectedStationPopup.latitude}
            onClose={() => setSelectedStationPopup(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="bottom"
            className="station-popup"
          >
            <div className="popup-content">
              <div className="popup-header">
                <h3>{selectedStationPopup.name}</h3>
                <span className={`popup-access-tag ${selectedStationPopup.accessType?.toLowerCase() || 'public'}`}>
                  {selectedStationPopup.accessType || 'Public'}
                </span>
              </div>
              
              <p className="popup-address">{selectedStationPopup.address}</p>
              
              {selectedStationPopup.isCompatible !== undefined && (
                <p className={selectedStationPopup.isCompatible ? 'compatible-text' : 'not-compatible-text'}>
                  {selectedStationPopup.isCompatible ? 'Compatible with your vehicle' : 'May not be compatible'}
                </p>
              )}
              
              <div className="popup-details">
                <div className="popup-detail-row">
                  <span className="popup-detail-label">Status:</span>
                  <span className={`popup-detail-value ${selectedStationPopup.status === 'Available' ? 'available' : 'unavailable'}`}>
                    {selectedStationPopup.status || 'Unknown'}
                  </span>
                </div>
                
                {selectedStationPopup.chargerTypes && selectedStationPopup.chargerTypes.length > 0 && (
                  <div className="popup-detail-row">
                    <span className="popup-detail-label">Charger Types:</span>
                    <div className="popup-charger-types">
                      {selectedStationPopup.chargerTypes.map(type => (
                        <span key={type} className="popup-charger-badge">{type}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedStationPopup.distance !== undefined && (
                  <div className="popup-detail-row">
                    <span className="popup-detail-label">Distance:</span>
                    <span className="popup-detail-value">{selectedStationPopup.distance.toFixed(1)} km</span>
                  </div>
                )}
              </div>
              
              <button 
                className="popup-directions-button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHapticFeedback();
                  if (userLocation) {
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedStationPopup.latitude},${selectedStationPopup.longitude}`;
                    window.open(url, '_blank');
                  }
                }}
                disabled={!userLocation}
              >
                🧭 Get Directions
              </button>
            </div>
          </Popup>
        )}
      </Map>
    </>
  );
};

export default MapView; 