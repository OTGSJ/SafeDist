import React, { useState } from "react";
import { loginUser, registerUser } from "../../api/authApi";
import "./Login.css";

function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetFeedback();
    setPassword("");
    setConfirmPassword("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetFeedback();
    try {
      const data = await loginUser(name, password);
      setMessage(data.message);
      if (onLoginSuccess) onLoginSuccess(data.user);
    } catch (err) {
      setError(
        err.response?.data?.error ?? "Erro ao tentar conectar ao servidor."
      );
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetFeedback();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    try {
      const data = await registerUser(name, password);
      setMessage(`${data.message} Faça login para continuar.`);
      switchMode("login");
    } catch (err) {
      setError(
        err.response?.data?.error ?? "Erro ao tentar conectar ao servidor."
      );
    }
  };

  const isRegister = mode === "register";

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">
          {isRegister ? "Criar Conta — SafeDist" : "Login — SafeDist"}
        </h2>
        <p className="login-subtitle">
          {isRegister
            ? "Preencha os dados para criar sua conta"
            : "Acesse sua conta para continuar"}
        </p>

        {error && <p className="login-alert login-alert-error">{error}</p>}
        {message && (
          <p className="login-alert login-alert-success">{message}</p>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
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

          {isRegister && (
            <div className="login-input-group">
              <label className="login-label">Confirmar Senha:</label>
              <input
                className="login-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button className="login-button" type="submit">
            {isRegister ? "Cadastrar" : "Entrar"}
          </button>

          {!isRegister && (
            <button
              type="button"
              className="login-button login-button-secondary"
              onClick={() => switchMode("register")}
            >
              Registrar Conta
            </button>
          )}
        </form>

        <p className="login-toggle-text">
          {isRegister ? (
            <>
              Já tem uma conta?{" "}
              <span
                className="login-toggle-link"
                onClick={() => switchMode("login")}
              >
                Entrar
              </span>
            </>
          ) : (
            <>
              Ainda não tem conta?{" "}
              <span
                className="login-toggle-link"
                onClick={() => switchMode("register")}
              >
                Cadastre-se
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default Login;
