// components/CollectionListener.js
import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { useNotifications } from '../hooks/useNotifications';

export default function CollectionListener({ swRegistration }) {
  const { sendNotification, requestPermission } = useNotifications(swRegistration);
  const [isListening, setIsListening] = useState(false);
  const [isSwReady, setIsSwReady] = useState(false); // Track SW readiness
  const [retryCount, setRetryCount] = useState(0); // Retry count for Firestore listener

  // Initialize service worker and check readiness
  const initServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        setIsSwReady(true); // Set service worker as ready
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  };

  useEffect(() => {
    initServiceWorker(); // Register service worker on component mount
  }, []);

  // Request notification permission once the service worker is ready
  useEffect(() => {
    if (isSwReady) {
      requestPermission(); // Request permission for notifications
    }
  }, [isSwReady, requestPermission]);

  // Enhanced notification handler for new orders
  const handleNewOrder = useCallback(async (orderData) => {
    try {
      await sendNotification({
        title: 'New Order Received',
        body: `Order #${orderData.id} - ${orderData.total}€`,
        icon: '/icons/order.png',
        data: { url: `/orders/${orderData.id}` },
        vibrate: [200, 100, 200],
        actions: [
          { action: 'view', title: 'View Order' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      }, {
        retries: 5,
        retryDelay: 1000,
        backoffFactor: 2
      });
    } catch (error) {
      console.error('Notification failed after retries:', error);
    }
  }, [sendNotification]);

  // Firestore listener with retry logic
  useEffect(() => {
    if (!isSwReady || isListening) return;

    const setupListener = () => {
      const unsubscribe = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              handleNewOrder({ id: change.doc.id, ...change.doc.data() });
            }
          });
        },
        (error) => {
          console.error('Firestore listener error:', error);
          if (retryCount < 5) { // Max 5 retry attempts
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
            setRetryCount((prev) => prev + 1);
            setTimeout(setupListener, delay);
          }
        }
      );
      setIsListening(true);
      return () => {
        unsubscribe();
        setIsListening(false);
      };
    };

    setupListener();
  }, [isSwReady, handleNewOrder, isListening, retryCount]);

  return null;
}
