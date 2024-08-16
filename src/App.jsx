import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import UploadJewelry from "./components/UploadJewelry";
import Profits from "./components/Profits";
import ProtectedRoute from "./components/ProtectedRoute"; // Ruta protegida
import { AuthProvider } from "./context/AuthContext"; // Proveedor de autenticación
import { AppBar, Toolbar, Typography, Button, Container, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
    background: { default: "#f5f5f5" },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppBar>
            <Container>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Inventario de Joyas
                </Typography>
                <Button
                  color="inherit"
                  component={Link}
                  to="/dashboard"
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      color: "#fff",
                    },
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/upload"
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      color: "#fff",
                    },
                  }}
                >
                  Agregar Joya
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/profits"
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      color: "#fff",
                    },
                  }}
                >
                  Ganancias
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      color: "#fff",
                    },
                  }}
                >
                  Cerrar Sesión
                </Button>
              </Toolbar>
            </Container>
          </AppBar>

          <Container style={{ marginTop: "100px" }}>
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
          </Container>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
