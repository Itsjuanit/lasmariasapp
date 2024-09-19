# LasMariasApp

LasMariasApp es una aplicación para la gestión de stock y ventas, diseñada tanto para dispositivos móviles como para escritorio. Utiliza tecnologías modernas como **React**, **Vite**, **PrimeReact** y **Firebase** para ofrecer una experiencia rápida, intuitiva y segura.

## Características

- **Gestión de stock**: Controla el inventario de productos de manera eficiente.
- **Gestión de ventas**: Administra las ventas y realiza un seguimiento de los pagos de manera detallada.
- **Autenticación segura**: Implementada con Firebase Authentication para gestionar los accesos de usuarios.
- **Mobile-friendly**: Diseñada con un enfoque **responsive** para adaptarse a dispositivos móviles.
- **Navegación optimizada**: Utiliza **React Router DOM** para una navegación rápida y eficiente.
- **Gestión de estado global**: Implementada con **Context API** para el manejo centralizado del estado.
- **Componentes UI**: Potenciada por **PrimeReact** para una interfaz de usuario rica y fácil de usar.
- **Subida de imágenes**: Integrada con **Firebase Storage** para gestionar las imágenes de los productos.

## Tecnologías utilizadas

- [Vite](https://vitejs.dev/): Herramienta de construcción rápida y ligera.
- [React](https://reactjs.org/): Librería para construir interfaces de usuario.
- [React Router DOM](https://reactrouter.com/): Manejo de rutas en la aplicación.
- [Context API](https://reactjs.org/docs/context.html): Para la gestión global del estado.
- [PrimeReact](https://www.primefaces.org/primereact/): Componentes UI avanzados.
- [Firebase](https://firebase.google.com/): Backend para autenticación, base de datos (Firestore) y almacenamiento de imágenes (Firebase Storage).

## Requisitos

Para correr la aplicación localmente, necesitas tener instalado:

- Node.js (>= 14.x)
- npm o Yarn

## Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tu-usuario/lasmariasapp.git

├── public/                  # Archivos estáticos
├── src/
│   ├── components/          # Componentes React
│   ├── context/             # Context API para gestión de estado
│   ├── pages/               # Vistas principales de la aplicación
│   ├── firebaseConfig.js    # Configuración de Firebase
│   └── App.jsx              # Componente principal de la aplicación
├── .eslintrc.js             # Configuración de ESLint
├── package.json             # Dependencias y scripts
└── README.md                # Este archivo
