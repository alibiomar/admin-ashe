import admin from 'firebase-admin';

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

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
