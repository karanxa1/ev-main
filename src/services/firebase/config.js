// Firebase configuration consolidated to prevent duplicate initialization

import { initializeApp, getApps } from 'firebase/app';
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

// Initialize Firebase only if it hasn't been initialized yet
let firebaseApp;
if (!getApps().length) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error", error);
    // Don't throw error so the app can still function
  }
} else {
  firebaseApp = getApps()[0];
}

// Initialize services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };
export default firebaseApp;
