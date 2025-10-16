import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Activity {
  id?: number;
  description: string;
  date: string;
  type: string;
}

interface MyDB extends DBSchema {
  activities: {
    key: number;
    value: Activity;
    indexes: { 'by-date': string };
  };
}

const dbName = 'EcoTravelDB';
const storeName = 'activities';
const version = 3; // Incrementamos la versión

let dbInstance: IDBPDatabase<MyDB> | null = null;

const initDB = async (): Promise<IDBPDatabase<MyDB>> => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<MyDB>(dbName, version, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Actualizando BD de versión ${oldVersion} a ${newVersion}`);
        
        // Eliminar el store existente si hay problemas
        if (db.objectStoreNames.contains(storeName)) {
          db.deleteObjectStore(storeName);
        }
        
        // Crear el store nuevamente
        const store = db.createObjectStore(storeName, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-date', 'date');
        console.log('Almacén de actividades creado exitosamente');
      },
      blocked() {
        console.log('La base de datos está bloqueada por otra conexión');
      },
      blocking() {
        console.log('Esta conexión está bloqueando a otras');
      },
      terminated() {
        console.log('La conexión fue terminada inesperadamente');
      }
    });
    return dbInstance;
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    throw new Error(`No se pudo inicializar la base de datos: ${error}`);
  }
};

// Función para verificar si el store existe
export const checkStoreExists = async (): Promise<boolean> => {
  try {
    const db = await initDB();
    return db.objectStoreNames.contains(storeName);
  } catch (error) {
    console.error('Error verificando store:', error);
    return false;
  }
};

export const addActivity = async (activity: Omit<Activity, 'id'>): Promise<number> => {
  try {
    const db = await initDB();
    
    // Verificar que el store existe antes de usarlo
    if (!db.objectStoreNames.contains(storeName)) {
      throw new Error(`El almacén '${storeName}' no existe`);
    }
    
    const id = await db.add(storeName, activity);
    console.log('Actividad guardada con ID:', id);
    return id;
  } catch (error) {
    console.error('Error agregando actividad:', error);
    throw new Error(`No se pudo guardar la actividad: ${error}`);
  }
};

export const getAllActivities = async (): Promise<Activity[]> => {
  try {
    const db = await initDB();
    
    // Verificar que el store existe antes de usarlo
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`El almacén '${storeName}' no existe, retornando array vacío`);
      return [];
    }
    
    const activities = await db.getAll(storeName);
    console.log('Actividades obtenidas:', activities.length);
    return activities;
  } catch (error) {
    console.error('Error obteniendo actividades:', error);
    return []; // Retornar array vacío en lugar de error
  }
};

export const clearActivities = async (): Promise<void> => {
  try {
    const db = await initDB();
    if (db.objectStoreNames.contains(storeName)) {
      await db.clear(storeName);
      console.log('Todas las actividades eliminadas');
    }
  } catch (error) {
    console.error('Error limpiando actividades:', error);
    throw new Error(`No se pudieron limpiar las actividades: ${error}`);
  }
};

// Función para eliminar y recrear la base de datos
export const resetDatabase = async (): Promise<void> => {
  try {
    dbInstance?.close();
    dbInstance = null;
    indexedDB.deleteDatabase(dbName);
    console.log('Base de datos eliminada. Recarga la página.');
  } catch (error) {
    console.error('Error reseteando base de datos:', error);
  }
};