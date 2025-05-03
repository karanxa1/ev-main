// Simple script to migrate charging stations to Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, setDoc, doc } = require('firebase/firestore');
const chargingStations = require('../data/chargingStations.json');

// HARDCODED Firebase config to avoid any environment variable issues
const firebaseConfig = {
  apiKey: "AIzaSyCFM2BkzLKbEizBHyd3DI1AG6axoCiYA08",
  authDomain: "sample-firbase-ai-app-c1fc3.firebaseapp.com",
  projectId: "sample-firbase-ai-app-c1fc3",
  storageBucket: "sample-firbase-ai-app-c1fc3.firebasestorage.app",
  messagingSenderId: "251353888761",
  appId: "1:251353888761:web:d861ad2ae68751c695ef28"
};

// Initialize Firebase directly
console.log('Initializing Firebase with project:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const migrate = async () => {
  console.log(`Found ${chargingStations.stations.length} stations to migrate`);
  
  // Try to upload just one station first as a test
  try {
    console.log('\n=== TESTING WITH FIRST STATION ===');
    const firstStation = chargingStations.stations[0];
    console.log(`Test station: ${firstStation.name} (ID: ${firstStation.id})`);
    
    // Create minimal version of station data
    const testData = {
      name: firstStation.name,
      city: firstStation.city
    };
    
    console.log('Uploading test data:', testData);
    const testRef = doc(collection(db, 'test-stations'), firstStation.id);
    await setDoc(testRef, testData);
    console.log('✅ Test upload succeeded!');
    
    // If test passes, try all stations
    console.log('\n=== UPLOADING ALL STATIONS ===');
    
    let successCount = 0;
    
    for (const station of chargingStations.stations) {
      try {
        // Prepare minimal clean data
        const stationData = {
          name: station.name || '',
          type: station.type || '',
          address: station.address || '',
          city: station.city || '',
          power: Number(station.power) || 0,
          pricePerKwh: Number(station.pricePerKwh) || 0,
          availability: Boolean(station.availability),
          hostName: station.hostName || '',
          rating: Number(station.rating) || 0,
          plugType: station.plugType || '',
          lat: Number(station.latitude) || 0,
          lng: Number(station.longitude) || 0
        };
        
        // Only add amenities if it exists and is an array
        if (Array.isArray(station.amenities)) {
          stationData.amenities = station.amenities;
        }
        
        // Upload to Firestore
        const stationRef = doc(collection(db, 'chargingStations'), station.id);
        await setDoc(stationRef, stationData);
        
        successCount++;
        console.log(`✅ Uploaded: ${station.name} (${successCount}/${chargingStations.stations.length})`);
      } catch (stationError) {
        console.error(`❌ Error uploading station ${station.id} (${station.name}):`);
        console.error(`   ${stationError.message}`);
        
        if (stationError.code === 'permission-denied') {
          console.error('\n⚠️ PERMISSION DENIED: Update your Firestore security rules!');
          console.error('Go to Firebase Console and change rules to:');
          console.error('allow write: if true;');
          return;
        }
      }
    }
    
    console.log(`\n🎉 Migration complete! ${successCount} of ${chargingStations.stations.length} stations uploaded.`);
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED with error:');
    console.error(error);
    
    if (error.code === 'permission-denied') {
      console.error('\n⚠️ FIREBASE PERMISSION ERROR:');
      console.error('1. Go to: https://console.firebase.google.com/project/sample-firbase-ai-app-c1fc3/firestore/rules');
      console.error('2. Update your security rules to:');
      console.error('   rules_version = \'2\';');
      console.error('   service cloud.firestore {');
      console.error('     match /databases/{database}/documents {');
      console.error('       match /{document=**} {');
      console.error('         allow read, write: if true;');
      console.error('       }');
      console.error('     }');
      console.error('   }');
      console.error('3. Click "Publish"');
    }
  }
};

// Run the migration
console.log('Starting migration...');
migrate().catch(err => {
  console.error('Unhandled error:', err);
});
