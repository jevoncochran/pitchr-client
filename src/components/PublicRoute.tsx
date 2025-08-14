import { useContext } from "react";
import { AuthContext } from "../context/auth/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
  const auth = useContext(AuthContext);

  const isAuthenticated = auth?.token;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;
