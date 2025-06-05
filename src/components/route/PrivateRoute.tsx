import React, { ReactNode } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { session } = useAuthContext();

  return <>{session ? <>{children}</> : <Navigate to="/login" />}</>;
};

export default PrivateRoute;
