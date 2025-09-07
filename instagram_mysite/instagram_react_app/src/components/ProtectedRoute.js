import { Outlet, Navigate } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("authToken");
  return token ? <Outlet /> : <Navigate to="/main_login" />;
};

export default ProtectedRoute;
