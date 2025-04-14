import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use direct configuration values instead of environment variables
// This helps isolate potential environment variable loading issues
const firebaseConfig = {
  apiKey: "AIzaSyBnD2JEGsef_iFvBA1Q_aeMU57cgZDDGK0",
  authDomain: "neuronet-35d6e.firebaseapp.com",
  projectId: "neuronet-35d6e",
  storageBucket: "neuronet-35d6e.firebasestorage.app",
  messagingSenderId: "571998141302",
  appId: "1:571998141302:web:00bfdc3bd053276cb9d857"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
