import { db } from './config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  GeoPoint,
  serverTimestamp
} from 'firebase/firestore';

// Charger related functions
export const fetchNearbyChargers = async (location, radius) => {
  // Note: For proper geolocation queries, you should use Firebase Extensions
  // like GeoFirestore or implement a more complex solution.
  // This is a simplified version for prototyping.
  try {
    const chargersRef = collection(db, 'chargers');
    const snapshot = await getDocs(chargersRef);
    
    // Filter chargers based on rough distance calculation
    // In a real app, this filtering would happen server-side
    const chargers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Simple distance calculation (not accurate for large distances)
      const distance = calculateDistance(
        location.lat, 
        location.lng, 
        data.location.latitude, 
        data.location.longitude
      );
      
      if (distance <= radius) {
        chargers.push({
          id: doc.id,
          ...data,
          distance
        });
      }
    });
    
    return chargers.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error fetching nearby chargers:', error);
    throw error;
  }
};

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

// Booking related functions
export const createBooking = async (bookingData) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const newBooking = {
      ...bookingData,
      status: 'confirmed',
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(bookingsRef, newBooking);
    return { id: docRef.id, ...newBooking };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getUserBookings = async (userId) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const bookings = [];
    snapshot.forEach(doc => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return bookings;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

// Add more Firestore functions as needed
