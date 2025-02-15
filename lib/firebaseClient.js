import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase with singleton pattern
const initializeFirebase = () => {
  if (typeof window === 'undefined') return {};

  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    let messagingInstance = null;

    // Initialize messaging only in supported browsers
    if ('Notification' in window && 'serviceWorker' in navigator) {
      messagingInstance = getMessaging(app);
    }

    return {
      app,
      auth,
      db,
      messaging: messagingInstance
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return {};
  }
};

const firebase = initializeFirebase();

export const { app, auth, db, messaging } = firebase;