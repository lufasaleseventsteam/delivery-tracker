// Lufa Delivery Service Worker
const CACHE_NAME = 'lufa-delivery-v1';
const ASSETS = [
  '/delivery-tracker/',
  '/delivery-tracker/index.html',
  '/delivery-tracker/logo_lufa_grand.jpeg',
  '/delivery-tracker/manifest.json'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  // Don't intercept Supabase or external API calls
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('openstreetmap') ||
      e.request.url.includes('nominatim') ||
      e.request.url.includes('unpkg.com') ||
      e.request.url.includes('jsdelivr.net')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || '🚛 Lufa Delivery', {
      body: data.body || '',
      icon: '/delivery-tracker/logo_lufa_grand.jpeg',
      badge: '/delivery-tracker/logo_lufa_grand.jpeg',
      tag: data.tag || 'lufa-notif',
      renotify: true
    })
  );
});

// Notification click — focus the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window'}).then(list => {
      for (const client of list) {
        if (client.url.includes('delivery-tracker') && 'focus' in client)
          return client.focus();
      }
      return clients.openWindow('/delivery-tracker/');
    })
  );
});
