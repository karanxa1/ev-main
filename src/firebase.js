// Firebase configuration for authentication

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail 
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDNBNSH0YQVxVtjOGeTVm6Ui7C5AOfxHys",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ev-charging-app-f8464.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ev-charging-app-f8464",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ev-charging-app-f8464.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "230456789012",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:230456789012:web:5e12afd56789a0bc1def34"
};

// Initialize Firebase if it hasn't been initialized yet
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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

export default app;
