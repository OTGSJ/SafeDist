import React from "react";
import useAuth from "./hooks/useAuth";
import Login from "./components/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";

const App = () => {
  const { user, handleLoginSuccess, handleLogout } = useAuth();

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
};

export default App;
