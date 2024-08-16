import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // Tus estilos personalizados

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
