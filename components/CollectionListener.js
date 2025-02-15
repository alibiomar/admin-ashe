
// components/CollectionListener.js
import { useEffect, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { useNotifications } from '../hooks/useNotifications';

export default function CollectionListener() {
  const { registration, isReady: isSwReady } = useServiceWorker();
  const { sendNotification, requestPermission } = useNotifications(registration);
  const [isListening, setIsListening] = useState(false);

  // Initialize notifications
  useEffect(() => {
    if (isSwReady) {
      requestPermission();
    }
  }, [isSwReady, requestPermission]);

  // Enhanced notification handler
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

  // Firestore listener with readiness checks
  useEffect(() => {
    if (!isSwReady || isListening) return;

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
        if (!isMounted) return;
            
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
    setIsListening(true);
    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [isSwReady, handleNewOrder, isListening]);

  return null;
}