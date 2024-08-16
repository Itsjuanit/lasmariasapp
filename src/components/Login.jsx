import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Asegúrate de que la configuración de Firebase esté importada correctamente
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reiniciar error antes de intentar iniciar sesión

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirige al dashboard después del inicio de sesión exitoso
      navigate("/dashboard");
    } catch (err) {
      setError(err.message); // Establecer el mensaje de error en caso de fallo
    }
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen bg-gray-100">
      <Card className="p-4 shadow-2 w-full md:w-6 lg:w-4">
        <h2 className="text-center text-2xl font-semibold mb-4">Iniciar Sesión</h2>

        {/* Mostrar mensaje de error en caso de fallo */}
        {error && <Message severity="error" text={error} className="mb-4" />}

        {/* Formulario de inicio de sesión */}
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

          {/* Botón de envío */}
          <Button label="Iniciar Sesión" icon="pi pi-sign-in" type="submit" className="w-full p-button-primary" />
        </form>
      </Card>
    </div>
  );
};

export default Login;
