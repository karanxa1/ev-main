import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Log for debugging - remove in production
if (!process.env.REACT_APP_FIREBASE_API_KEY) {
  console.error('Firebase API key is missing. Check your .env file.');
}

// Initialize Firebase safely
let firebaseApp;
try {
  // Check if Firebase is already initialized
  if (getApps().length) {
    firebaseApp = getApp();
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create a placeholder to prevent crashes
  firebaseApp = {} as any;
}

// Initialize services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };
export default firebaseApp;
