const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Firebase: Attempting to load from environment variable...');
    
    let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    // Base64 decode support (a common trick to avoid Vercel parsing issues)
    if (!rawJson.trim().startsWith('{')) {
        try {
            rawJson = Buffer.from(rawJson, 'base64').toString('utf8');
        } catch (e) {
            // ignore
        }
    }
    
    serviceAccount = JSON.parse(rawJson);
    
    // Vercel often double-escapes newlines in env variables. Fix it here.
    if (serviceAccount && serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
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
  console.error('Check if FIREBASE_SERVICE_ACCOUNT is valid JSON in Vercel settings. You can also Base64 encode it.');
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
