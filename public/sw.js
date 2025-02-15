import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

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


const uniquePrecacheList = Array.from(
    new Map(combinedPrecacheList.map(item => [item.url, item])).values()
);

precacheAndRoute(uniquePrecacheList);

// Activate event with versioned cache cleanup
self.addEventListener('activate', event => {
    clients.claim();
    console.log('Service Worker activated and ready!');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => !cacheName.startsWith(CACHE_CONFIG.version))
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});

// Register routes with caching strategies
registerRoute(
    ({ request }) =>
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image',
    new StaleWhileRevalidate({
        cacheName: CACHE_CONFIG.staticCache
    })
);


// Fetch event handler with offline fallback
self.addEventListener('fetch', event => {
    const { request } = event;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match('/offline.html'))
        );
        return;
    }

    event.respondWith(fetch(request));
});

// Enhanced notification handling
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
                setTimeout(resolve, Math.pow(2, attempt) * NOTIFICATION_CONFIG.retryDelay)
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

// Message handler
self.addEventListener('message', event => {
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

// Notification click handler
self.addEventListener('notificationclick', event => {
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