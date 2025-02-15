import { messaging, db } from '../lib/firebase';
import { getToken } from 'firebase/messaging';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export async function requestNotificationPermission() {
  try {
    if (!messaging) return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      
      // Save token to localStorage for demo purposes
      // In production, you might want to save this to your database
      localStorage.setItem('fcmToken', token);
      return token;
    }
  } catch (error) {
    console.error('Notification permission error:', error);
  }
}

export function listenToNewOrders(callback) {
  const ordersRef = collection(db, 'orders');
  const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));

  // Store the last document ID to track new orders
  let lastOrderId = localStorage.getItem('lastOrderId');

  return onSnapshot(ordersQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const order = { id: change.doc.id, ...change.doc.data() };
        
        // Only trigger for new orders
        if (!lastOrderId || order.createdAt > lastOrderId) {
          lastOrderId = order.createdAt;
          localStorage.setItem('lastOrderId', lastOrderId);
          
          // Call the callback with the new order
          callback(order);
        }
      }
    });
  });
}