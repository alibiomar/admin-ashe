import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging, db } from '../lib/firebaseClient';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function NotificationHandler() {
  useEffect(() => {
    if (!messaging || !db) return; // Add safety check

    const initNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
          });
          
          localStorage.setItem('fcmToken', token);

          // Set up order listener
          const ordersRef = collection(db, 'orders');
          const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
          let lastOrderId = localStorage.getItem('lastOrderId');

          const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const order = { id: change.doc.id, ...change.doc.data() };
                
                if (!lastOrderId || order.createdAt > lastOrderId) {
                  lastOrderId = order.createdAt;
                  localStorage.setItem('lastOrderId', lastOrderId);
                  
                  new Notification('New Order Received', {
                    body: `Order #${order.id} has been placed for $${order.total}`,
                    icon: '/logo192.png'
                  });
                }
              }
            });
          });

          // Handle foreground messages
          onMessage(messaging, (payload) => {
            new Notification(payload.notification?.title || 'New Order', {
              body: payload.notification?.body,
              icon: '/logo192.png'
            });
          });

          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Notification setup error:', error);
      }
    };

    initNotifications();
  }, []);

  return null;
}