import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

export default function CollectionListener({ swRegistration }) {
  useEffect(() => {
    if (!swRegistration) {
      console.warn("No service worker registration available.");
      return;
    }
  
    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted.");
      return;
    }
  
    console.log("Listening for Firestore changes...");
  
    // 🔹 Debug Firestore connection
    console.log("Firestore Database Instance:", db);
  
    const collectionRef = collection(db, "orders");
  
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        console.log("Firestore snapshot received:", snapshot.docs.length, "docs");
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const orderData = change.doc.data();
            console.log("New order detected:", orderData);
  
            if (navigator.serviceWorker.controller) {
              console.log("Sending notification message to service worker...");
              navigator.serviceWorker.controller.postMessage({
                type: "TRIGGER_NOTIFICATION",
                title: "New Order Received!",
                options: {
                  body: `Order from ${orderData.customerName || "Unknown"}`,
                  icon: "/notif.png",
                  badge: "/notif.png",
                  data: { url: "/orders" },
                },
              });
            } else {
              console.warn("No active service worker controller.");
            }
          }
        });
      },
      (error) => {
        console.error("Firestore listener error:", error);
      }
    );
  
    return () => unsubscribe();
  }, [swRegistration]);
  

  return null;
}
