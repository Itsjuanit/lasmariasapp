import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";

const Notification = ({ severity, message }) => {
  return <div className={`notification ${severity}`}>{message}</div>;
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const showNotification = (severity, message) => {
    Toast.current.show({ severity, summary: "Notificación", detail: message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showNotification("success", "¡Inicio de sesión exitoso! Redirigiendo...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      setErrorMessage("Credenciales incorrectas. Por favor, verifica tu email y contraseña.");
      showNotification("error", errorMessage);
    }
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen bg-gray-100">
      <Card className="p-4 shadow-2 w-full md:w-6 lg:w-4">
        <h2 className="text-center text-2xl font-semibold mb-4">Iniciar Sesión</h2>

        {errorMessage && <Notification severity="error" message={errorMessage} />}

        <form onSubmit={handleSubmit}>
          <div className="field mb-4">
            <label htmlFor="email" className="block text-gray-700">
              Email
            </label>
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-inputtext-sm"
              required
            />
          </div>
          <div className="field mb-4">
            <label htmlFor="password" className="block text-gray-700">
              Contraseña
            </label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              toggleMask
              feedback={false}
              className="w-full p-password-sm"
              required
            />
          </div>

          <Button label="Iniciar Sesión" icon="pi pi-sign-in" type="submit" className="w-full p-button-primary" />
        </form>
      </Card>
      <Toast ref={(el) => (Toast.current = el)} />
    </div>
  );
};

export default Login;
