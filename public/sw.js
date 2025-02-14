// public/sw.js
const CACHE_NAME = 'admin-dashboard-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/notif.png',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.error('Cache installation failed:', err))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle notification clicks for PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Try to find an open PWA window
      for (const client of clientList) {
        // Check if we have an open window/tab
        if ('focus' in client) {
          return client.focus();
        }
      }
      
      // If no open window found, open the PWA
      return self.clients.openWindow('/');
    })
  );
});

// Handle messages from the client (web app)
self.addEventListener("message", (event) => {
  if (event.data.type === "TRIGGER_NOTIFICATION") {
    const { title, options } = event.data;

    // Ensure notifications are shown correctly
    self.registration.showNotification(title, {
      ...options,
      requireInteraction: true, // Keeps notification visible until user interacts
      renotify: true, // Avoids duplicate stacking in some cases
      badge: "/notif.png",
      icon: "/notif.png",
    }).catch(err => console.error("Error showing notification:", err));
  }
});

// Fetch event with offline support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Add to cache
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});