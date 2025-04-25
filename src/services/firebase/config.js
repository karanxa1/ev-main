import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use direct configuration values instead of environment variables
// This helps isolate potential environment variable loading issues
const firebaseConfig = {
  apiKey: "AIzaSyCFM2BkzLKbEizBHyd3DI1AG6axoCiYA08",
  authDomain: "sample-firbase-ai-app-c1fc3.firebaseapp.com",
  projectId: "sample-firbase-ai-app-c1fc3",
  storageBucket: "sample-firbase-ai-app-c1fc3.firebasestorage.app",
  messagingSenderId: "251353888761",
  appId: "1:251353888761:web:d861ad2ae68751c695ef28"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
