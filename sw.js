var CACHE_NAME = 'vocab-trainer-cache-v1';

var urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

// var CACHE_NAME = 'vocab-trainer-app-caches';
// var urlsToCache = [
// 	'/vocab-trainer-app/',
// ];

// // インストール処理
// self.addEventListener('install', function(event) {
// 	event.waitUntil(
// 		caches
// 			.open(CACHE_NAME)
// 			.then(function(cache) {
// 				return cache.addAll(urlsToCache);
// 			})
// 	);
// });

// self.addEventListener('fetch', function(event) {
// 	event.respondWith(
// 		caches
// 			.match(event.request)
// 			.then(function(response) {
// 				return response ? response : fetch(event.request);
// 			})
// 	);
// });
