import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { auth, db, storage } from './config';

export { auth };

// Types
export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'driver' | 'host';
  createdAt: Timestamp;
}

export interface ChargerData {
  id?: string;
  ownerId: string;
  name: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  type: string;
  power: number;
  pricePerKwh: number;
  availability: boolean;
  imageUrl?: string;
  createdAt: Timestamp;
}

export interface BookingData {
  id?: string;
  userId: string;
  chargerId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice?: number;
  createdAt: Timestamp;
}

// Authentication Services
export const registerUser = async (email: string, password: string, role: 'driver' | 'host') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore with role
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
      createdAt: serverTimestamp()
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};



export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Get user role
export const getUserRole = async (userId: string): Promise<string | null> => {
  try {
    const userData = await getUserData(userId);
    return userData?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Firestore Services - Users
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserData>) => {
  try {
    await updateDoc(doc(db, 'users', userId), data);
  } catch (error) {
    throw error;
  }
};

// Firestore Services - Chargers
export const addCharger = async (chargerData: Omit<ChargerData, 'id' | 'createdAt'>) => {
  try {
    const chargerRef = await addDoc(collection(db, 'chargers'), {
      ...chargerData,
      createdAt: serverTimestamp()
    });
    return chargerRef.id;
  } catch (error) {
    throw error;
  }
};

export const getChargers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'chargers'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChargerData[];
  } catch (error) {
    throw error;
  }
};

export const getUserChargers = async (userId: string) => {
  try {
    const q = query(collection(db, 'chargers'), where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChargerData[];
  } catch (error) {
    throw error;
  }
};

export const updateCharger = async (chargerId: string, data: Partial<ChargerData>) => {
  try {
    await updateDoc(doc(db, 'chargers', chargerId), data);
  } catch (error) {
    throw error;
  }
};

export const deleteCharger = async (chargerId: string) => {
  try {
    await deleteDoc(doc(db, 'chargers', chargerId));
  } catch (error) {
    throw error;
  }
};

// Firestore Services - Bookings
export const createBooking = async (bookingData: Omit<BookingData, 'id' | 'createdAt'>) => {
  try {
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: serverTimestamp()
    });
    return bookingRef.id;
  } catch (error) {
    throw error;
  }
};

export const getUserBookings = async (userId: string) => {
  try {
    const q = query(collection(db, 'bookings'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BookingData[];
  } catch (error) {
    throw error;
  }
};

export const getChargerBookings = async (chargerId: string) => {
  try {
    const q = query(collection(db, 'bookings'), where('chargerId', '==', chargerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BookingData[];
  } catch (error) {
    throw error;
  }
};

export const updateBookingStatus = async (bookingId: string, status: BookingData['status']) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), { status });
  } catch (error) {
    throw error;
  }
};

// Storage Services
export const uploadImage = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    throw error;
  }
};

export const deleteImage = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    throw error;
  }
};