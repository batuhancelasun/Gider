const CACHE_NAME = 'gider-v12';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/recurring.html',
  '/table.html',
  '/analytics.html',
  '/settings.html',
  '/items.html',
  '/styles.css',
  '/app.js',
  '/core.js',
  '/auth.js',
  '/router.js',
  '/dashboard.js',
  '/icons.js',
  '/table.js',
  '/analytics.js',
  '/recurring.js',
  '/settings.js',
  '/items.js',
  '/logo.png',
  '/manifest.json',
  '/views/auth.js',
  '/views/dashboard.js',
  '/views/recurring.js',
  '/views/analytics.js',
  '/views/transactions.js',
  '/views/settings.js',
  '/views/items.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // 1. API Requests: Network Only (or Network First)
  // We want real-time data, so Network Only is safest for data consistency.
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Navigation Requests (HTML): Network First, fallback to Cache (App Shell)
  // If offline, serve index.html for any navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. JS and CSS files: Network First to ensure fresh code
  if (event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // 4. Other Static Assets: Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Cache new static assets dynamically (optional, but good for fonts/images)
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});
