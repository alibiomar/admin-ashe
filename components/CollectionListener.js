import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

export default function CollectionListener({ swRegistration }) {
  useEffect(() => {
    // Only proceed if swRegistration is provided
    if (!swRegistration) return;

    // Check for notification permission
    if (Notification.permission !== "granted") return;

    // Define your Firestore collection reference
    const collectionRef = collection(db, "orders");

    // Set up the real-time listener
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          if (swRegistration.active) {
            swRegistration.active.postMessage({
              type: "TRIGGER_NOTIFICATION",
              title: "New Order Received",
              options: {
                body: "Hey ASHE, a new order has been placed.",
                icon: "/notif.png", // Ensure this path matches your icon in the public folder
              },
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [swRegistration]);

  return null;
}
