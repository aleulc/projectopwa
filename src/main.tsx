import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Registrar Service Worker con mejores prácticas
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registrado:', registration);
        
        // Verificar actualizaciones del SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Nueva versión del SW encontrada');
          
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nuevo contenido disponible
              if (confirm('¡Nueva versión disponible! ¿Recargar para actualizar?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.log('Error registrando SW:', error);
      });

    // Escuchar mensajes del Service Worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SYNC_SUCCESS') {
        console.log('Sincronización exitosa para entrada:', event.data.payload);
        // Puedes disparar una actualización de la UI aquí
      }
    });
  });

  // Manejar cuando el SW está listo para controlar la página
  navigator.serviceWorker.ready.then(() => {
    console.log('Service Worker listo para controlar la página');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)