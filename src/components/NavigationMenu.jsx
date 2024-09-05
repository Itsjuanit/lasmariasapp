// src/components/NavigationMenu.jsx
import React from "react";
import { Menubar } from "primereact/menubar";
import { useNavigate } from "react-router-dom";

const NavigationMenu = () => {
  const navigate = useNavigate();

  const items = [
    {
      label: "Dashboard",
      icon: "pi pi-fw pi-home",
      command: () => {
        navigate("/dashboard");
      },
    },
    {
      label: "Agregar Joya",
      icon: "pi pi-fw pi-plus",
      command: () => {
        navigate("/upload");
      },
    },
    {
      label: "Ventas",
      icon: "pi pi-fw pi-credit-card",
      command: () => {
        navigate("/sales");
      },
    },
    {
      label: "Ganancias",
      icon: "pi pi-fw pi-chart-line",
      command: () => {
        navigate("/profits");
      },
    },
    {
      label: "Cerrar Sesión",
      icon: "pi pi-fw pi-sign-out",
      command: () => {
        navigate("/login");
      },
    },
  ];

  return <Menubar model={items} />;
};

export default NavigationMenu;
