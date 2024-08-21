import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import UploadJewelry from "./components/UploadJewelry";
import Profits from "./components/Profits";
import ProtectedRoute from "./components/ProtectedRoute"; // Ruta protegida
import { AuthProvider, useAuth } from "./context/AuthContext"; // Proveedor y hook de autenticación
import NavigationMenu from "./components/NavigationMenu"; // Componente de navegación

import "primereact/resources/themes/saga-blue/theme.css"; // Tema de PrimeReact
import "primereact/resources/primereact.min.css"; // Estilos de PrimeReact
import "primeicons/primeicons.css"; // Iconos de PrimeIcons
import "primeflex/primeflex.css"; // Utilidades de PrimeFlex

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
}

function MainApp() {
  const { currentUser } = useAuth(); // Obtenemos el usuario autenticado
  const location = useLocation(); // Obtenemos la ruta actual

  return (
    <>
      {/* Mostrar el menú de navegación solo si el usuario está autenticado y no estamos en la ruta de login */}
      {currentUser && location.pathname !== "/login" && <NavigationMenu />}

      {/* Contenedor principal para las rutas */}
      <div className="container mx-auto mt-6">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Ruta para el Login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <UploadJewelry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadJewelry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profits"
            element={
              <ProtectedRoute>
                <Profits />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
