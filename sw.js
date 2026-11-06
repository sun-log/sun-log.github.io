/* Service worker Dashboard VGE — hanya untuk notifikasi HP. Tidak menyimpan cache halaman (selalu versi terbaru). */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function(e){
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Dashboard VGE', {
    body: d.body || 'Ada info baru di dashboard.', tag: d.tag || 'vge', renotify: true,
    icon: 'icon-192.png', badge: 'badge-72.png', data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href, q = new URL(url).searchParams;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (new URL(c.url).origin === self.location.origin && 'focus' in c) { c.postMessage({ ws: q.get('ws') || '', tab: q.get('tab') || '' }); return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
