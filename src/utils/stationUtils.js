/**
 * Utility functions for handling charging station data
 */

// Ensure a value is always an array for mapping
export const ensureArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [data];
};

// Safe map function that works even if the input is not an array
export const safeMap = (data, mapFunction) => {
  const array = ensureArray(data);
  return array.map(mapFunction);
};

// Calculate distance between two points for nearby stations
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
      typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return Number.MAX_VALUE; // Return a large value for invalid inputs
  }
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
};

// Convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

// Find nearest stations helper (safe version)
export const findNearestStationsSafe = (stations, userLocation, limit = 5) => {
  // Ensure we have valid data
  if (!stations || !Array.isArray(stations) || stations.length === 0) {
    return [];
  }
  
  if (!userLocation || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
    return stations.slice(0, limit); // Return some stations if no valid location
  }
  
  // Calculate distance for each station and sort
  return stations
    .filter(station => 
      typeof station.latitude === 'number' && 
      typeof station.longitude === 'number'
    )
    .map(station => ({
      ...station,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        station.latitude,
        station.longitude
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};
