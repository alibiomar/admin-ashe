// Listen for the 'install' event to install the service worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    // Skip waiting and activate the service worker immediately
    self.skipWaiting();
  });
  
  // Listen for the 'activate' event to activate the service worker
  self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(self.clients.claim()); // Take control of the clients immediately
  });
  
  // Listen for push notifications
  self.addEventListener('push', (event) => {
    let notificationData = {};
    try {
      // Parse the push data, if present
      notificationData = event.data ? event.data.json() : {};
    } catch (error) {
      console.error("Error parsing push notification data:", error);
    }
  
    const title = notificationData.title || 'New Notification';
    const body = notificationData.body || 'You have a new message!';
    const icon = notificationData.icon || '/notif.jpg'; // Default icon
  
    // Set up the options for the notification
    const options = {
      body: body,
      icon: icon,
      badge: '/notif.jpg', // Optional: badge icon for notification
      data: notificationData.data || {}, // Additional data to attach to the notification
    };
  
    // Show the notification to the user
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  // Listen for notification click events
  self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked', event);
  
    // Handle notification click event, open URL or focus on the app window
    event.notification.close(); // Close the notification
    event.waitUntil(
      clients.openWindow('/admin/orders') // Replace with your app's URL to open upon clicking
    );
  });
  
  // Optionally, handle push subscription events
  self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('Push subscription changed', event);
    // Handle subscription changes (e.g., re-subscribe if needed)
  });
  