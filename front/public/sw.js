// Service worker mínimo: hace que Chrome ofrezca instalar Kinetix como app. No guarda nada en caché a propósito: la web
// cambia seguido (y los juegos usan la cámara y la API), así que siempre se pide a la red.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {}) // sin respuesta propia: el navegador resuelve el pedido como siempre
