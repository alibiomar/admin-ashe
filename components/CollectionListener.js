import { useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

export default function CollectionListener() {
  useEffect(() => {
    const setupNotifications = async () => {
      // First ensure notification permission is granted
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
      }

      // Setup Firestore listener
      const q = query(collection(db, "orders"));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added" || change.type === "modified") {
            const order = change.doc.data();
            
            try {
              // Wait for service worker to be ready
              const registration = await navigator.serviceWorker.ready;
              
              // Send message to service worker
              registration.active.postMessage({
                type: "TRIGGER_NOTIFICATION",
                title: "New Order!",
                options: {
                  body: `You have a new order! Details: ${order.details || "N/A"}`,
                  icon: "/notif.png",
                  requireInteraction: true, // Keep notification until user interacts
                  vibrate: [200, 100, 200], // Vibration pattern
                  tag: 'new-order', // Tag to prevent duplicate notifications
                  data: { // Custom data you might need
                    orderId: change.doc.id,
                    timestamp: new Date().toISOString()
                  }
                },
              });
            } catch (error) {
              console.error("Error sending notification:", error);
            }
          }
        });
      });

      return () => unsubscribe();
    };

    setupNotifications();
  }, []);

  return null;
}