// Import from the centralized config to prevent duplicate initialization

import { isFirebaseInitialized, firebaseApp, auth } from './services/firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail 
} from 'firebase/auth';

console.log(`Firebase already initialized: ${isFirebaseInitialized}`);

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
