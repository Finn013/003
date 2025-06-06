const CACHE_NAME = 'module-pwa-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Установка Service Worker и кэширование файлов
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                const fetchRequest = event.request.clone();
                return fetch(fetchRequest)
                    .then(networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    }).catch(() => {
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return new Response(
                                '<html><body><h1>Ошибка загрузки</h1><p>Невозможно загрузить ресурс в оффлайн-режиме.</p></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        }
                        return new Response('Ошибка загрузки ресурса');
                    });
            })
    );
});
