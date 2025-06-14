import React, { ReactNode } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuthContext();

  if (loading) {
    return <p>Loading...</p>;
  }

  return <>{session ? children : <Navigate to="/login" />}</>;
};

export default PrivateRoute;
