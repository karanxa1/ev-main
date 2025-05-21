// This service worker enables offline functionality for the EV Charging Station Finder app
// It caches static assets and station data for offline use

const CACHE_NAME = 'ev-station-finder-v1';
const DATA_CACHE_NAME = 'ev-station-data-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/js/main.chunk.js',
  '/static/js/vendors~main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/favicon.ico',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching static files');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('Service Worker: Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Helper function to determine if a request is for API data
const isApiRequest = url => {
  return url.includes('/api/') || 
         url.includes('/stations') || 
         url.includes('firestore.googleapis.com') ||
         url.includes('firebase');
};

// Helper to check if we're online
const isOnline = () => {
  return self.navigator && self.navigator.onLine;
};

// Fetch event handler - network-first for API, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // For API/data requests - use network first, fallback to cache
  if (isApiRequest(url.href)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the fresh data
          caches.open(DATA_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // When network fails, try to serve from cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Create a default fallback response for API requests
            return new Response(
              JSON.stringify({ 
                offline: true, 
                timestamp: new Date().toISOString(),
                message: 'You are currently offline. Some data may not be up to date.' 
              }),
              { 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
          });
        })
    );
  } 
  // For navigation requests (HTML pages)
  else if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline and navigating, show offline page
          return caches.match('/offline.html');
        })
    );
  } 
  // For all other requests (static assets) - use cache first, fallback to network
  else {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(response => {
          // Cache any successful responses that weren't in the cache
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        }).catch(error => {
          console.error('Fetch failed for asset:', error);
          
          // For image requests, return a fallback placeholder
          if (event.request.destination === 'image') {
            return caches.match('/images/offline-placeholder.png')
              .catch(() => new Response('Image unavailable', { status: 404 }));
          }
          
          return new Response('Network error', { status: 408 });
        });
      })
    );
  }
});

// Listen for messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 