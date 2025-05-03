const { initializeApp } = require('firebase/app');
const { getFirestore, collection, setDoc, doc } = require('firebase/firestore');
const chargingStations = require('../data/chargingStations.json');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Log the environment variables to debug
console.log('Environment variables:');
console.log('API Key:', process.env.REACT_APP_FIREBASE_API_KEY ? '✓ Loaded' : '✗ Missing');
console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);

// Fix: Use hardcoded Firebase config values as fallback if env vars are not loading
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCFM2BkzLKbEizBHyd3DI1AG6axoCiYA08',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'sample-firbase-ai-app-c1fc3.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'sample-firbase-ai-app-c1fc3',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'sample-firbase-ai-app-c1fc3.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '251353888761',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:251353888761:web:d861ad2ae68751c695ef28'
};

// Log the config being used
console.log('Using Firebase config with Project ID:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create an extremely minimal version of each station
const createMinimalStation = (station) => {
  // Exclude the 'id' field since it's already used as the document ID
  return {
    name: String(station.name || ''),
    // Convert everything to strings to avoid type issues
    address: String(station.address || ''),
    city: String(station.city || '')
  };
};

const uploadStationsToFirebase = async () => {
  try {
    console.log('Starting data upload to Firebase...');
    
    console.log('\n⚠️ IMPORTANT: Your current Firebase rules require authentication for writes.');
    console.log('You have two options:');
    console.log('Option 1: Temporarily change your rules for this upload');
    console.log('  - Go to: https://console.firebase.google.com/project/sample-firbase-ai-app-c1fc3/firestore/rules');
    console.log('  - Change the write rule to: allow write: if true;');
    console.log('  - After upload, you can change back to: allow write: if request.auth != null;');
    console.log('\nOption 2: Implement authentication in this script');
    console.log('  - This requires additional code to sign in with an admin account');
    console.log('\nWould you like to:');
    console.log('1. Proceed with current rules (will fail unless you changed rules)');
    console.log('2. Exit to update rules first');
    
    // For now, just proceed (user can manually run again after updating rules)
    console.log('\nAutomatically proceeding with option 1...');
    
    // STEP 1: Try uploading a test document first to verify connection works
    try {
      const testRef = doc(collection(db, 'test'));
      console.log('Attempting to upload test document...');
      // Fix: Use an even simpler test document with just string values
      await setDoc(testRef, { 
        test: 'This is a test', 
        message: 'Simple message'
      });
      console.log('✅ Test document uploaded successfully');
    } catch (testError) {
      console.error('❌ Failed to upload test document:', testError);
      console.error('Error details:', JSON.stringify(testError));
      console.error('Aborting process due to test failure');
      return;
    }
    
    // STEP 2: Try one station at a time with minimal data
    console.log('Now attempting to upload stations...');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Try just the first 3 stations first to see if they work
    const stationsToTry = chargingStations.stations.slice(0, 3);
    
    for (let i = 0; i < stationsToTry.length; i++) {
      const station = stationsToTry[i];
      
      try {
        console.log(`Processing station ${i+1}/${stationsToTry.length}: ${station.name}`);
        
        // Create simplified station object
        const stationData = createMinimalStation(station);
        
        console.log(`Uploading minimal data: ${JSON.stringify(stationData)}`);
        
        // Create document reference using the station ID
        const stationRef = doc(collection(db, 'chargingStations'), station.id);
        
        // Upload individual document
        await setDoc(stationRef, stationData);
        
        successCount++;
        console.log(`✅ Station uploaded: ${station.name}`);
      } catch (err) {
        errorCount++;
        console.error(`❌ Failed to upload station: ${err.message}`);
        
        // Try with an even more minimal payload
        try {
          console.log('Attempting with single field...');
          const stationRef = doc(collection(db, 'chargingStations'), station.id);
          await setDoc(stationRef, { name: String(station.name || 'Unnamed Station') });
          console.log('✅ Single field upload successful');
          successCount++;
        } catch (fallbackErr) {
          console.error('❌ Even single field failed:', fallbackErr.message);
        }
      }
    }
    
    console.log(`Initial test completed. Success: ${successCount}, Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('Some uploads were successful. You can proceed with uploading all stations.');
    } else {
      console.log('All uploads failed. There might be an issue with your Firebase configuration or permissions.');
    }
    
  } catch (error) {
    console.error('Error in upload process:', error);
  }
};

// Execute the upload
uploadStationsToFirebase();
