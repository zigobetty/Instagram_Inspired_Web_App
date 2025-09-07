import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";


const AuthContext = createContext({
  
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const isAuthenticated = Boolean(token);
  const logoutTimerRef = useRef(null);
  const navigate = useNavigate();


  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      scheduleLogout(storedToken);
    }
  }, []);

  const scheduleLogout = (authToken) => {
    try {
      const decoded = jwtDecode(authToken);
      if (decoded.exp) {
        const expiry = decoded.exp * 1000; 
        const timeout = expiry - Date.now();

        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }

        if (timeout > 0) {
          logoutTimerRef.current = setTimeout(() => {
            console.log("token istekao, automatski logout");
            logout();
          }, timeout);
        } else {
          logout(); // Token je već istekao
        }
      }
    } catch (err) {
      console.error("Greška pri dekodiranju tokena:", err);
      logout();
    }
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("authToken", authToken);
    scheduleLogout(authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
  
    navigate("/login"); // ✅ automatski redirect
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
