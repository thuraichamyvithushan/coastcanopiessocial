const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Firebase: Attempting to load from environment variable...');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('Firebase: Environment variable parsed successfully.');
  } else {
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } else {
      console.warn('Firebase: No service account found in ENV or local file.');
    }
  }
} catch (error) {
  console.error('CRITICAL FIREBASE ERROR:', error.message);
  console.error('Check if FIREBASE_SERVICE_ACCOUNT is valid JSON in Vercel settings.');
}

if (!admin.apps.length && serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `huntsman-optics.firebasestorage.app`
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Initialization Error:', error.message);
  }
}

module.exports = admin;
