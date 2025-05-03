const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Firebase with hardcoded config as fallback
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCFM2BkzLKbEizBHyd3DI1AG6axoCiYA08',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'sample-firbase-ai-app-c1fc3.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'sample-firbase-ai-app-c1fc3',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'sample-firbase-ai-app-c1fc3.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '251353888761',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:251353888761:web:d861ad2ae68751c695ef28'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const checkFirebaseAccess = async () => {
  console.log('Checking Firebase configuration and access...');
  console.log('Project ID:', firebaseConfig.projectId);
  
  // Track which checks pass
  let readSuccessful = false;
  
  try {
    // Test read access first
    console.log('\n📖 TESTING READ ACCESS...');
    try {
      const testCollection = collection(db, 'test');
      await getDocs(testCollection);
      console.log('✅ Read access successful');
      readSuccessful = true;
    } catch (readError) {
      console.error('❌ Read access failed:', readError.message);
      if (readError.code === 'permission-denied') {
        console.log('   Security rules are preventing read access');
      }
    }

    // Test write access with minimal data
    console.log('\n📝 TESTING WRITE ACCESS...');
    try {
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Test document',
        createdAt: new Date().toISOString()
      });
      console.log('✅ Write access successful, document created with ID:', docRef.id);
      console.log('\n🎉 Firebase configuration is valid and has proper access permissions!');
    } catch (writeError) {
      console.error('❌ Write access failed:', writeError.message);
      
      if (writeError.code === 'permission-denied') {
        console.log('\n🔐 PERMISSION DENIED: You need to update your Firestore security rules.');
        console.log('\nSTEP 1: Go to the Firebase Console');
        console.log(`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`);
        
        console.log('\nSTEP 2: Replace your security rules with these (for development only):');
        console.log('```');
        console.log('rules_version = \'2\';');
        console.log('service cloud.firestore {');
        console.log('  match /databases/{database}/documents {');
        console.log('    match /{document=**} {');
        console.log('      allow read, write: if true;');
        console.log('    }');
        console.log('  }');
        console.log('}');
        console.log('```');
        
        console.log('\nSTEP 3: Click "Publish" to apply the new rules');
        
        console.log('\nSTEP 4: Run this script again to verify the changes worked');
        
        console.log('\n⚠️ IMPORTANT: These rules allow anyone to read/write your database.');
        console.log('   Only use these rules for development. For production,');
        console.log('   implement proper authentication and security rules.');
      }
    }
    
  } catch (error) {
    console.error('❌ Firebase access check failed:', error.message);
    
    if (error.code === 'invalid-argument') {
      console.log('\n⚠️ DATA FORMAT ISSUE: The data format you\'re trying to upload is invalid.');
    } else {
      console.log('\n⚠️ CONFIGURATION ISSUE: Your Firebase configuration might be incorrect.');
      console.log('   Verify your environment variables and project settings.');
    }
  }
};

checkFirebaseAccess();
