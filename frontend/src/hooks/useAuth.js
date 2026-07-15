import { useState } from "react";

const STORAGE_KEY = "safedist_user";

const useAuth = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return { user, handleLoginSuccess, handleLogout };
};

export default useAuth;
