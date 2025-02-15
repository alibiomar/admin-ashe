import { useEffect, useCallback, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

// Configuration constants
const CONFIG = {
  notifications: {
    maxRetries: 3,
    retryDelay: 2000,
    backoffFactor: 1.5,
  },
  reconnect: {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
  }
};

// Custom hook for Service Worker state management
const useServiceWorker = (swRegistration) => {
  const [status, setStatus] = useState({
    isReady: false,
    error: null,
    permission: Notification.permission,
  });

  useEffect(() => {
    if (!swRegistration) return;

    const checkSWReadiness = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        setStatus(prev => ({
          ...prev,
          isReady: !!registration.active,
          error: null,
        }));
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          isReady: false,
          error: error.message,
        }));
      }
    };

    checkSWReadiness();
    navigator.serviceWorker.addEventListener("controllerchange", checkSWReadiness);
    
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", checkSWReadiness);
    };
  }, [swRegistration]);

  return status;
};

// Custom hook for notification handling
const useNotifications = (swStatus) => {
  const sendNotification = useCallback(async (orderData, attempt = 1) => {
    if (!swStatus.isReady) {
      throw new Error("Service Worker not ready for notifications");
    }

    try {
      const controller = navigator.serviceWorker.controller;
      if (!controller) {
        throw new Error("No active Service Worker controller");
      }

      await controller.postMessage({
        type: "TRIGGER_NOTIFICATION",
        title: "New Order Received!",
        options: {
          body: `Order #${orderData.id} from ${orderData.customerName || "Unknown"}`,
          icon: "/notif.png",
          badge: "/badge.png", // Added badge for better mobile visibility
          data: { 
            url: `/orders/${orderData.id}`,
            orderId: orderData.id,
            timestamp: Date.now()
          },
          tag: `order-${orderData.id}`,
          requireInteraction: true, // Ensures notification stays until user interacts
          actions: [
            { action: 'view', title: 'View Order' },
            { action: 'dismiss', title: 'Dismiss' }
          ],
          vibrate: [200, 100, 200], // Haptic feedback pattern
        },
      });

      return true;
    } catch (error) {
      if (attempt <= CONFIG.notifications.maxRetries) {
        const delay = CONFIG.notifications.retryDelay * 
          Math.pow(CONFIG.notifications.backoffFactor, attempt - 1);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendNotification(orderData, attempt + 1);
      }
      throw error;
    }
  }, [swStatus.isReady]);

  return { sendNotification };
};

// Custom hook for Firestore listener
const useFirestoreListener = (collectionName, onNewDocument) => {
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    let retryTimeout;

    const setupListener = async () => {
      try {
        const collectionRef = collection(db, collectionName);
        
        return onSnapshot(
          collectionRef,
          async (snapshot) => {
            if (!isMounted) return;
            retryCount = 0; // Reset retry count on successful connection

            const changes = snapshot.docChanges();
            await Promise.all(
              changes
                .filter(change => change.type === "added")
                .map(async (change) => {
                  const data = { id: change.doc.id, ...change.doc.data() };
                  await onNewDocument(data);
                })
            );
          },
          async (error) => {
            console.error("Firestore connection error:", error);
            
            if (!isMounted) return;
            
            // Implement exponential backoff for reconnection
            if (retryCount < CONFIG.reconnect.maxAttempts) {
              const delay = Math.min(
                CONFIG.reconnect.initialDelay * Math.pow(2, retryCount),
                CONFIG.reconnect.maxDelay
              );
              
              retryCount++;
              retryTimeout = setTimeout(setupListener, delay);
            }
          }
        );
      } catch (error) {
        console.error("Failed to setup Firestore listener:", error);
        throw error;
      }
    };

    let unsubscribe = setupListener();

    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName, onNewDocument]);
};

export default function CollectionListener({ swRegistration }) {
  const swStatus = useServiceWorker(swRegistration);
  const { sendNotification } = useNotifications(swStatus);
  
  const handleNewOrder = useCallback(async (orderData) => {
    try {
      await sendNotification(orderData);
      console.log(`✅ Notification sent for order ${orderData.id}`);
    } catch (error) {
      console.error(`❌ Failed to send notification for order ${orderData.id}:`, error);
    }
  }, [sendNotification]);

  useFirestoreListener("orders", handleNewOrder);

  // Service Worker message handler
  useEffect(() => {
    if (!swStatus.isReady) return;

    const messageHandler = (event) => {
      const { type, orderId, action } = event.data;
      if (type === "NOTIFICATION_ACTION") {
        console.log(`User ${action}ed notification for order ${orderId}`);
        // Handle different notification actions here
      }
    };

    navigator.serviceWorker.addEventListener("message", messageHandler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", messageHandler);
    };
  }, [swStatus.isReady]);

  return null;
}