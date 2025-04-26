// Re-export from consolidated firebase config to maintain compatibility

import { firebaseApp, auth } from './services/firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail 
} from 'firebase/auth';

// Export auth functions for easier use throughout the app
export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
};

export default firebaseApp;

// Export Maps API key for consistency
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
