/* Service worker Suneeday VGE. Versi diisi otomatis oleh build_index.py (= sidik halaman).
   Halaman: selalu ambil dari internet dulu (versi terbaru); salinan hanya dipakai saat offline.
   Data (Apps Script), rapor, chat, dan token TIDAK pernah disimpan di cache. */
var VERSI = 'eb5cb798';
var CACHE = 'vge-' + VERSI;
var SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'badge-72.png'];
var CDN = 'https://cdn.jsdelivr.net/npm/';

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL.map(function(u){ return new Request(u, { cache: 'reload' }); })); }).catch(function(){}).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k.indexOf('vge-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function offline(){
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Suneeday VGE</title>'
    + '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0E0F11;color:#F2F2F3;font-family:system-ui,sans-serif;text-align:center;padding:24px">'
    + '<div><h1 style="font-size:1.3rem">Tidak ada koneksi internet</h1><p style="color:#B4B5BB">Suneeday VGE butuh internet untuk memuat data.</p>'
    + '<p><a href="./" style="display:inline-block;padding:10px 18px;border-radius:12px;background:#D6C4A3;color:#17140F;text-decoration:none;font-weight:600">Coba lagi</a></p></div></body>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var scope = new URL(self.registration.scope);

  // halaman (termasuk link QR ?t=...): internet dulu, salinan terakhir saat offline
  if (req.mode === 'navigate' && url.origin === scope.origin) {
    e.respondWith(fetch(new Request(url.href, { cache: 'no-cache', credentials: 'same-origin' })).then(function(res){
      if (res && res.ok && url.pathname === scope.pathname) { var c = res.clone(); caches.open(CACHE).then(function(ca){ ca.put('./', c); }); }
      return res;
    }).catch(function(){
      return caches.open(CACHE).then(function(ca){ return ca.match('./'); }).then(function(r){ return r || offline(); });
    }));
    return;
  }
  // ikon & manifest: pakai salinan, perbarui di belakang
  if (url.origin === scope.origin && /\.(png|webmanifest)$/.test(url.pathname)) {
    e.respondWith(caches.open(CACHE).then(function(ca){
      return ca.match(req).then(function(hit){
        var net = fetch(req).then(function(res){ if (res && res.ok) ca.put(req, res.clone()); return res; });
        return hit || net;
      });
    }));
    return;
  }
  // library jsDelivr (versi terkunci + SRI): simpan setelah pertama diunduh
  if (req.url.indexOf(CDN) === 0) {
    e.respondWith(caches.open(CACHE).then(function(ca){
      return ca.match(req).then(function(hit){ return hit || fetch(req).then(function(res){ if (res && res.ok && res.type === 'cors') ca.put(req, res.clone()); return res; }); });
    }));
  }
  // selain itu (Apps Script, Google Fonts, Drive, YouTube): langsung ke internet, tanpa cache
});

self.addEventListener('push', function(e){
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Suneeday VGE', {
    body: d.body || 'Ada info baru di Suneeday VGE.', tag: d.tag || 'vge', renotify: true,
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
