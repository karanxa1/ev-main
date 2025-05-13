import React from 'react';
import { LoadScript, GoogleMap as GoogleMapComponent, Marker } from '@react-google-maps/api';

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

if (!MAPS_API_KEY) {
  console.warn('Google Maps API key is missing. Check your .env file.');
}

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

const defaultCenter = { lat: 28.6139, lng: 77.209 };
const defaultZoom = 12;

const GoogleMap: React.FC<GoogleMapProps> = ({ center = defaultCenter, zoom = defaultZoom }) => {
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