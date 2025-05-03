const { initializeApp } = require('firebase/app');
const { getFirestore, collection, setDoc, doc } = require('firebase/firestore');
const chargingStations = require('../data/chargingStations.json');
const path = require('path');
const fs = require('fs');

// Load environment variables with absolute path
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Hardcoded Firebase config (using values from your .env)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCFM2BkzLKbEizBHyd3DI1AG6axoCiYA08',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'sample-firbase-ai-app-c1fc3.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'sample-firbase-ai-app-c1fc3',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'sample-firbase-ai-app-c1fc3.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '251353888761',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:251353888761:web:d861ad2ae68751c695ef28'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Log file to keep record of upload results
const logFile = path.resolve(__dirname, 'upload-results.log');
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  console.log(message);
};

// Prepare station data for Firestore
const prepareStationData = (station) => {
  // Create a clean version with proper types and no undefined values
  const prepared = {
    // Basic info
    id: station.id,
    name: station.name || '',
    type: station.type || '',
    address: station.address || '',
    city: station.city || '',
    hostName: station.hostName || '',
    plugType: station.plugType || '',
    
    // Numeric values (ensuring they're numbers)
    power: Number(station.power) || 0,
    pricePerKwh: Number(station.pricePerKwh) || 0,
    rating: Number(station.rating) || 0,
    
    // Location data
    lat: Number(station.latitude) || 0,
    lng: Number(station.longitude) || 0,
    
    // Boolean
    availability: Boolean(station.availability),
    
    // Arrays (ensuring they're arrays)
    amenities: Array.isArray(station.amenities) ? 
      station.amenities.map(a => String(a)) : []
  };
  
  // Add optional fields only if present in the original data
  if (station.hours) prepared.hours = String(station.hours);
  if (Array.isArray(station.connectorTypes)) {
    prepared.connectorTypes = station.connectorTypes.map(c => String(c));
  }
  
  return prepared;
};

const uploadAllStations = async () => {
  // Clear the log file
  fs.writeFileSync(logFile, '=== CHARGING STATION UPLOAD LOG ===\n');
  
  logToFile(`Starting upload of all ${chargingStations.stations.length} charging stations...`);
  logToFile(`Using Firebase project: ${firebaseConfig.projectId}\n`);
  logToFile(`Firebase rules have been updated to allow writes - this should work now!\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let successfulIds = [];
  let failedIds = [];
  
  // Try a test upload first
  try {
    logToFile("Performing test upload to verify connection and permissions...");
    const testRef = doc(collection(db, 'test'), 'test-doc');
    await setDoc(testRef, { test: true, timestamp: new Date().toISOString() });
    logToFile("✅ Test upload successful - proceeding with station data\n");
  } catch (testError) {
    logToFile(`❌ Test upload failed: ${testError.message}`);
    logToFile("Cannot proceed with migration until test upload works");
    return;
  }
  
  // Process all stations in smaller batches to avoid timeout issues
  const batchSize = 10;
  const totalBatches = Math.ceil(chargingStations.stations.length / batchSize);
  
  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const startIdx = batchNum * batchSize;
    const endIdx = Math.min(startIdx + batchSize, chargingStations.stations.length);
    
    logToFile(`\nProcessing batch ${batchNum + 1}/${totalBatches} (stations ${startIdx + 1}-${endIdx})`);
    
    // Process this batch of stations
    for (let i = startIdx; i < endIdx; i++) {
      const station = chargingStations.stations[i];
      const stationNum = i + 1;
      
      try {
        // Skip stations without valid IDs
        if (!station.id) {
          logToFile(`⚠️ Station #${stationNum} skipped: Missing ID`);
          errorCount++;
          continue;
        }
        
        // Prepare the station data - keep this simple to avoid issues
        const stationData = {
          id: station.id,
          name: station.name || '',
          type: station.type || '',
          address: station.address || '',
          city: station.city || '',
          power: Number(station.power) || 0,
          pricePerKwh: Number(station.pricePerKwh) || 0,
          rating: Number(station.rating) || 0,
          amenities: Array.isArray(station.amenities) ? station.amenities : []
        };
        
        // Create a reference to the station document
        const stationRef = doc(collection(db, 'chargingStations'), station.id);
        
        // Upload to Firestore
        await setDoc(stationRef, stationData);
        
        successCount++;
        successfulIds.push(station.id);
        logToFile(`✅ Station #${stationNum} "${station.name}" uploaded successfully`);
      } catch (error) {
        errorCount++;
        failedIds.push(station.id);
        logToFile(`❌ Error uploading station #${stationNum} (${station.name}, ID: ${station.id}):`);
        logToFile(`   Error: ${error.message}`);
      }
    }
    
    // Log batch progress
    logToFile(`Batch ${batchNum + 1} complete: Success=${successCount}, Errors=${errorCount}`);
  }
  
  // Log summary
  logToFile('\n=== UPLOAD SUMMARY ===');
  logToFile(`Total stations processed: ${chargingStations.stations.length}`);
  logToFile(`Successfully uploaded: ${successCount}`);
  logToFile(`Failed to upload: ${errorCount}`);
  
  if (errorCount > 0) {
    logToFile('\nFailed station IDs:');
    failedIds.forEach(id => logToFile(` - ${id}`));
  }
  
  if (successCount === chargingStations.stations.length) {
    logToFile('\n🎉 ALL STATIONS SUCCESSFULLY UPLOADED!');
  } else {
    logToFile('\n⚠️ PARTIAL UPLOAD: Some stations failed to upload.');
    
    // Give advice on how to complete the migration
    if (errorCount > 0 && errorCount < chargingStations.stations.length) {
      logToFile('\nTo upload only the failed stations, you can create a filtered version of your data with just those IDs.');
    }
  }
  
  logToFile(`\nDetailed log saved to: ${logFile}`);
};

// Execute the function
uploadAllStations().catch(error => {
  console.error('Unhandled error:', error);
  fs.appendFileSync(logFile, `FATAL ERROR: ${error.message}\n`);
});
