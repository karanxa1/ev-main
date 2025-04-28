import React, { useEffect, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace with your actual Mapbox token

const MapboxDrivers = ({ drivers }) => {
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 10
  });

  useEffect(() => {
    // Center map on the first driver if available
    if (drivers && drivers.length > 0 && drivers[0].location) {
      setViewState({
        longitude: drivers[0].location.longitude || -122.4,
        latitude: drivers[0].location.latitude || 37.8,
        zoom: 10
      });
    }
  }, [drivers]);

  return (
    <div className="mapbox-container" style={{ height: '500px', width: '100%' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />
        
        {drivers && drivers.map((driver) => (
          driver.location && (
            <Marker 
              key={driver.id}
              longitude={driver.location.longitude}
              latitude={driver.location.latitude}
              color="#1976d2"
            >
              <div className="driver-marker">
                <div className="driver-marker-icon"></div>
                <div className="driver-marker-label">{driver.name}</div>
              </div>
            </Marker>
          )
        ))}
      </Map>
    </div>
  );
};

export default MapboxDrivers;
