import React, { memo } from 'react';
import { Marker } from 'react-map-gl';

const UserLocationMarker = memo(({ location, accuracy, heading }) => {
  return (
    <Marker 
      longitude={location.longitude} 
      latitude={location.latitude}
      style={{ zIndex: 1000 }}
    >
      <div 
        className="user-location-marker"
        role="img"
        aria-label={`Your current location${accuracy ? ` (accuracy: ${Math.round(accuracy)}m)` : ''}`}
        title="Your current location"
      >
        {/* Accuracy circle */}
        {accuracy && (
          <div 
            className="accuracy-circle"
            style={{
              width: `${Math.min(accuracy / 10, 50)}px`,
              height: `${Math.min(accuracy / 10, 50)}px`,
            }}
          />
        )}
        
        {/* Pulsing ring animation */}
        <div className="user-location-pulse" />
        
        {/* Main location dot */}
        <div className="user-location-dot">
          {/* Car icon with optional heading */}
          <div 
            className="car-icon"
            style={{
              transform: heading !== undefined ? `rotate(${heading}deg)` : 'none'
            }}
          >
            🚗
          </div>
        </div>
        
        {/* Direction indicator */}
        {heading !== undefined && (
          <div 
            className="direction-indicator"
            style={{ transform: `rotate(${heading}deg)` }}
          >
            <div className="direction-arrow">↑</div>
          </div>
        )}
      </div>
    </Marker>
  );
});

UserLocationMarker.displayName = 'UserLocationMarker';

export default UserLocationMarker; 