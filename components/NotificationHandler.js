import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../lib/firebaseClient';
import { requestNotificationPermission, listenToNewOrders } from '../utils/notifications';

export default function NotificationHandler() {
  useEffect(() => {
    // Request permission and initialize FCM
    const initNotifications = async () => {
      await requestNotificationPermission();

      // Set up order listener
      const unsubscribe = listenToNewOrders((order) => {
        // Show notification for new order
        if (Notification.permission === 'granted') {
          const notification = new Notification('New Order Received', {
            body: `Order #${order.id} has been placed for $${order.total}`,
            icon: '/icon-192x192.png'
          });
        }
      });

      // Handle foreground messages from FCM
      if (messaging) {
        onMessage(messaging, (payload) => {
          new Notification(payload.notification?.title || 'New Order', {
            body: payload.notification?.body,
            icon: '/icon-192x192.png'
          });
        });
      }

      // Cleanup listener on unmount
      return () => unsubscribe();
    };

    initNotifications();
  }, []);

  return null;
}
