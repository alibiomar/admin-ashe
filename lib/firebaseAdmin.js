import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
const getProcessedPrivateKey = (key) => {
  if (!key) {
    throw new Error('FIREBASE_PRIVATE_KEY is not defined');
  }
  // Replace literal "\n" with actual newline characters and trim whitespace.
  return key.replace(/\\n/g, '\n').trim();
};

const validatePrivateKey = (key) => {
  if (!key.startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key header');
  }
  // Remove the trailing newline check if your key might not end with a newline.
  if (!key.endsWith('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key footer');
  }
};

if (!admin.apps.length) {
  try {
    const processedKey = getProcessedPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    validatePrivateKey(processedKey);

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: processedKey
      }),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}
const admin = initializeApp(adminConfig);
const db = getFirestore(admin);
const messaging = getMessaging(admin);

export { admin, db, messaging };