self.addEventListener("install", (event) => {
  console.log("Service Worker Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated.");
  event.waitUntil(clients.claim()); // Ensure service worker takes control of the page immediately
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/admin"));
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/logo192.png',
    badge: '/logo72.png'
  };

  event.waitUntil(
    self.registration.showNotification('ASHE™', options)
  );
});

self.addEventListener("message", (event) => {
  if (event.data.type === "TRIGGER_NOTIFICATION") {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
