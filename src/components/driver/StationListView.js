import React, { useCallback } from 'react';
import { FaMapMarkedAlt, FaExclamationTriangle, FaCrosshairs, FaSync, FaBatteryHalf, FaSort } from 'react-icons/fa';
import StationCard from './StationCard';
import SkeletonLoader from '../ui/SkeletonLoader';

const StationListView = ({
  filteredStations,
  loading,
  error,
  locationPermissionDenied,
  recentStations,
  isPullToRefreshActive,
  refreshing,
  showCompatibleOnly,
  showAvailableOnly,
  batteryRangeFilter,
  userVehicle,
  userLocation,
  onToggleViewMode,
  onRequestLocation,
  onMarkerClick,
  onToggleCompatibleFilter,
  onToggleAvailableFilter,
  onToggleBatteryRangeFilter,
  onToggleFilterDropdown,
  onToggleSortDropdown,
  onResetFilters,
  triggerHapticFeedback,
  listRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}) => {
  
  // Group stations by distance ranges
  const groupedStations = useCallback(() => {
    const groups = {
      'Nearby (< 5km)': [],
      'Within 15km': [],
      'Further Away (15km+)': []
    };
    
    filteredStations.forEach(station => {
      const distance = station.distance || 0;
      if (distance < 5) {
        groups['Nearby (< 5km)'].push(station);
      } else if (distance < 15) {
        groups['Within 15km'].push(station);
      } else {
        groups['Further Away (15km+)'].push(station);
      }
    });
    
    return Object.entries(groups).filter(([, stations]) => stations.length > 0);
  }, [filteredStations]);

  return (
    <div 
      className="stations-list-view-container mobile-optimized-list"
      ref={listRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Return to Map Button */}
      <button 
        className="return-to-map-btn"
        onClick={() => {
          onToggleViewMode();
          triggerHapticFeedback();
        }}
      >
        <FaMapMarkedAlt /> Return to Map
      </button>
      
      {/* Location Permission Warning for List View */}
      {locationPermissionDenied && (
        <div className="location-permission-warning list-view-warning">
          <div className="warning-icon"><FaExclamationTriangle /></div>
          <div className="warning-content">
            <h3>Location Access Required</h3>
            <p>Enable location access to see stations near you</p>
            <button className="enable-location-btn" onClick={onRequestLocation}>
              <FaCrosshairs /> Enable Location
            </button>
          </div>
        </div>
      )}
      
      {/* Pull-to-refresh indicator */}
      {isPullToRefreshActive && (
        <div className="pull-to-refresh-indicator">
          {refreshing ? (
            <div className="refresh-spinner"><FaSync className="rotating" /></div>
          ) : (
            <div className="pull-arrow">↓</div>
          )}
          <span>{refreshing ? 'Refreshing...' : 'Pull down to refresh'}</span>
        </div>
      )}
      
      {/* Mobile optimized filters */}
      <div className="enhanced-filter-bar mobile-optimized">
        <button 
          className={`enhanced-filter-button ${showCompatibleOnly ? 'active' : ''}`}
          onClick={() => {
            onToggleCompatibleFilter();
            triggerHapticFeedback();
          }}
        >
          {showCompatibleOnly ? 'Compatible' : 'All Chargers'}
        </button>
        
        <button 
          className={`enhanced-filter-button ${showAvailableOnly ? 'active' : ''}`}
          onClick={() => {
            onToggleAvailableFilter();
            triggerHapticFeedback();
          }}
        >
          {showAvailableOnly ? 'Available' : 'All Status'}
        </button>
        
        <button 
          className={`enhanced-filter-button ${batteryRangeFilter ? 'active' : ''}`}
          onClick={() => {
            onToggleBatteryRangeFilter();
            triggerHapticFeedback();
          }}
          disabled={!userVehicle || !userLocation}
        >
          <FaBatteryHalf /> Range Filter
        </button>
        
        <button 
          className="enhanced-filter-button"
          onClick={() => {
            onToggleFilterDropdown();
            triggerHapticFeedback();
          }}
        >
          Charger Type
        </button>
        
        <button 
          className="enhanced-filter-button"
          onClick={() => {
            onToggleSortDropdown();
            triggerHapticFeedback();
          }}
        >
          <FaSort /> Sort
        </button>
      </div>
      
      {/* Loading and Error States */}
      {loading && (
        <div className="enhanced-loading-state mobile-optimized">
          {[1,2,3,4].map(i => (
            <SkeletonLoader key={i} type="StationCard" />
          ))}
        </div>
      )}
      
      {error && (
        <div className="enhanced-error-state">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Stations</h3>
          <p>{error}</p>
          <button onClick={() => {
            triggerHapticFeedback();
            // Trigger retry through parent
          }}>Try Again</button>
        </div>
      )}
      
      {!loading && !error && (
        <>
          {/* Recently Viewed Stations - Horizontal Scrollable */}
          {recentStations.length > 0 && (
            <div className="recent-stations-section-mobile">
              <h3>Recently Viewed</h3>
              <div className="recent-stations-list-mobile">
                {recentStations.map(station => (
                  <StationCard 
                    key={`recent-${station.id}`} 
                    station={station} 
                    onClick={(station) => {
                      onMarkerClick(station);
                      triggerHapticFeedback();
                    }}
                    isMobile={true}
                  />
                ))}
              </div>
            </div>
          )}
        
          {/* Group Stations by Distance */}
          {filteredStations.length > 0 ? (
            <div className="grouped-stations">
              {groupedStations().map(([group, stations]) => (
                <div key={group} className="station-group-mobile">
                  <h3 className="station-group-heading-mobile">{group}</h3>
                  <div className="station-group-list">
                    {stations.map(station => (
                      <StationCard
                        key={station.id}
                        station={station}
                        onClick={(station) => {
                          onMarkerClick(station);
                          triggerHapticFeedback();
                        }}
                        isMobile={true}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-stations-message mobile-optimized">
              <p>No charging stations match your criteria.</p>
              <button 
                className="reset-filters-button mobile-optimized" 
                onClick={() => {
                  triggerHapticFeedback();
                  onResetFilters();
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StationListView; 