// components/CollectionListener.js
import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';

export default function CollectionListener() {
  const [isListening, setIsListening] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // Retry count for Firestore listener

  const handleNewOrder = useCallback(async (orderData) => {
    try {
      await sendNotification({
        title: 'New order received!',
        body: `Order ID: ${orderData.id}`,
        data: { orderId: orderData.id },
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
