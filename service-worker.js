const CACHE_NAME = 'module-pwa-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Установка Service Worker и кэширование файлов
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker
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

// Перехват запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэшированный ответ, если он есть
                if (response) {
                    return response;
                }

                // Копируем запрос, так как он может быть использован только один раз
                const fetchRequest = event.request.clone();

                // Пытаемся получить ресурс из сети
                return fetch(fetchRequest)
                    .then(response => {
                        // Проверяем валидность ответа
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Копируем ответ, так как он может быть использован только один раз
                        const responseToCache = response.clone();

                        // Добавляем ответ в кэш
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Если запрос не удался и это HTML-файл, возвращаем страницу с ошибкой
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return new Response(
                                '<html><body><h1>Ошибка загрузки</h1><p>Невозможно загрузить ресурс в автономном режиме.</p></body></html>',
                                {
                                    headers: { 'Content-Type': 'text/html' }
                                }
                            );
                        }
                        return new Response('Ошибка загрузки ресурса');
                    });
            })
    );
});