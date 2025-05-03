import { db } from '../firebase/config';
import { collection, getDocs, getDoc, doc, query, where, orderBy, limit } from 'firebase/firestore';

export const chargingStationService = {
  // Get all charging stations
  getAllStations: async () => {
    try {
      const stationsSnapshot = await getDocs(collection(db, 'chargingStations'));
      return stationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching charging stations:', error);
      throw error;
    }
  },
  
  // Get a single station by ID
  getStationById: async (stationId) => {
    try {
      const stationDoc = await getDoc(doc(db, 'chargingStations', stationId));
      if (stationDoc.exists()) {
        return { id: stationDoc.id, ...stationDoc.data() };
      } else {
        throw new Error('Station not found');
      }
    } catch (error) {
      console.error(`Error fetching station with ID ${stationId}:`, error);
      throw error;
    }
  },
  
  // Get stations by city
  getStationsByCity: async (city) => {
    try {
      const q = query(
        collection(db, 'chargingStations'),
        where('city', '==', city)
      );
      const stationsSnapshot = await getDocs(q);
      return stationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error fetching stations for city ${city}:`, error);
      throw error;
    }
  },
  
  // Get stations by plug type
  getStationsByPlugType: async (plugType) => {
    try {
      const q = query(
        collection(db, 'chargingStations'),
        where('plugType', '==', plugType)
      );
      const stationsSnapshot = await getDocs(q);
      return stationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error fetching stations for plug type ${plugType}:`, error);
      throw error;
    }
  },
  
  // Get top rated stations
  getTopRatedStations: async (limit = 10) => {
    try {
      const q = query(
        collection(db, 'chargingStations'),
        orderBy('rating', 'desc'),
        limit(limit)
      );
      const stationsSnapshot = await getDocs(q);
      return stationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching top rated stations:', error);
      throw error;
    }
  }
};
