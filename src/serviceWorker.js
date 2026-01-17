// This service worker enables offline functionality for the EV Charging Station Finder app
// It caches static assets and station data for offline use

const CACHE_NAME = 'ev-station-finder-v1';
const DATA_CACHE_NAME = 'ev-station-data-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/offline.html' // Fallback page when offline
];

// Install event - cache static assets
/* eslint-disable-next-line no-restricted-globals */
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching static files');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  /* eslint-disable-next-line no-restricted-globals */
  self.skipWaiting();
});

// Activate event - clean up old caches
/* eslint-disable-next-line no-restricted-globals */
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
          return Promise.resolve(); // Return a resolved Promise when no action is taken
        })
      );
    })
  );
  
  /* eslint-disable-next-line no-restricted-globals */
  self.clients.claim();
});

// Helper function to determine if a request is for API data
const isApiRequest = url => {
  return url.includes('/api/') || url.includes('/stations');
};

// Fetch event handler - network-first for API, cache-first for assets
/* eslint-disable-next-line no-restricted-globals */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // For API/data requests - use network first, fallback to cache
  if (isApiRequest(url.pathname)) {
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
            
            // If no cached data for this specific request, return general stations data if available
            return caches.match('/api/stations').then(generalData => {
              return generalData || new Response(
                JSON.stringify({ 
                  offline: true, 
                  message: 'No cached data available while offline' 
                }),
                { 
                  headers: { 'Content-Type': 'application/json' } 
                }
              );
            });
          });
        })
    );
  } 
  // For static assets - use cache first, fallback to network
  else {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(response => {
          // Cache the asset if not already cached
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        }).catch(() => {
          // For navigation requests when offline, serve the offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          
          return new Response('Offline content not available');
        });
      })
    );
  }
});

// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit https://bit.ly/CRA-PWA'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log(
                'New content is available and will be used when all ' +
                  'tabs for this page are closed. See https://bit.ly/CRA-PWA.'
              );

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
} 