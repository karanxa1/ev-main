import React from 'react';
import StationCard, { StationCardSkeleton } from '../StationCard/StationCard'; // Adjusted path
import './StationsListSection.css'; // To be created

const StationsListSection = ({
  loading,
  isSearching,
  searchQuery,
  selectedCity,
  currentCityStations,
  onBookNow,
  onLocateOnMap,
  imageFallbackLevel,
  onImageError,
  onImageLoad,
  commonFallbackImage
}) => {
  return (
    <section className="stations-list-section">
      <div className="container">
        <h2>
          {isSearching
            ? `Search Results for "${searchQuery}"`
            : `Charging Stations in ${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}`}
        </h2>

        {loading && (
          <div className="stations-grid stations-loading-skeletons">
            {[...Array(6)].map((_, index) => <StationCardSkeleton key={index} />)}
          </div>
        )}

        {!loading && currentCityStations?.length === 0 && (
          <p className="no-stations-message">
            {isSearching
              ? "No stations found matching your search."
              : `No stations currently listed for ${selectedCity}.`}
          </p>
        )}

        {!loading && currentCityStations?.length > 0 && (
          <div className="stations-grid">
            {currentCityStations.map((station, index) => (
              <StationCard
                key={station.id || `station-${Math.random()}`}
                station={station}
                onBookNow={onBookNow}
                onLocateOnMap={onLocateOnMap}
                imageFallbackLevel={imageFallbackLevel}
                onImageError={onImageError}
                onImageLoad={onImageLoad}
                commonFallbackImage={commonFallbackImage}
                animationIndex={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default StationsListSection; 