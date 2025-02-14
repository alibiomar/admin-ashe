import { useEffect } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Initialize Firestore (ensure you have already configured Firebase in your project)
import { app } from "../lib/firebaseClient"; // your Firebase initialization file
const db = getFirestore(app);

export default function PushSubscription() {
  useEffect(() => {
    async function subscribeForPush() {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: "BNLkfRjIHrlsokMI89DQKkpGDrjWdpTQTvmAmkIs8BlAADbgX6nLje0LP6tS7uHiLIhPUUNfyf2d10B2vFbvgoc" // Replace with your public VAPID key
          });
          
          // Save the subscription in Firestore under the admin's document (e.g., using admin's email as ID)
          await setDoc(doc(db, "users", "contact@ashe.tn"), {
            pushSubscription: JSON.stringify(subscription)
          });
          console.log("Push subscription saved.");
        } catch (err) {
          console.error("Failed to subscribe for push notifications:", err);
        }
      } else {
        console.log("Notification permission not granted.");
      }
    }

    subscribeForPush();
  }, []);

  return null;
}
