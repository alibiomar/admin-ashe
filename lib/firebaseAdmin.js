import admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
// Validate key before initialization
const validatePrivateKey = (key) => {
  if (!key.startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key header');
  }
  if (!key.endsWith('-----END PRIVATE KEY-----\n')) {
    throw new Error('Invalid private key footer');
  }
};

if (!admin.apps.length) {
  try {
    validatePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    
  } catch (error) {
    throw error;
  }
}

const adminMessaging = getMessaging(adminApp);
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export {  adminMessaging };
