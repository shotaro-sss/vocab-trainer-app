const CACHE_NAME = 'vocab-trainer-v3';  // バージョンを上げると更新される

const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json',
  '/words.json',
  '/images/6h.png',
  '/images/12h.png',
  '/images/18h.png',
  '/images/24h.png',
  '/images/icon.png'
  // 必要に応じて他の画像・ファイルを追加
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // キャッシュがあれば返す
      if (response) return response;

      // なければネットワークから取得
      return fetch(event.request).catch(() => {
        // オフライン時のフォールバック（必要なら）
        if (event.request.url.includes('images/')) {
          return caches.match('/images/6h.png');
        }
      });
    })
  );
});