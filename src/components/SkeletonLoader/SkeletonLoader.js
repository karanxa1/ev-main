import React from 'react';
import './SkeletonLoader.css';

// Base skeleton component
export const Skeleton = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '',
  ...props 
}) => (
  <div 
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
    aria-hidden="true"
    {...props}
  />
);

// Station card skeleton
export const StationCardSkeleton = () => (
  <div className="station-card-skeleton" aria-label="Loading station information">
    <div className="skeleton-image" />
    <div className="skeleton-content">
      <Skeleton height="24px" className="skeleton-title" />
      <Skeleton height="16px" width="80%" className="skeleton-text" />
      <Skeleton height="16px" width="60%" className="skeleton-text short" />
      
      <div className="skeleton-details">
        <Skeleton height="14px" width="40%" />
        <Skeleton height="14px" width="50%" />
        <Skeleton height="14px" width="35%" />
      </div>
      
      <div className="skeleton-cta">
        <Skeleton height="36px" width="80px" borderRadius="6px" />
        <Skeleton height="36px" width="100px" borderRadius="6px" />
      </div>
    </div>
  </div>
);

// Map skeleton
export const MapSkeleton = () => (
  <div className="map-skeleton" aria-label="Loading map">
    <div className="map-skeleton-content">
      <Skeleton height="100%" borderRadius="8px" />
      <div className="map-skeleton-overlay">
        <div className="map-skeleton-controls">
          <Skeleton width="40px" height="40px" borderRadius="4px" />
          <Skeleton width="40px" height="40px" borderRadius="4px" />
        </div>
        <div className="map-skeleton-markers">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="map-skeleton-marker"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`
              }}
            >
              <Skeleton width="20px" height="20px" borderRadius="50%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Stats skeleton
export const StatsSkeleton = () => (
  <div className="stats-skeleton">
    <Skeleton height="32px" width="300px" className="stats-title" />
    <div className="stats-grid-skeleton">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="stat-item-skeleton">
          <Skeleton width="60px" height="60px" borderRadius="50%" />
          <Skeleton height="48px" width="80px" className="stat-number" />
          <Skeleton height="20px" width="120px" />
          <Skeleton height="16px" width="100px" />
        </div>
      ))}
    </div>
  </div>
);

// Search suggestions skeleton
export const SearchSuggestionsSkeleton = () => (
  <div className="search-suggestions-skeleton">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="suggestion-skeleton">
        <Skeleton height="16px" width={`${60 + Math.random() * 30}%`} />
      </div>
    ))}
  </div>
);

// Hero section skeleton
export const HeroSkeleton = () => (
  <div className="hero-skeleton">
    <div className="hero-content-skeleton">
      <Skeleton height="48px" width="80%" className="hero-title" />
      <Skeleton height="20px" width="90%" />
      <Skeleton height="20px" width="70%" />
      
      <div className="hero-search-skeleton">
        <Skeleton height="48px" borderRadius="24px" />
      </div>
      
      <div className="hero-buttons-skeleton">
        <Skeleton height="44px" width="120px" borderRadius="6px" />
        <Skeleton height="44px" width="140px" borderRadius="6px" />
      </div>
    </div>
  </div>
);

// Generic list skeleton
export const ListSkeleton = ({ items = 5, itemHeight = '60px' }) => (
  <div className="list-skeleton">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="list-item-skeleton">
        <Skeleton height={itemHeight} borderRadius="8px" />
      </div>
    ))}
  </div>
);

// Text block skeleton
export const TextSkeleton = ({ lines = 3 }) => (
  <div className="text-skeleton">
    {[...Array(lines)].map((_, i) => (
      <Skeleton 
        key={i}
        height="16px" 
        width={i === lines - 1 ? '60%' : '100%'}
        className="text-line"
      />
    ))}
  </div>
);

// Image skeleton
export const ImageSkeleton = ({ width = '100%', height = '200px', borderRadius = '8px' }) => (
  <div className="image-skeleton">
    <Skeleton width={width} height={height} borderRadius={borderRadius} />
  </div>
);

export default Skeleton; 