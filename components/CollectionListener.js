import { useEffect, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

export default function CollectionListener({ swRegistration }) {
  // Handle notification trigger
  const triggerNotification = useCallback(async (orderData) => {
    if (!navigator.serviceWorker.controller) {
      console.warn("⚠️ No active service worker controller");
      return false;
    }

    try {
      navigator.serviceWorker.controller.postMessage({
        type: "TRIGGER_NOTIFICATION",
        title: "New Order Received!",
        options: {
          body: `Order from ${orderData.customerName || "Unknown"}`,
          icon: "/notif.png",
          badge: "/notif.png",
          data: { url: "/orders" },
          tag: `order-${orderData.id}`, // Prevent duplicate notifications
          timestamp: Date.now(), // For ordering notifications
          requireInteraction: true, // Keep notification until user interacts
          actions: [
            {
              action: 'view',
              title: 'View Order'
            }
          ]
        },
      });
      console.log("✅ Notification message sent to service worker");
      return true;
    } catch (error) {
      console.error("❌ Failed to send notification:", error);
      return false;
    }
  }, []);

  // Set up Firestore listener
  useEffect(() => {
    // Validate prerequisites
    if (!swRegistration) {
      console.warn("⚠️ No service worker registration available");
      return;
    }

    if (Notification.permission !== "granted") {
      console.warn("⚠️ Notification permission not granted");
      return;
    }

    if (!db) {
      console.error("❌ Firestore database instance not available");
      return;
    }

    console.log("🔵 Starting Firestore listener...");

    let isSubscribed = true;
    const collectionRef = collection(db, "orders");

    // Set up snapshot listener with error handling
    const unsubscribe = onSnapshot(
      collectionRef,
      async (snapshot) => {
        if (!isSubscribed) return;

        console.log(`📥 Received Firestore snapshot with ${snapshot.docs.length} docs`);

        // Process document changes
        const changes = snapshot.docChanges();
        
        for (const change of changes) {
          if (change.type === "added") {
            const orderData = {
              id: change.doc.id,
              ...change.doc.data()
            };

            console.log("📦 New order detected:", orderData);

            // Attempt to send notification with retry
            let notificationSent = false;
            for (let attempt = 1; attempt <= 3 && !notificationSent; attempt++) {
              if (attempt > 1) {
                console.log(`Retrying notification (attempt ${attempt}/3)...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              notificationSent = await triggerNotification(orderData);
            }

            if (!notificationSent) {
              console.error("❌ Failed to send notification after all retries");
            }
          }
        }
      },
      (error) => {
        console.error("❌ Firestore listener error:", error);
        // Optionally implement retry logic here
      }
    );

    // Cleanup function
    return () => {
      isSubscribed = false;
      unsubscribe();
      console.log("🔴 Firestore listener stopped");
    };
  }, [swRegistration, triggerNotification]);

  // Optional: Add error boundary
  useEffect(() => {
    const handleError = (error) => {
      console.error("CollectionListener Error:", error);
      // Implement error reporting as needed
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return null;
}