/**
 * Data Service for EV Charging Stations
 * 
 * This service provides methods to fetch and filter charging station data.
 */

import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Helper functions first to avoid initialization errors
// Convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

// Helper function to calculate distance between two coordinates using the Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
};

// Get all stations with proper error handling
export const getAllStations = async () => {
  try {
    const stationsRef = collection(db, 'chargingStations');
    const snapshot = await getDocs(stationsRef);
    
    if (snapshot.empty) {
      console.log('No stations found in database');
      return [];
    }
    
    const stations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id, // Use Firebase document ID
      };
    });
    
    console.log(`Retrieved ${stations.length} stations from Firebase`);
    return stations;
  } catch (error) {
    console.error('Error getting stations:', error);
    return [];
  }
};

// Get station by ID
export const getStationById = async (stationId) => {
  try {
    const stationDoc = await getDoc(doc(db, 'chargingStations', stationId));
    
    if (stationDoc.exists()) {
      return { ...stationDoc.data(), id: stationDoc.id };
    } else {
      console.log(`No station found with ID: ${stationId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting station ${stationId}:`, error);
    return null;
  }
};

// Get stations by city with case-insensitive matching
export const getStationsByCity = async (city) => {
  try {
    console.log(`Getting stations for city: ${city}`);
    // Get all stations then filter by city (case-insensitive)
    const stations = await getAllStations();
    
    // Case insensitive city matching
    const cityStations = stations.filter(station => 
      station.city && station.city.toLowerCase() === city.toLowerCase()
    );
    
    console.log(`Found ${cityStations.length} stations for ${city}`);
    return cityStations;
  } catch (error) {
    console.error(`Error in getStationsByCity for ${city}:`, error);
    return [];
  }
};

// Filter stations by availability
export const getAvailableStations = async () => {
  try {
    const stations = await getAllStations();
    return stations.filter(station => station.availability === true);
  } catch (error) {
    console.error('Error fetching available stations:', error);
    return [];
  }
};

// Get station types (distinct)
export const getStationTypes = async () => {
  try {
    const stations = await getAllStations();
    const types = [...new Set(stations.map(station => station.type))];
    return types;
  } catch (error) {
    console.error('Error fetching station types:', error);
    return [];
  }
};

// Filter stations by type
export const getStationsByType = async (type) => {
  try {
    const stations = await getAllStations();
    return stations.filter(station => station.type === type);
  } catch (error) {
    console.error(`Error fetching stations for type ${type}:`, error);
    return [];
  }
};

// Search stations by name or address
export const searchStations = async (query) => {
  try {
    const stations = await getAllStations();
    const lowerCaseQuery = query.toLowerCase();
    return stations.filter(station => 
      station.name.toLowerCase().includes(lowerCaseQuery) || 
      station.address.toLowerCase().includes(lowerCaseQuery)
    );
  } catch (error) {
    console.error(`Error searching stations for "${query}":`, error);
    return [];
  }
};

// Find nearest charging stations based on user location - fixed implementation
export const findNearestStations = (userLocation, stations, limit = 5) => {
  // Validate inputs
  if (!userLocation || typeof userLocation !== 'object' || 
      !userLocation.hasOwnProperty('lat') || !userLocation.hasOwnProperty('lng') ||
      typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
    console.warn('Invalid user location:', userLocation);
    return [];
  }
  
  if (!stations || !Array.isArray(stations) || stations.length === 0) {
    console.warn('No stations provided to findNearestStations');
    return [];
  }
  
  try {
    // Calculate distance for each station
    const stationsWithDistance = stations
      .filter(station => {
        return station && 
               (station.latitude !== undefined || station.lat !== undefined) && 
               (station.longitude !== undefined || station.lng !== undefined);
      })
      .map(station => {
        // Use either latitude/longitude or lat/lng properties
        const stationLat = station.latitude || station.lat;
        const stationLng = station.longitude || station.lng;
        
        // Calculate distance
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          parseFloat(stationLat),
          parseFloat(stationLng)
        );
        
        return {
          ...station,
          distance
        };
      });
    
    // Return stations sorted by distance
    return stationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  } catch (error) {
    console.error('Error in findNearestStations:', error);
    return [];
  }
};

// Apply filters to charging stations
export const applyFilters = async (filters = {}) => {
  try {
    if (!filters || typeof filters !== 'object') {
      console.warn('Invalid filters object:', filters);
      return await getAllStations(); // Return all if filters are invalid
    }
    
    const stations = await getAllStations();
    
    if (!Array.isArray(stations)) {
      console.warn('getAllStations did not return an array');
      return [];
    }
    
    return stations.filter(station => {
      // Filter by availability if specified
      if (filters.availability !== undefined && station.availability !== filters.availability) {
        return false;
      }
      
      // Filter by minimum power
      if (filters.minPower !== undefined && station.power < filters.minPower) {
        return false;
      }
      
      // Filter by connector type
      if (filters.plugType && station.plugType !== filters.plugType) {
        return false;
      }
      
      // Filter by city
      if (filters.city && station.city !== filters.city) {
        return false;
      }
      
      // Filter by amenities (if amenities is an array and filters.amenities is also an array)
      if (filters.amenities && filters.amenities.length > 0 && Array.isArray(station.amenities)) {
        // Check if station has all required amenities
        const hasAllAmenities = filters.amenities.every(amenity => 
          station.amenities.includes(amenity)
        );
        if (!hasAllAmenities) {
          return false;
        }
      }
      
      // If the station passed all filters, include it
      return true;
    });
  } catch (error) {
    console.error('Error applying filters:', error);
    return [];
  }
};

// Add more data service functions as needed for your application
export const createBooking = async (bookingData) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const newBooking = {
      ...bookingData,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(bookingsRef, newBooking);
    return { id: docRef.id, ...newBooking };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};
