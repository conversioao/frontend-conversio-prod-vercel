const CACHE_VERSION = 'conversio-v1';
const PRECACHE = [
  '/', 
  '/manifest.json', 
  '/favicon_oficial.png',
  '/logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  // Do not cache API calls
  if (e.request.url.includes('/api/')) return; 
  
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // If successful, clone and cache it
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request)
        .then(cached => cached || (e.request.mode === 'navigate' ? caches.match('/') : null))
      )
  );
});
