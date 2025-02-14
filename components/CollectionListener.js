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
          console.log("New document added: ", change.doc.data());
        }
      });
    });

    return () => unsubscribe();
  }, [swRegistration]);

  return null;
}
