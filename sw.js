/* ============================================================================
   Service Worker — العمدة لإدارة المحل
   استراتيجية: Cache First للملفات الأساسية (App Shell) مع تحديث في الخلفية.
   ملاحظة: التطبيق نفسه (index.html) يحتوي كل الواجهة والمنطق، لذلك تخزين
   هذه الملفات القليلة كافٍ لعمل التطبيق بالكامل Offline. بيانات المحل نفسها
   محفوظة في IndexedDB على جهاز المستخدم، وهي منفصلة تمامًا عن هذا الكاش.
   ============================================================================ */
const CACHE_VERSION = 'alomda-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match('./index.html'));
      return cached || network;
    })
  );
});
