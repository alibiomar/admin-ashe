import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import { getMessaging, getToken } from "firebase/messaging";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Correct initialization for Firestore
const messaging = getMessaging(app);

export { auth, db, messaging };

// Function to generate FCM token
export const generateToken = async () => {
  // Ensure this code runs in the client-side (browser)
  if (typeof window !== "undefined") {
    try {
      // Request notification permission from the user
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);

      if (permission === "granted") {
        // Get FCM token using Firebase Cloud Messaging (FCM)
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        console.log("FCM Token:", token);
      } else {
        console.error("Notification permission denied.");
      }
    } catch (error) {
      console.error("Error generating token:", error);
    }
  }
};
