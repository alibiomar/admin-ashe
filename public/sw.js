import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';

// Take immediate control of the page
clientsClaim();

// Cache configuration
const CACHE_CONFIG = {
  version: 'v1',
  staticCache: 'admin-dashboard-static-v1',
  dynamicCache: 'admin-dashboard-dynamic-v1',
  apiCache: 'admin-dashboard-api-v1',
  precacheList: [
    '/',
    '/index.html',
    '/notif.png',
    '/logo192.png',
    '/logo512.png',
    '/manifest.json',
    '/styles.css',
    '/offline.html'
  ]
};

// Notification configuration
const NOTIFICATION_CONFIG = {
  defaultIcon: '/notif.png',
  defaultBadge: '/logo192.png',
  defaultVibration: [200, 100, 200],
  maxRetries: 3,
  retryDelay: 2000
};

// Enhanced precaching
precacheAndRoute(self.__WB_MANIFEST || []);
precacheAndRoute(
  CACHE_CONFIG.precacheList.map(url => ({
    url,
    revision: CACHE_CONFIG.version
  }))
);

// Install event with improved error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open('my-cache').then((cache) => {
      return cache.addAll(CACHE_CONFIG.precacheList);  // List the assets you want to cache
    })
  );
});


// Activate event with versioned cache cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.map(key => {
            if (!Object.values(CACHE_CONFIG).includes(key)) {
              return caches.delete(key);
            }
          })
        );
        await self.clients.claim();
        
        // Notify all clients that the SW is ready
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_READY',
            timestamp: Date.now()
          });
        });
        
        console.log('🔄 Service Worker activated and caches cleaned');
      } catch (error) {
        console.error('❌ Service Worker activation failed:', error);
        throw error;
      }
    })()
  );
});

// Enhanced notification handling with retries and confirmation
const showNotificationWithRetry = async (title, options, source, attempt = 1) => {
  try {
    await self.registration.showNotification(title, {
      ...options,
      icon: options.icon || NOTIFICATION_CONFIG.defaultIcon,
      badge: options.badge || NOTIFICATION_CONFIG.defaultBadge,
      vibrate: options.vibrate || NOTIFICATION_CONFIG.defaultVibration,
      timestamp: Date.now(),
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      ...options
    });

    // Confirm successful notification
    if (source) {
      source.postMessage({
        type: 'NOTIFICATION_CONFIRMED',
        success: true,
        notificationId: options.tag,
        timestamp: Date.now()
      });
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Notification attempt ${attempt} failed:`, error);
    
    if (attempt < NOTIFICATION_CONFIG.maxRetries) {
      await new Promise(resolve => 
        setTimeout(resolve, NOTIFICATION_CONFIG.retryDelay * attempt)
      );
      return showNotificationWithRetry(title, options, source, attempt + 1);
    }
    
    if (source) {
      source.postMessage({
        type: 'NOTIFICATION_FAILED',
        error: error.message,
        notificationId: options.tag,
        timestamp: Date.now()
      });
    }
    
    throw error;
  }
};

// Enhanced message handler with async/await and error handling
self.addEventListener('message', (event) => {
  const { type, title, options } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'SW_STATUS_CHECK') {
    event.source.postMessage({
      type: 'SW_STATUS',
      isActive: true,
      timestamp: Date.now()
    });
    return;
  }

  if (type === 'TRIGGER_NOTIFICATION') {
    event.waitUntil(
      (async () => {
        try {
          await showNotificationWithRetry(title, options, event.source);
        } catch (error) {
          console.error('❌ Final notification attempt failed:', error);
        }
      })()
    );
  }
});

// Enhanced notification click handler with error handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    (async () => {
      try {
        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        if (windowClients.length > 0) {
          const client = windowClients[0];
          await client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: event.action,
            notificationId: event.notification.tag,
            timestamp: Date.now()
          });
        } else {
          await self.clients.openWindow(event.notification.data?.url || '/');
        }
      } catch (error) {
        console.error('❌ Error handling notification click:', error);
      }
    })()
  );
});


registerRoute(
  ({request}) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: CACHE_CONFIG.staticCache
  })
);

// Offline fallback remains the same
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});