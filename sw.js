const CACHE_NAME = 'vocab-trainer-v4';  // バージョンを上げると更新される

const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.json',
  './words.json',
  './characters.json',

  './images/6h.png',
  './images/12h.png',
  './images/18h.png',
  './images/24h.png',
  './images/complete.png',
  './images/icon.png',

  './sounds/correct.mp3',
  './sounds/wrong.mp3',
  './sounds/complete.mp3',
  './sounds/gacha.mp3',

  './images/characters/r1.png',
  './images/characters/r2.png',
  './images/characters/r3.png',
  './images/characters/r4.png',
  './images/characters/r5.png',

  './images/characters/s1.png',
  './images/characters/s2.png',
  './images/characters/s3.png',
  './images/characters/s4.png',
  './images/characters/s5.png',
  './images/characters/s6.png',

  './images/characters/h1.png',
  './images/characters/h2.png',
  './images/characters/h3.png',
  './images/characters/h4.png',
  './images/characters/h5.png',


  './images/characters/u1.png',
  './images/characters/u2.png',
  './images/characters/u3.png',
  './images/characters/u4.png',
  './images/characters/u5.png',

  './images/characters/l1.png',
  './images/characters/l2.png',
  './images/characters/l3.png',
  './images/characters/l4.png',
  './images/characters/l5.png'
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