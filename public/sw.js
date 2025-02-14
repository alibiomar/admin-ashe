self.addEventListener('message', (event) => {
  if (event.data.type === 'TRIGGER_NOTIFICATION') {
    self.registration.showNotification(event.data.title, event.data.options);
  }
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/notif.png',
    badge: '/badge.png'
  };
  
  event.waitUntil(
    self.registration.showNotification('New Notification', options)
  );
});

