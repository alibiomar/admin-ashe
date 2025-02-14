// components/CollectionListener.js
import { useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

export default function CollectionListener() {
  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const order = change.doc.data(); // You can use this to add more order details in your notification
          
          // Ensure that the service worker is available and ready
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "TRIGGER_NOTIFICATION",
              title: "New Order!",
              options: {
                body: `You have a new order! Details: ${order.details || "N/A"}`, // Customize with order info
                icon: "/notif.png",
              },
            });
          } else {
            console.error("Service worker not available.");
          }
        }
      });
    });

    return () => unsubscribe();
  }, []); // Empty dependency array to run the effect only once

  return null;
}
