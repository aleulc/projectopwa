import React, { useEffect, useState } from "react";

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga inicial (ej: fetch inicial, assets, etc.)
    const timer = setTimeout(() => {
      setLoading(false);
      const splash = document.getElementById("splash-screen");
      if (splash) splash.style.display = "none";
    }, 2000); // 2s de splash

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>EcoTravel</h1>
      </header>

      <main className="app-content">
        <HomeScreen />
      </main>

      <footer className="app-footer">
        <p>© 2025 EcoTravel</p>
      </footer>
    </div>
  );
};

const HomeScreen: React.FC = () => (
  <section>
    <h2>Bienvenido a EcoTravel </h2>
    <p>Explora experiencias de turismo sostenible.</p>
  </section>
);

export default App;
