import React, { useEffect, useState } from 'react';
import { LoadScript, GoogleMap as GoogleMapComponent, Marker } from '@react-google-maps/api';

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const defaultCenter = { lat: 28.6139, lng: 77.209 };
const defaultZoom = 12;

// GoogleMap component with error handling
const GoogleMap = ({ center = defaultCenter, zoom = defaultZoom }) => {
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Listen for Google Maps errors
    const handleMapError = () => {
      setMapError(true);
    };
    window.gm_authFailure = handleMapError;
    return () => {
      window.gm_authFailure = null;
    };
  }, []);

  // Render fallback UI if Maps API fails to load
  if (mapError) {
    return (
      <div className="map-error-container" style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#f8f8f8',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h3>Map cannot be displayed</h3>
        <p>Please check your Google Maps API configuration.</p>
        <p>For website administrators: Billing needs to be enabled on the Google Cloud Console.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '400px', width: '100%' }}>
      {MAPS_API_KEY ? (
        <LoadScript googleMapsApiKey={MAPS_API_KEY}>
          <GoogleMapComponent
            mapContainerStyle={{ height: '100%', width: '100%' }}
            center={center}
            zoom={zoom}
            options={{
              gestureHandling: 'cooperative'
            }}
          >
            <Marker position={center} />
          </GoogleMapComponent>
        </LoadScript>
      ) : (
        <div style={{ padding: 20, textAlign: 'center', color: 'red' }}>
          Google Maps API key is missing.
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
