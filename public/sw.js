const CACHE_NAME = 'admin-dashboard-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/notif.png',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json',
  '/styles.css'  // Added from your second install event
];

// In service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('my-cache').then(cache => {
      return cache.addAll(urlsToCache); // Your critical assets
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('Service Worker activated and controlling clients');
    })
  );
});
// Fetch event with improved error handling
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            // Wrap cache operations in event.waitUntil
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => console.error('Cache put failed:', err))
            );

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Optionally return a custom offline page
            // return caches.match('/offline.html');
          });
      })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/');
    })
    .catch(err => console.error('Error handling notification click:', err))
  );
});

// Message handler
self.addEventListener("message", (event) => {
  if (event.data?.type === "TRIGGER_NOTIFICATION") {
    const { title, options } = event.data;

    event.waitUntil(
      self.registration.showNotification(title, {
        ...options,
        requireInteraction: true,
        renotify: true,
        badge: "/notif.png",
        icon: "/notif.png",
      }).catch(err => console.error("Error showing notification:", err))
    );
  }
});
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png'
    })
  );
});