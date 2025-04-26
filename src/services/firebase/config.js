// Completely refactored Firebase initialization to prevent duplicate instances

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNBNSH0YQVxVtjOGeTVm6Ui7C5AOfxHys",
  authDomain: "ev-charging-app-f8464.firebaseapp.com",
  projectId: "ev-charging-app-f8464",
  storageBucket: "ev-charging-app-f8464.appspot.com",
  messagingSenderId: "230456789012",
  appId: "1:230456789012:web:5e12afd56789a0bc1def34"
};

// Initialize Firebase - using a singleton pattern
let firebaseApp;

try {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error", error);
}

// Initialize services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Export a flag to indicate whether Firebase is already initialized
export const isFirebaseInitialized = getApps().length > 0;

export { firebaseApp, auth, db };
export default firebaseApp;
