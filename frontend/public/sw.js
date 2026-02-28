const CACHE_NAME = 'lumina-pwa-v1';
const DYNAMIC_CACHE = 'lumina-dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only caching GET requests
    if (event.request.method !== 'GET') {
        // Explicitly bypass for POST, PUT, DELETE
        return;
    }

    // Bypass caching completely for any /api route that isn't /products
    if (event.request.url.includes('/api/') && !event.request.url.includes('/api/products')) {
        return;
    }

    if (event.request.url.includes('/api/products')) {
        // Network First strategy for API
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const resClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, resClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Cache First, fallback to network for other assets
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((fetchRes) => {
                    return caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request.url, fetchRes.clone());
                        return fetchRes;
                    });
                });
            })
        );
    }
});

self.addEventListener('push', (event) => {
    let data = { title: 'Notification', body: 'New update!' };
    if (event.data) {
        try {
            data = JSON.parse(event.data.text());
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        data: data.data || { url: '/' },
        vibrate: [100, 50, 100]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
