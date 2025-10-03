const CACHE_NAME = "ecotravel-cache-v1";

// Archivos que forman parte del App Shell
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/src/App.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Instalación del SW
self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalando...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cacheando assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activación del SW
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activado.");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Service Worker: Borrando cache antiguo:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// Estrategia de Cache First
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() =>
          // Opcional: mostrar fallback offline
          new Response(" Estás offline y el recurso no está en caché.")
        )
      );
    })
  );
});
