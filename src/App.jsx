import React, { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage.jsx";
import MainLayout from "./components/MainLayout.jsx";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return <MainLayout user={user} onLogout={handleLogout} />;
}
