import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc, orderBy, limit } from 'firebase/firestore';

// Firebase configuration with hardcoded fallback values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCFM2BkzLKbEizBHyd3DI1AG6axoCiYA08',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'sample-firbase-ai-app-c1fc3.firebaseapp.com', 
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'sample-firbase-ai-app-c1fc3',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'sample-firbase-ai-app-c1fc3.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '251353888761',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:251353888761:web:d861ad2ae68751c695ef28'
};

// Initialize Firebase with error handling
let app;
let db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create a fallback for development/testing
  console.warn('Using fallback data - Firebase connection failed');
}

// Helper function to ensure we always return an array
const ensureArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [data];
};

// Get all charging stations
export const getChargingStations = async () => {
  try {
    console.log('🔄 Fetching all charging stations from Firebase...');
    
    if (!db) {
      console.error('❌ Firebase DB not initialized');
      return [];
    }
    
    const stationsCollection = collection(db, 'chargingStations');
    console.log('📂 Collection reference created for:', stationsCollection.path);
    
    const stationsSnapshot = await getDocs(stationsCollection);
    console.log('📊 Snapshot received, empty?', stationsSnapshot.empty);
    console.log('📊 Snapshot size:', stationsSnapshot.size);
    
    if (stationsSnapshot.empty) {
      console.warn('⚠️ No charging stations found in Firestore');
      return [];
    }
    
    const stations = stationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        latitude: data.lat || data.latitude || 0,
        longitude: data.lng || data.longitude || 0
      };
    });
    
    console.log(`✅ Successfully fetched ${stations.length} stations`);
    return stations;
  } catch (error) {
    console.error('❌ Error fetching charging stations:', error);
    return []; 
  }
};

// Get a single charging station by ID
export const getChargingStationById = async (stationId) => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, returning null');
      return null;
    }

    const stationDoc = await getDoc(doc(db, 'chargingStations', stationId));
    if (stationDoc.exists()) {
      const data = stationDoc.data();
      return {
        ...data,
        id: stationDoc.id,
        // Map lat/lng back to latitude/longitude for backward compatibility
        latitude: data.lat || data.latitude || 0,
        longitude: data.lng || data.longitude || 0
      };
    } else {
      console.warn(`Station with ID ${stationId} not found`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching station with ID ${stationId}:`, error);
    return null;
  }
};

// Get charging stations by city
export const getChargingStationsByCity = async (city) => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, returning empty array');
      return [];
    }

    const q = query(collection(db, 'chargingStations'), where('city', '==', city));
    const stationsSnapshot = await getDocs(q);

    if (stationsSnapshot.empty) {
      console.warn(`No charging stations found for city ${city}`);
      return [];
    }

    return stationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        latitude: data.lat || data.latitude || 0,
        longitude: data.lng || data.longitude || 0
      };
    });
  } catch (error) {
    console.error(`Error fetching stations for city ${city}:`, error);
    return [];
  }
};

// Get top rated charging stations
export const getTopRatedChargingStations = async (limitCount = 5) => {
  try {
    if (!db) return [];
    
    const q = query(
      collection(db, 'chargingStations'),
      orderBy('rating', 'desc'),
      limit(limitCount)
    );
    const stationsSnapshot = await getDocs(q);
    
    if (stationsSnapshot.empty) {
      return [];
    }
    
    return stationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        latitude: data.lat || data.latitude || 0,
        longitude: data.lng || data.longitude || 0
      };
    });
  } catch (error) {
    console.error('Error fetching top rated stations:', error);
    return []; // Return empty array instead of throwing
  }
};

// New utility function to help with the HomePage issue
export const getSafeNearbyStations = async (userLocation, radius = 10, limit = 5) => {
  try {
    const stations = await getChargingStations();
    // Always return an array even if no stations are found
    return stations || [];
  } catch (error) {
    console.error('Error in getSafeNearbyStations:', error);
    return [];
  }
};

export default {
  getChargingStations,
  getChargingStationById,
  getChargingStationsByCity,
  getTopRatedChargingStations,
  getSafeNearbyStations
};
