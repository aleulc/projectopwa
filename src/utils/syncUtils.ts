export const supportsBackgroundSync = (): boolean => {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
};

export const registerSyncWithFallback = async (tag: string): Promise<boolean> => {
  if (!supportsBackgroundSync()) {
    console.warn('Background Sync no está soportado en este navegador');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    return true;
  } catch (error) {
    console.error('Error registrando background sync:', error);
    return false;
  }
};