/**
 * Data Service for EV Charging Stations
 * 
 * This service provides methods to fetch and filter charging station data.
 */

// Import station data
import stationsData from '../data/chargingStations.json';

// Cache the loaded data
let loadedStations = null;
let cityStations = {};

/**
 * Get all charging stations
 * @returns {Promise<Array>} Promise resolving to array of stations
 */
export const getAllStations = async () => {
  if (loadedStations) {
    return loadedStations;
  }
  
  try {
    // In a real app with a backend, this would be a fetch call
    // return await fetch('/api/stations').then(res => res.json());
    
    // Since we're using local JSON, simulate async behavior
    return new Promise((resolve) => {
      setTimeout(() => {
        loadedStations = stationsData.stations;
        resolve(loadedStations);
      }, 100);
    });
  } catch (error) {
    console.error('Error loading charging stations:', error);
    throw error;
  }
};

/**
 * Get stations by city
 * @param {string} city The city name
 * @returns {Promise<Array>} Promise resolving to filtered array of stations
 */
export const getStationsByCity = async (city) => {
  console.log(`Getting stations for city: "${city}"`);
  
  if (city === 'all') {
    return getAllStations();
  }
  
  // Check if we have cached this city's data
  if (cityStations[city]) {
    console.log(`Using cached data for ${city}, ${cityStations[city].length} stations`);
    return cityStations[city];
  }
  
  try {
    const allStations = await getAllStations();
    
    // Debug the city names in the data
    const uniqueCities = [...new Set(allStations.map(s => s.city))];
    console.log('Available cities in data:', uniqueCities);
    
    const filteredStations = allStations.filter(
      station => {
        // Case insensitive matching
        return station.city && station.city.toLowerCase() === city.toLowerCase();
      }
    );
    
    console.log(`Found ${filteredStations.length} stations for ${city}`);
    
    // Cache the result
    cityStations[city] = filteredStations;
    
    return filteredStations;
  } catch (error) {
    console.error(`Error getting stations for city ${city}:`, error);
    throw error;
  }
};

/**
 * Search stations by query text
 * @param {string} query The search query
 * @returns {Promise<Array>} Promise resolving to filtered array of stations
 */
export const searchStations = async (query) => {
  if (!query || query.trim() === '') {
    return getAllStations();
  }
  
  try {
    const allStations = await getAllStations();
    const searchTerm = query.toLowerCase();
    
    return allStations.filter(station => 
      station.name.toLowerCase().includes(searchTerm) ||
      station.address.toLowerCase().includes(searchTerm) ||
      station.city.toLowerCase().includes(searchTerm)
    );
  } catch (error) {
    console.error(`Error searching stations:`, error);
    throw error;
  }
};

/**
 * Apply filters to stations
 * @param {Array} stations Array of stations to filter 
 * @param {Object} filters Filter criteria
 * @returns {Array} Filtered array of stations
 */
export const applyFilters = (stations, filters) => {
  if (!filters) return stations;
  
  let filteredStations = [...stations];
  
  if (filters.type && filters.type !== 'all') {
    filteredStations = filteredStations.filter(station => 
      station.plugType === filters.type
    );
  }
  
  if (filters.minPower) {
    filteredStations = filteredStations.filter(station => 
      station.power >= parseInt(filters.minPower)
    );
  }
  
  if (filters.maxPrice) {
    filteredStations = filteredStations.filter(station => 
      station.pricePerKwh <= parseFloat(filters.maxPrice)
    );
  }
  
  if (filters.amenities && filters.amenities.length > 0) {
    filteredStations = filteredStations.filter(station => 
      filters.amenities.every(amenity => station.amenities.includes(amenity))
    );
  }
  
  return filteredStations;
};

/**
 * Find nearest charging stations to a location
 * @param {Object} location The location (lat, lng)
 * @param {Array} stations Array of stations
 * @param {Number} limit Maximum number of stations to return
 * @returns {Array} Array of nearest stations with distance
 */
export const findNearestStations = (location, stations, limit = 3) => {
  if (!location || !location.lat || !location.lng || !stations?.length) {
    return [];
  }

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const stationsWithDistance = stations.map(station => ({
    ...station,
    distance: calculateDistance(
      location.lat,
      location.lng,
      station.latitude,
      station.longitude
    )
  }));

  // Sort by distance (nearest first) and return the specified limit
  return stationsWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};
