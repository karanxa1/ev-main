import React, { memo, useCallback } from 'react';
import { FaDirections, FaBolt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const StationCard = memo(({ station, onClick, isMobile = false, showDistance = true }) => {
  const handleDirections = useCallback((e) => {
    e.stopPropagation();
    if (station.latitude && station.longitude && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const url = `https://www.google.com/maps/dir/?api=1&origin=${position.coords.latitude},${position.coords.longitude}&destination=${station.latitude},${station.longitude}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        },
        (err) => console.warn("Error getting user location:", err.message)
      );
    }
  }, [station.latitude, station.longitude]);

  const handleBooking = useCallback((e) => {
    e.stopPropagation();
    // TODO: Implement booking functionality
    console.log('Booking station:', station.id);
  }, [station.id]);

  const getEstimatedChargingTime = useCallback(() => {
    // Simple estimation based on charger type
    if (station.chargerTypes?.includes('DC Fast')) {
      return '30-45 min';
    } else if (station.chargerTypes?.includes('AC')) {
      return '2-4 hours';
    }
    return 'Unknown';
  }, [station.chargerTypes]);

  return (
    <div 
      className={`station-list-card-item enhanced-station-card ${isMobile ? 'mobile-optimized' : ''}`}
      onClick={() => onClick(station)}
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
      <div className="card-header">
        <div className="station-name-section">
          <span className="station-name" title={station.name}>{station.name}</span>
          {station.rating && (
            <div className="station-rating">
              <span className="rating-stars">★</span>
              <span className="rating-value">{station.rating}</span>
            </div>
          )}
        </div>
        {station.isCompatible !== undefined && (
          <span className={`enhanced-station-compatibility ${station.isCompatible ? 'compatible' : 'incompatible'}`}>
            {station.isCompatible ? '✓ Compatible' : '✗ Not Compatible'}
          </span>
        )}
      </div>
      
      <div className="station-details">
        <div className="detail-item">
          <span className="detail-label">Status</span>
          <span className={`detail-value ${station.status === 'Available' ? 'available-status' : 'unavailable-status'}`}>
            {station.status || 'Unknown'}
          </span>
        </div>
        {showDistance && station.distance !== undefined && (
          <div className="detail-item">
            <span className="detail-label">
              <FaMapMarkerAlt aria-hidden="true" /> Distance
            </span>
            <span className="detail-value">{station.distance.toFixed(1)} km</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">
            <FaBolt aria-hidden="true" /> Chargers
          </span>
          <span className="detail-value">
            {station.chargerTypes && station.chargerTypes.length > 0 
              ? (isMobile ? station.chargerTypes[0] + (station.chargerTypes.length > 1 ? ' +' + (station.chargerTypes.length - 1) : '') : station.chargerTypes.join(', ')) 
              : 'Not specified'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Price</span>
          <span className="detail-value">₹{station.pricePerKwh || '--'}/kWh</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">
            <FaClock aria-hidden="true" /> Est. Time
          </span>
          <span className="detail-value">{getEstimatedChargingTime()}</span>
        </div>
      </div>
      
      <div className="card-footer">
        <button 
          className="btn-action btn-directions" 
          aria-label="Get directions"
          onClick={handleDirections}
        >
          <FaDirections /> {isMobile ? '' : 'Directions'}
        </button>
        <button 
          className="btn-action btn-book"
          disabled={station.status !== 'Available'}
          aria-label={station.status === 'Available' ? 'Book now' : 'Currently unavailable'}
          onClick={handleBooking}
        >
          {station.status === 'Available' ? (isMobile ? 'Book' : 'Book Now') : (isMobile ? 'Unavailable' : 'Currently Unavailable')}
        </button>
      </div>
    </div>
  );
};

});

StationCard.displayName = 'StationCard';

export default StationCard; 