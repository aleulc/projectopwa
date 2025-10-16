import React, { useEffect, useState } from 'react';
import { getAllActivities } from '../db';
import type { Activity } from '../db';

const ActivityList: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const storedActivities = await getAllActivities();
        setActivities(storedActivities);
      } catch (error) {
        console.error('Error cargando actividades:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, []);

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      avistamiento: 'Avistamiento',
      senderismo: 'Senderismo',
      conservacion: 'Conservación',
      cultural: 'Cultural',
      otro: 'Otro'
    };
    return types[type] || type;
  };

  if (loading) {
    return <div className="activity-list">Cargando experiencias...</div>;
  }

  return (
    <div className="activity-list">
      <h3>Mis Experiencias Registradas</h3>
      {activities.length === 0 ? (
        <p>No hay experiencias guardadas</p>
      ) : (
        <div className="activities-grid">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-card">
              <div className="activity-header">
                <span className="activity-type">
                  {getTypeLabel(activity.type)}
                </span>
                <span className="activity-date">
                  {new Date(activity.date).toLocaleDateString()}
                </span>
              </div>
              <p className="activity-description">{activity.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityList;