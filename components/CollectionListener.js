import { useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

export default function CollectionListener({ swRegistration }) {
  useEffect(() => {
    if (!swRegistration) return;

    const setupNotifications = async () => {
      if (Notification.permission !== 'granted') return;

      const q = query(collection(db, "orders"));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added" || change.type === "modified") {
            const order = change.doc.data();
            
            try {
              await swRegistration.active.postMessage({
                type: "TRIGGER_NOTIFICATION",
                title: "New Order!",
                options: {
                  body: `You have a new order! Details: ${order.details || "N/A"}`,
                  icon: "/notif.png",
                  requireInteraction: true,
                  vibrate: [200, 100, 200],
                  tag: `order-${change.doc.id}`,
                  data: {
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
  }, [swRegistration]);

  return null;
}