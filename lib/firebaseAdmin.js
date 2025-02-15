import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const getProcessedPrivateKey = (key) => {
  if (!key) {
    throw new Error('FIREBASE_PRIVATE_KEY is not defined');
  }
  
  // Handle both raw and JSON-stringified private keys
  return key.includes('\\n') ? key.replace(/\\n/g, '\n').trim() : key.trim();
};

const validatePrivateKey = (key) => {
  if (!key.startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key header');
  }
  if (!key.endsWith('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key footer');
  }
  return key;
};

// Singleton pattern for Firebase initialization
let dbInstance = null;
let authInstance = null;

if (!admin.apps.length) {
  try {
    const processedKey = getProcessedPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    const validatedKey = validatePrivateKey(processedKey);

    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID is not defined');
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('FIREBASE_CLIENT_EMAIL is not defined');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: validatedKey,
      }),
    });

    dbInstance = getFirestore();
    authInstance = getAuth();
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

// Export instances correctly
export { admin, dbInstance as adminDb, authInstance as adminAuth };
