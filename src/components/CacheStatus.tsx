
import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const CacheStatus: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className="cache-status">
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? 'En línea' : 'Sin conexión'}
      </div>
      <div className="cache-info">
        {!isOnline && 'Usando recursos en cache'}
      </div>
    </div>
  );
};

export default CacheStatus;