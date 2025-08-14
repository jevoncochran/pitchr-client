import { useState } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [token, setToken] = useState<string | null>(
    storedToken ? JSON.parse(storedToken) : null
  );

  const login = (userData: unknown, token: string) => {
    console.log("THE LOGIN FN FROM AUTH CONTEXT IS RUNNING");
    setUser(userData);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", JSON.stringify(token));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
