const CACHE_NAME = 'conversio-media-cache-v1';
const MEDIA_HOSTS = ['contabostorage.com', 'usc1.contabostorage.com'];

// Helper to normalize S3 Signed URLs by removing time-limited signature parameters
function getCacheKey(url) {
  const urlObj = new URL(url);
  const isMediaHost = MEDIA_HOSTS.some(host => urlObj.hostname.includes(host));
  
  if (isMediaHost) {
    // Keep the origin and pathname, discard X-Amz parameters for cache matching
    return urlObj.origin + urlObj.pathname;
  }
  return url;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
  // Cleanup old caches if needed
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isMediaRequest = MEDIA_HOSTS.some(host => url.hostname.includes(host));

  if (isMediaRequest && request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cacheKey = getCacheKey(request.url);
        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          // Serve from cache but optionally refresh in background (Stale-While-Revalidate)
          return cachedResponse;
        }

        // Not in cache, fetch from network
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            // Clone and put in cache using the normalized key
            cache.put(cacheKey, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.error('[SW] Fetch failed:', error);
          throw error;
        }
      })
    );
  }
});
