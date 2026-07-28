/* KBMC CRM Service Worker
   원칙: 캐싱하지 않는다. index.html 이 수시로 배포되므로 캐시는 구버전 고착 사고를 만든다.
   목적은 (1) serviceWorker.ready 확보 (2) 웹푸시 수신 두 가지뿐이다. */
const SW_VERSION = '2026-07-28.1';

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // 과거 버전이 남긴 캐시가 있으면 전부 제거 (구버전 고착 방지)
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (_) {}
    await self.clients.claim();
  })());
});

// 네트워크 그대로 통과 (PWA 설치 요건 충족용 최소 핸들러)
self.addEventListener('fetch', (e) => { return; });

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (_) { try { d = { body: e.data.text() }; } catch (__) { d = {}; } }

  const title = d.title || 'KBMC CRM';
  const opts = {
    body: d.body || d.message || '새 알림이 있습니다',
    icon: d.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: d.tag || 'kbmc-' + Date.now(),
    renotify: true,
    requireInteraction: false,
    data: { url: d.url || '/' }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
        try { await c.focus(); if (url !== '/') c.navigate(url); } catch (_) {}
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
