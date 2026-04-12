const CACHE_NAME = 'iptv-pro-v2';
const STATIC_ASSETS = [
  './',
  './index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // No interceptar peticiones al Google Apps Script ni al proxy externo
  const url = event.request.url;
  if (url.includes('script.google.com') ||
      url.includes('anym3u8player.com') ||
      url.includes('live-evg7') ||
      url.includes('bitel.com') ||
      event.request.method !== 'GET') {
    return; // dejar pasar al navegador
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'IPTV Pro', body: 'Nueva notificacion' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'IPTV Pro', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    })
  );
});
