'use client';

import { useEffect } from 'react';
import { onMessage, getToken } from 'firebase/messaging';
import { messaging, db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function NotificationHandler() {
  useEffect(() => {
    // Monitor auth state
    if (auth) {
      const unsubAuth = onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
      });

      return () => unsubAuth();
    }

    const initNotifications = async () => {
      if (!messaging || !db) {
        console.log('Messaging or DB not available');
        return;
      }

      try {
        if (!('Notification' in window)) {
          console.log('Notifications not supported');
          return;
        }

        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        
        if (permission === 'granted') {
          try {
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });
            console.log('FCM Token:', token);
            
            localStorage.setItem('fcmToken', token);
          } catch (tokenError) {
            console.error('Error getting token:', tokenError);
          }

          // Set up order listener
          const ordersRef = collection(db, 'orders');
          const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
          
          const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            console.log('Received snapshot');
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const order = { id: change.doc.id, ...change.doc.data() };
                console.log('New order:', order);
                
                if (Notification.permission === 'granted') {
                  new Notification('New Order Received', {
                    body: `Order #${order.id} has been placed`,
                    icon: '/icon-192x192.png'
                  });
                }
              }
            });
          }, (error) => {
            console.error('Snapshot listener error:', error);
          });

          // Handle foreground messages
          onMessage(messaging, (payload) => {
            console.log('Received foreground message:', payload);
            new Notification(payload.notification?.title || 'New Order', {
              body: payload.notification?.body,
              icon: '/icon-192x192.png'
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