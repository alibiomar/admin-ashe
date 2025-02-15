import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../lib/firebaseClient';

const useFCM = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Request notification permission
      const requestPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });
            console.log('FCM Token:', token);
            // Send token to your backend
          }
        } catch (error) {
          console.error('Error getting permission:', error);
        }
      };

      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message:', payload);
        // Display notification
        if (payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon
          });
        }
      });

      // Initial permission check
      if (Notification.permission === 'default') {
        requestPermission();
      }
    }
  }, []);
};

export default useFCM;