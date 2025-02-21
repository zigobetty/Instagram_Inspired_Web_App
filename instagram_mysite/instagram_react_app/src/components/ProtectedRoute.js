import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";

const ProtectedRoute = ({ element }) => {
  const { userData, loading } = useContext(UserContext);

  if (loading) {
    return <div></div>;
  }

  return userData ? element : <Navigate to="/" />;
};

export default ProtectedRoute;
