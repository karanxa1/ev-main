// Create or update this utility file for centralized API key access

// API Keys from environment variables
export const FIREBASE_API_KEY = process.env.REACT_APP_FIREBASE_API_KEY;
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Function to get Google Maps URL with API key
export function getGoogleMapsApiUrl(libraries: string[] = ['places']) {
  return `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${libraries.join(',')}`;
}

// Firebase config object for easy import
export const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
