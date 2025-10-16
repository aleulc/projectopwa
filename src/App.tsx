import React, { useEffect, useState } from "react";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import ActivityForm from "./components/ActivityForm";
import ActivityList from "./components/ActivityList";
import "./App.css";

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      const splash = document.getElementById("splash-screen");
      if (splash) splash.style.display = "none";
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>EcoTravel</h1>
        {!isOnline && (
          <div className="offline-indicator">
            Modo sin conexión - Tus experiencias se guardarán localmente
          </div>
        )}
      </header>

      <main className="app-content">
        <HomeScreen />
      </main>

      <footer className="app-footer">
        <p>© 2025 EcoTravel - Turismo Sostenible</p>
      </footer>
    </div>
  );
};

const HomeScreen: React.FC = () => (
  <section className="home-screen">
    <div className="welcome-section">
      <h2>Bienvenido a EcoTravel</h2>
      <p>Explora experiencias de turismo sostenible y registra tus aventuras.</p>
    </div>
    
    <div className="activities-section">
      <div className="activities-container">
        <ActivityForm />
        <ActivityList />
      </div>
    </div>
  </section>
);

export default App;