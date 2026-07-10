// Minimaler Service Worker: macht die App installierbar ("App installieren" im Browser-Menü).
// Bewusst KEIN Caching (network-only) – die Single-File-App soll immer frisch laden.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
