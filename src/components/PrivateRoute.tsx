import { useContext } from "react";
import { AuthContext } from "../context/auth/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  const auth = useContext(AuthContext);

  const isAuthenticated = auth?.token;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
