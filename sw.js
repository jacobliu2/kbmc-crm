/* KBMC CRM 서비스워커 — 알림 표시·클릭 처리 + 서버 푸시 수신
 * index.html 이 /sw.js 로 등록한다. 배포 위치: 저장소 루트 (index.html 옆) */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

/* 서버 푸시 수신 (탭이 닫혀 있어도 도착) */
self.addEventListener('push', function(e){
  var data = {};
  try{ data = e.data ? e.data.json() : {}; }catch(err){ data = { title:'KBMC CRM', body: e.data ? e.data.text() : '' }; }
  var title = data.title || 'KBMC CRM 알림';
  var opts = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || ('kbmc-' + Date.now()),
    data: { url: data.url || '/' }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

/* 알림 클릭 → 열린 CRM 탭으로 복귀, 없으면 새로 연다 */
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for (var i=0;i<list.length;i++){
        if ('focus' in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
