// sw.js (Enhanced Service Worker)
import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Take immediate control of the page
clientsClaim();

// Precaching configuration
precacheAndRoute(self.__WB_MANIFEST || []);
precacheAndRoute([
  { url: '/icons/order.png', revision: '1' }
]);

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window' });
      if (clients.length > 0) {
        clients[0].postMessage({
          type: 'NEW_PUSH_NOTIFICATION',
          payload: event.data.json()
        });
      }
      return self.registration.showNotification(event.data.title, event.data.options);
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});