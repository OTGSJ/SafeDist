import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login({ onLoginSuccess }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      // Envia os dados para o backend na porta 3001
      const response = await axios.post(
        "http://localhost:3001/api/users/login",
        {
          name,
          password,
        },
      );

      setMessage(response.data.message);

      // Se o login for bem-sucedido, passa os dados do utilizador para o componente pai
      if (onLoginSuccess) {
        onLoginSuccess(response.data.user);
      }
    } catch (err) {
      // Captura o erro do backend
      if (err.response && err.response.data) {
        setError(err.response.data.error);
      } else {
        setError("Erro ao tentar conectar ao servidor.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login - SafeDist</h2>
        <p className="login-subtitle">Acesse sua conta para continuar</p>

        {error && <p className="login-alert login-alert-error">{error}</p>}
        {message && (
          <p className="login-alert login-alert-success">{message}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label className="login-label">Nome:</label>
            <input
              className="login-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="login-input-group">
            <label className="login-label">Senha:</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="login-button" type="submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
