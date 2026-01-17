import React, { memo } from 'react';
import { Marker } from 'react-map-gl';

const StationMarker = memo(({ station, onClick, userVehicle }) => {
  const handleClick = (e) => {
    e.originalEvent.stopPropagation();
    onClick(station);
  };

  // Determine marker status and compatibility
  const getMarkerClass = () => {
    let classes = ['station-marker'];
    
    // Status-based styling
    if (station.status === 'Available') {
      classes.push('available');
    } else if (station.status === 'Occupied') {
      classes.push('occupied');
    } else {
      classes.push('unknown');
    }
    
    // Compatibility styling
    if (station.isCompatible !== undefined) {
      classes.push(station.isCompatible ? 'compatible' : 'incompatible');
    }
    
    // Vehicle-based styling
    if (!userVehicle) {
      classes.push('no-vehicle');
    }
    
    return classes.join(' ');
  };

  // Get appropriate icon based on station type
  const getMarkerIcon = () => {
    if (station.chargerTypes?.includes('DC Fast')) {
      return '⚡'; // Fast charging
    } else if (station.chargerTypes?.includes('AC')) {
      return '🔌'; // Regular charging
    }
    return '⚡'; // Default
  };

  return (
    <Marker
      longitude={station.longitude}
      latitude={station.latitude}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div 
        className={getMarkerClass()}
        title={`${station.name} - ${station.status || 'Unknown status'}`}
        role="button"
        tabIndex={0}
        aria-label={`Charging station: ${station.name}. Status: ${station.status || 'Unknown'}. ${station.isCompatible ? 'Compatible with your vehicle' : 'Compatibility unknown'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(station);
          }
        }}
      >
        {getMarkerIcon()}
        
        {/* Status indicator dot */}
        <div className={`status-indicator ${station.status?.toLowerCase() || 'unknown'}`} />
        
        {/* Compatibility indicator */}
        {station.isCompatible !== undefined && (
          <div className={`compatibility-indicator ${station.isCompatible ? 'compatible' : 'incompatible'}`}>
            {station.isCompatible ? '✓' : '✗'}
          </div>
        )}
      </div>
    </Marker>
  );
});

StationMarker.displayName = 'StationMarker';

export default StationMarker; 