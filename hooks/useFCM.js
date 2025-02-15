import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../lib/firebaseClient';

const useFCM = () => {
    useEffect(() => {
      if (
        typeof window === 'undefined' || 
        !messaging || 
        !('serviceWorker' in navigator)
      ) return;
  
      const initFCM = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });
            console.log('FCM Token:', token);
            // Send token to backend
          }
  
          // Handle foreground messages
          onMessage(messaging, (payload) => {
            console.log('Foreground message:', payload);
            if (payload.notification) {
              new Notification(payload.notification.title, {
                body: payload.notification.body,
                icon: payload.notification.icon
              });
            }
          });
        } catch (error) {
          console.error('FCM Error:', error);
        }
      };
  
      initFCM();
    }, []);
  };
  
  export default useFCM;