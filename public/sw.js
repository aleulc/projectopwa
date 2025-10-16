// sw.js

const CACHE_NAMES = {
  static: 'static-v1',
  dynamic: 'dynamic-v1',
  images: 'images-v1',
  api: 'api-v1'
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/offline.html',
  '/manifest.json'
];

const OFFLINE_PAGE = '/offline.html';

// Instalación - Cache de recursos estáticos
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando');
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then(cache => {
        console.log('Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación - Limpiar caches antiguos
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategias de Caching
const cachingStrategies = {
  // Cache First para App Shell
  cacheFirst: async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAMES.static);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      // Si es una ruta de navegación y falla, servir offline page
      if (request.mode === 'navigate') {
        return caches.match(OFFLINE_PAGE);
      }
      throw error;
    }
  },

  // Stale-While-Revalidate para imágenes
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(CACHE_NAMES.images);
    const cachedResponse = await caches.match(request);
    
    // Devolver respuesta cacheada inmediatamente
    if (cachedResponse) {
      // Actualizar cache en segundo plano
      fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
          await cache.put(request, networkResponse);
        }
      }).catch(() => {}); // Silenciar errores de actualización
      return cachedResponse;
    }

    // Si no está en cache, hacer petición normal
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  },

  // Network First para datos de API
  networkFirst: async (request) => {
    const cache = await caches.open(CACHE_NAMES.api);
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Para rutas de API específicas, podrías devolver datos por defecto
      if (request.url.includes('/api/entries')) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      throw error;
    }
  }
};

// Interceptar fetch events
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Determinar estrategia basada en el tipo de recurso
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    // App Shell - Cache First
    event.respondWith(cachingStrategies.cacheFirst(request));
  } else if (request.destination === 'image' || url.pathname.match(/\.(jpg|png|gif|webp|svg)$/)) {
    // Imágenes - Stale-While-Revalidate
    event.respondWith(cachingStrategies.staleWhileRevalidate(request));
  } else if (url.pathname.startsWith('/api/')) {
    // APIs - Network First
    event.respondWith(cachingStrategies.networkFirst(request));
  } else if (request.mode === 'navigate') {
    // Navegación - Cache First con fallback a offline page
    event.respondWith(
      cachingStrategies.cacheFirst(request).catch(() => caches.match(OFFLINE_PAGE))
    );
  } else {
    // Por defecto - Network First
    event.respondWith(cachingStrategies.networkFirst(request));
  }
});

// Background Sync (manteniendo la funcionalidad anterior)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-entries') {
    console.log('Sincronizando entradas pendientes...');
    event.waitUntil(syncPendingEntries());
  }
});

async function syncPendingEntries() {
  try {
    const pendingEntries = await getPendingEntries();
    
    if (pendingEntries.length === 0) {
      console.log('No hay entradas pendientes para sincronizar');
      return;
    }

    for (const entry of pendingEntries) {
      try {
        const response = await fetch('https://tu-api.com/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });

        if (response.ok) {
          await deleteEntryFromDB(entry.id);
          console.log(`Entrada ${entry.id} sincronizada exitosamente`);
          
          // Notificar a los clientes sobre la sincronización exitosa
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                payload: entry.id
              });
            });
          });
        }
      } catch (error) {
        console.error(`Error sincronizando entrada ${entry.id}:`, error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error en syncPendingEntries:', error);
    throw error;
  }
}

// Funciones auxiliares para IndexedDB (mantenidas)
async function getPendingEntries() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ActivitiesDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['activities'], 'readonly');
      const store = transaction.objectStore('activities');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function deleteEntryFromDB(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ActivitiesDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['activities'], 'readwrite');
      const store = transaction.objectStore('activities');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}