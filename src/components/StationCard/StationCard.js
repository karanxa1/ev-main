import React from 'react';
import useIntersectionObserver from '../../hooks/useIntersectionObserver'; // Import the hook
import './StationCard.css'; // We'll create this for specific styles if needed

// Helper function to safely handle array or null values (can be moved to a utils file later)
const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
};

export const StationCardSkeleton = () => (
  <div className="station-card station-card-skeleton">
    <div className="skeleton skeleton-image"></div>
    <div className="station-content">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton skeleton-details"></div>
      <div className="skeleton skeleton-cta"></div>
    </div>
  </div>
);

const StationCard = ({
  station,
  onBookNow,
  onLocateOnMap,
  imageFallbackLevel,
  onImageError,
  onImageLoad,
  commonFallbackImage,
  animationIndex
}) => {
  const [cardRef, isVisible] = useIntersectionObserver({
    threshold: 0.1, // Trigger when 10% of the card is visible
    triggerOnce: true // Animate only once
  });

  const currentImageFallbackLevel = imageFallbackLevel[station.id] || 0;
  
  let imageUrl = station.image;
  if (currentImageFallbackLevel === 1) {
    imageUrl = station.fallbackImage;
  } else if (currentImageFallbackLevel >= 2) {
    imageUrl = commonFallbackImage;
  }
  
  // If primary image is missing and no specific fallback level set, consider using common fallback directly
  if (!station.image && currentImageFallbackLevel === 0) {
    imageUrl = commonFallbackImage; 
  }

  const cardStyle = isVisible ? {
    transitionDelay: `${animationIndex * 100}ms`
  } : {};

  return (
    <div 
      ref={cardRef} 
      id={`station-${station.id}`} 
      className={`station-card ${isVisible ? 'is-visible' : ''}`}
      style={cardStyle}
    >
      <div className="station-image">
        <img
          src={imageUrl}
          alt={station.name || 'Charging Station'}
          onError={() => onImageError(station.id)}
          onLoad={() => onImageLoad(station.id)}
          loading="lazy"
        />
        {station.rating && (
          <div className="station-rating">
            <span className="star-icon">★</span>
            {station.rating}
          </div>
        )}
      </div>
      <div className="station-content">
        <h3>{station.name || 'EV Station'}</h3>
        <p className="address">{station.address || 'Address not available'}</p>
        {station.distance !== undefined && (
          <p className="distance-info">
            <strong>Distance:</strong> {station.distance.toFixed(1)} km away
          </p>
        )}
        <div className="station-details">
          <div className="detail">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{station.type || 'Standard'}</span>
          </div>
          <div className="detail">
            <span className="detail-label">Power:</span>
            <span className="detail-value">{station.power ? `${station.power} kW` : 'N/A'}</span>
          </div>
          <div className="detail">
            <span className="detail-label">Price:</span>
            <span className="detail-value">
              {station.pricePerKwh ? `₹${station.pricePerKwh}/kWh` : 'Contact station'}
            </span>
          </div>
          <div className="detail">
            <span className="detail-label">Hours:</span>
            <span className="detail-value">{station.hours || '24 hours'}</span>
          </div>
        </div>
        <div className="station-amenities">
          <span className="detail-label">Amenities:</span>
          <div className="amenity-tags">
            {safeArray(station.amenities).length > 0 ? (
              safeArray(station.amenities).map((amenity, idx) => (
                <span key={idx} className="amenity-tag">{amenity}</span>
              ))
            ) : (
              <span>Not available</span>
            )}
          </div>
        </div>
        <div className="station-cta">
          <button
            onClick={() => onBookNow(station.id)}
            className="btn-book"
          >
            Book Now
          </button>
          <button
            onClick={() => onLocateOnMap(station)}
            className="btn-locate"
          >
            {station.distance !== undefined ? 'Details & Map' : 'Locate on Map'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationCard; 