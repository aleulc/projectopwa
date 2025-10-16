import React, { useState, useEffect } from 'react';
import { addActivity, checkStoreExists, resetDatabase } from '../db';

const ActivityForm: React.FC = () => {
  const [description, setDescription] = useState('');
  const [type, setType] = useState('avistamiento');
  const [storeReady, setStoreReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const verifyStore = async () => {
      const exists = await checkStoreExists();
      setStoreReady(exists);
      if (!exists) {
        console.warn('El almacén no está listo. Es posible que necesites resetear la base de datos.');
      }
    };
    verifyStore();

    // Escuchar cambios de conexión
    const handleOnline = () => {
      console.log('Conexión recuperada');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log('Sin conexión');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Escuchar mensajes del service worker sobre sincronización
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'sync-completed') {
          const { successful, failed } = event.data.data;
          if (successful > 0) {
            console.log(`${successful} experiencias sincronizadas con el servidor`);
            // No mostramos alerta aquí para no interrumpir al usuario
          }
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función para registrar background sync
  const registerBackgroundSync = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator && 'SyncManager' in window)) {
      console.warn('Background Sync no soportado en este navegador');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-entries');
      console.log('Sincronización registrada para cuando haya conexión');
      return true;
    } catch (error) {
      console.error('Error registrando background sync:', error);
      return false;
    }
  };

  // Función para forzar sincronización manual
  const forceSync = async () => {
    if (!isOnline) {
      alert('Necesitas conexión a internet para forzar la sincronización');
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // Enviar mensaje al service worker para forzar sync
        registration.active?.postMessage({
          type: 'FORCE_SYNC'
        });
        alert('Sincronización forzada iniciada');
      }
    } catch (error) {
      console.error('Error forzando sincronización:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (!storeReady) {
      alert('La base de datos no está lista. Intenta recargar la página o usar el botón de reset.');
      return;
    }

    const activity = {
      description,
      type,
      date: new Date().toISOString(),
    };

    try {
      await addActivity(activity);
      setDescription('');
      
      if (isOnline) {
        // Si está online, intentar enviar inmediatamente al servidor
        try {
          await fetch('https://tu-api.com/experiences', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(activity),
          });
          alert('Experiencia guardada y enviada al servidor');
        } catch (serverError) {
          console.error('Error enviando al servidor, pero guardada localmente:', serverError);
          // Si falla el servidor, registrar sync para reintento posterior
          await registerBackgroundSync();
          alert('Experiencia guardada localmente. Se intentará enviar después.');
        }
      } else {
        // Si está offline, registrar sync automáticamente
        const syncRegistered = await registerBackgroundSync();
        if (syncRegistered) {
          alert('📱 Experiencia guardada localmente. Se enviará automáticamente cuando recuperes la conexión.');
        } else {
          alert('📱 Experiencia guardada localmente. Se enviará cuando recuperes la conexión.');
        }
      }

      // Recargar la página para mostrar la nueva actividad (manteniendo tu comportamiento actual)
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error completo al guardar la experiencia:', error);
      alert(`Error al guardar la experiencia: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleResetDB = async () => {
    if (confirm('¿Estás seguro de que quieres resetear la base de datos? Se perderán todos los datos.')) {
      await resetDatabase();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="activity-form">
      <h3>Registra tu Experiencia EcoTravel</h3>
      
      {/* Indicador de estado de conexión */}
      <div style={{ 
        background: isOnline ? '#d4edda' : '#fff3cd', 
        color: isOnline ? '#155724' : '#856404', 
        padding: '8px 12px', 
        borderRadius: '4px',
        marginBottom: '15px',
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {isOnline ? 'Conectado' : 'Sin conexión'}
        </span>
        {!isOnline && (
          <button 
            type="button"
            onClick={() => alert('Tus experiencias se guardarán localmente y se enviarán automáticamente cuando recuperes la conexión.')}
            style={{
              background: 'transparent',
              border: '1px solid #856404',
              color: '#856404',
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ¿Cómo funciona?
          </button>
        )}
      </div>
      
      {!storeReady && (
        <div style={{ 
          background: '#fff3cd', 
          color: '#856404', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          La base de datos necesita configuración. 
          <button 
            type="button" 
            onClick={handleResetDB}
            style={{
              marginLeft: '10px',
              background: '#856404',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Resetear BD
          </button>
        </div>
      )}
      
      <div>
        <select 
          value={type} 
          onChange={(e) => setType(e.target.value)}
          className="form-select"
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="avistamiento">Avistamiento de Fauna</option>
          <option value="senderismo">Senderismo</option>
          <option value="conservacion">Actividad de Conservación</option>
          <option value="cultural">Experiencia Cultural</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe tu experiencia sostenible..."
          rows={4}
          className="form-textarea"
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit'
          }}
        />
      </div>
      <button 
        type="submit" 
        className="form-button"
        disabled={!storeReady}
        style={{
          width: '100%',
          padding: '10px',
          background: storeReady ? (isOnline ? '#28a745' : '#ffc107') : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: storeReady ? 'pointer' : 'not-allowed',
          fontSize: '16px',
          marginBottom: '10px'
        }}
      >
        {!storeReady 
          ? 'Base de datos no disponible' 
          : isOnline 
            ? 'Guardar Experiencia' 
            : 'Guardar Localmente'
        }
      </button>

      {/* Botón para forzar sincronización manual */}
      {isOnline && (
        <button 
          type="button"
          onClick={forceSync}
          style={{
            width: '100%',
            padding: '8px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
        Forzar Sincronización
        </button>
      )}
    </form>
  );
};

export default ActivityForm;