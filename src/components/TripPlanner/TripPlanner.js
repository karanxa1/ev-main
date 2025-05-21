import React, { useState, useEffect } from 'react';
import { FaRoute, FaMapMarkerAlt, FaChargingStation, FaCar, FaSearch, FaTimes } from 'react-icons/fa';
import './TripPlanner.css';

const TripPlanner = ({ 
  userLocation, 
  stations, 
  userVehicle, 
  onRouteCalculated, 
  mapRef, 
  onClose 
}) => {
  const [origin, setOrigin] = useState({
    name: userLocation ? 'Your Location' : '',
    coordinates: userLocation || null,
  });
  
  const [destination, setDestination] = useState({
    name: '',
    coordinates: null,
  });
  
  const [travelDistance, setTravelDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [suggestedStops, setSuggestedStops] = useState([]);
  const [totalChargeTime, setTotalChargeTime] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Set user's current location as origin when available
  useEffect(() => {
    if (userLocation) {
      setOrigin({
        name: 'Your Location',
        coordinates: userLocation
      });
    }
  }, [userLocation]);
  
  // Get vehicle range from user's vehicle data
  const vehicleRange = userVehicle?.range || 200; // Default 200 km if not specified
  
  // Reset error when inputs change
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [origin, destination]);
  
  // Search for locations using Mapbox geocoding API
  const searchLocation = async (query, isOrigin = false) => {
    if (!query.trim()) return;
    
    try {
      setIsSearching(true);
      
      // Using mapbox geocoding API
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXYtY2hhcmdlciIsImEiOiJjazVvYm9zd2owNjVxM2xtanJvdHBobHB1In0.L9q3zsKhECnAYYKj3guTTg',
        country: 'in',
        types: 'place,locality,neighborhood,address,poi',
        limit: 5
      });
      
      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) throw new Error('Search request failed');
      
      const data = await response.json();
      
      const results = data.features.map(feature => ({
        name: feature.place_name,
        coordinates: {
          latitude: feature.center[1],
          longitude: feature.center[0]
        }
      }));
      
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Location search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Calculate optimal route with charging stops
  const calculateRoute = async () => {
    if (!origin.coordinates || !destination.coordinates) {
      setError('Please provide both origin and destination');
      return;
    }
    
    setIsCalculating(true);
    setError(null);
    
    try {
      // First, calculate the direct distance using Haversine formula
      const directDistance = getDistanceBetweenPoints(
        origin.coordinates.latitude,
        origin.coordinates.longitude,
        destination.coordinates.latitude,
        destination.coordinates.longitude
      );
      
      setTravelDistance(Math.round(directDistance * 10) / 10); // Round to 1 decimal place
      
      // Estimate driving time (assumes average 60 km/h speed)
      const estimatedHours = (directDistance / 60);
      setEstimatedDuration(estimatedHours);
      
      // Determine if charging stops are needed
      if (directDistance <= vehicleRange * 0.8) {
        // No stops needed - 80% of vehicle range as a safety margin
        setSuggestedStops([]);
        setTotalChargeTime(0);
      } else {
        // Need charging stops
        const stops = calculateOptimalChargingStops(
          origin.coordinates,
          destination.coordinates,
          stations,
          vehicleRange
        );
        
        setSuggestedStops(stops);
        
        // Estimate total charging time (20 minutes per stop as a simple estimate)
        setTotalChargeTime(stops.length * 20);
      }
      
      // Notify parent component about the route
      if (onRouteCalculated) {
        onRouteCalculated({
          origin: origin.coordinates,
          destination: destination.coordinates,
          stops: suggestedStops.map(stop => ({
            longitude: stop.longitude,
            latitude: stop.latitude
          })),
          distance: directDistance,
          duration: estimatedHours
        });
      }
      
      // Fly to show the entire route
      if (mapRef && mapRef.current) {
        showRouteOnMap();
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      setError('Failed to calculate route. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Show the route on the map
  const showRouteOnMap = () => {
    if (!mapRef || !mapRef.current) return;
    
    // Calculate bounds to fit all points (origin, destination, and stops)
    const points = [
      [origin.coordinates.longitude, origin.coordinates.latitude],
      [destination.coordinates.longitude, destination.coordinates.latitude],
      ...suggestedStops.map(stop => [stop.longitude, stop.latitude])
    ];
    
    // Find the min/max coordinates to create a bounding box
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    
    points.forEach(point => {
      minLng = Math.min(minLng, point[0]);
      maxLng = Math.max(maxLng, point[0]);
      minLat = Math.min(minLat, point[1]);
      maxLat = Math.max(maxLat, point[1]);
    });
    
    // Add padding to the bounds
    const padding = 50; // px padding
    
    // Use Mapbox's fitBounds method to adjust the viewport
    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding, duration: 1000 }
    );
  };
  
  // Calculate optimal charging stops for the route
  const calculateOptimalChargingStops = (start, end, availableStations, maxRange) => {
    // Filter stations to only available ones
    const availableOnly = availableStations.filter(station => station.status === 'Available');
    
    if (availableOnly.length === 0) {
      setError('No available charging stations found for route planning');
      return [];
    }
    
    // Calculate direct distance
    const totalDistance = getDistanceBetweenPoints(
      start.latitude, start.longitude,
      end.latitude, end.longitude
    );
    
    // Simple case: no stops needed
    if (totalDistance <= maxRange * 0.8) { // Using 80% of max range as safety buffer
      return [];
    }
    
    // Calculate how many stops are needed (roughly)
    const numStopsNeeded = Math.ceil(totalDistance / (maxRange * 0.7)) - 1; // 70% for more safety
    
    if (numStopsNeeded <= 0) {
      return [];
    }
    
    // Ideal stop locations would be evenly spaced along the route
    const idealStopDistance = totalDistance / (numStopsNeeded + 1);
    
    const selectedStops = [];
    let currentPoint = { ...start };
    
    // For each needed stop, find the best station near the ideal point
    for (let i = 0; i < numStopsNeeded; i++) {
      // Calculate the ideal next stop coordinates (simplified linear interpolation)
      const segmentProgress = (i + 1) / (numStopsNeeded + 1);
      const idealLat = start.latitude + segmentProgress * (end.latitude - start.latitude);
      const idealLng = start.longitude + segmentProgress * (end.longitude - start.longitude);
      
      // Find closest available station to this ideal point
      const closestStation = findClosestStation(
        { latitude: idealLat, longitude: idealLng },
        availableOnly,
        currentPoint,
        maxRange * 0.8 // Maximum allowed distance from current point
      );
      
      if (closestStation) {
        selectedStops.push(closestStation);
        currentPoint = {
          latitude: closestStation.latitude,
          longitude: closestStation.longitude
        };
      } else {
        // Couldn't find suitable station - this is a gap in coverage
        setError('Warning: Route may have gaps in charging coverage');
      }
    }
    
    return selectedStops;
  };
  
  // Find the closest station to an ideal point that is reachable from current position
  const findClosestStation = (idealPoint, stations, currentPosition, maxRangeFromCurrent) => {
    // Filter stations that are within reach from current position
    const reachableStations = stations.filter(station => {
      const distanceFromCurrent = getDistanceBetweenPoints(
        currentPosition.latitude, currentPosition.longitude,
        station.latitude, station.longitude
      );
      return distanceFromCurrent <= maxRangeFromCurrent;
    });
    
    if (reachableStations.length === 0) {
      return null;
    }
    
    // Find the station closest to ideal point
    return reachableStations.reduce((closest, station) => {
      const distanceToIdeal = getDistanceBetweenPoints(
        idealPoint.latitude, idealPoint.longitude,
        station.latitude, station.longitude
      );
      
      if (!closest || distanceToIdeal < closest.distanceToIdeal) {
        return { ...station, distanceToIdeal };
      }
      return closest;
    }, null);
  };
  
  // Haversine formula to calculate distance between two points
  const getDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };
  
  // Handle location selection from search results
  const handleSelectLocation = (location, isOrigin) => {
    if (isOrigin) {
      setOrigin(location);
    } else {
      setDestination(location);
    }
    setSearchResults([]);
  };
  
  // Open Google Maps with the route
  const openInGoogleMaps = () => {
    if (!origin.coordinates || !destination.coordinates) {
      setError('Please provide both origin and destination');
      return;
    }
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.coordinates.latitude},${origin.coordinates.longitude}&destination=${destination.coordinates.latitude},${destination.coordinates.longitude}`;
    
    // Add waypoints if there are suggested stops
    if (suggestedStops.length > 0) {
      const waypoints = suggestedStops.map(stop => 
        `${stop.latitude},${stop.longitude}`
      ).join('|');
      
      url += `&waypoints=${waypoints}`;
    }
    
    // Open in new tab
    window.open(url, '_blank');
  };
  
  return (
    <div className="trip-planner">
      <div className="trip-planner-header">
        <h2><FaRoute /> EV Trip Planner</h2>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      
      {/* Vehicle information */}
      <div className="vehicle-info">
        <FaCar />
        <span>{userVehicle?.name || 'Vehicle'}</span>
        <span className="range-badge">{vehicleRange} km</span>
      </div>
      
      <div className="location-inputs">
        {/* Origin input */}
        <div className="location-input">
          <div className="input-with-icon">
            <FaMapMarkerAlt className="location-icon origin-icon" />
            <input
              type="text"
              placeholder="Starting point"
              value={origin.name}
              onChange={(e) => {
                const value = e.target.value;
                setOrigin({ name: value, coordinates: null });
                if (value.length > 2) {
                  searchLocation(value, true);
                } else {
                  setSearchResults([]);
                }
              }}
            />
            {origin.name && (
              <button 
                className="clear-input" 
                onClick={() => setOrigin({ name: '', coordinates: null })}
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          {/* Search results dropdown for origin */}
          {searchResults.length > 0 && !origin.coordinates && (
            <div className="search-results">
              {isSearching ? (
                <div className="searching">Searching locations...</div>
              ) : (
                searchResults.map((result, index) => (
                  <div 
                    key={index}
                    className="search-result-item"
                    onClick={() => handleSelectLocation(result, true)}
                  >
                    <FaMapMarkerAlt />
                    <span>{result.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Destination input */}
        <div className="location-input">
          <div className="input-with-icon">
            <FaMapMarkerAlt className="location-icon destination-icon" />
            <input
              type="text"
              placeholder="Destination"
              value={destination.name}
              onChange={(e) => {
                const value = e.target.value;
                setDestination({ name: value, coordinates: null });
                if (value.length > 2) {
                  searchLocation(value, false);
                } else {
                  setSearchResults([]);
                }
              }}
            />
            {destination.name && (
              <button 
                className="clear-input" 
                onClick={() => setDestination({ name: '', coordinates: null })}
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          {/* Search results dropdown for destination */}
          {searchResults.length > 0 && !destination.coordinates && (
            <div className="search-results">
              {isSearching ? (
                <div className="searching">Searching locations...</div>
              ) : (
                searchResults.map((result, index) => (
                  <div 
                    key={index}
                    className="search-result-item"
                    onClick={() => handleSelectLocation(result, false)}
                  >
                    <FaMapMarkerAlt />
                    <span>{result.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Calculate route button */}
      <button 
        className="calculate-route-button"
        disabled={!origin.coordinates || !destination.coordinates || isCalculating}
        onClick={calculateRoute}
      >
        {isCalculating ? 'Calculating...' : 'Calculate Route'}
      </button>
      
      {/* Error message */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Route summary */}
      {travelDistance > 0 && (
        <div className="route-summary">
          <h3>Route Summary</h3>
          <div className="summary-details">
            <div className="summary-item">
              <span className="label">Distance:</span>
              <span className="value">{travelDistance} km</span>
            </div>
            <div className="summary-item">
              <span className="label">Est. Drive Time:</span>
              <span className="value">
                {estimatedDuration < 1 
                  ? `${Math.round(estimatedDuration * 60)} min` 
                  : `${Math.floor(estimatedDuration)}h ${Math.round((estimatedDuration % 1) * 60)} min`}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Charging Stops:</span>
              <span className="value">{suggestedStops.length}</span>
            </div>
            {totalChargeTime > 0 && (
              <div className="summary-item">
                <span className="label">Est. Charging Time:</span>
                <span className="value">{totalChargeTime} min</span>
              </div>
            )}
          </div>
          
          {/* Suggested charging stops */}
          {suggestedStops.length > 0 && (
            <div className="charging-stops">
              <h3>Charging Stops</h3>
              <div className="stops-list">
                {suggestedStops.map((stop, index) => (
                  <div key={index} className="stop-item">
                    <FaChargingStation className="stop-icon" />
                    <div className="stop-details">
                      <div className="stop-name">{stop.name}</div>
                      <div className="stop-distance">
                        {index === 0 
                          ? `${Math.round(getDistanceBetweenPoints(
                              origin.coordinates.latitude, 
                              origin.coordinates.longitude,
                              stop.latitude, 
                              stop.longitude
                            ))} km from start`
                          : `${Math.round(getDistanceBetweenPoints(
                              suggestedStops[index-1].latitude, 
                              suggestedStops[index-1].longitude,
                              stop.latitude, 
                              stop.longitude
                            ))} km from previous stop`
                        }
                      </div>
                      <div className="stop-charger-types">
                        {stop.chargerTypes?.join(', ') || 'Standard Charger'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Open in Google Maps button */}
          <button className="google-maps-button" onClick={openInGoogleMaps}>
            Open in Google Maps
          </button>
        </div>
      )}
    </div>
  );
};

export default TripPlanner; 