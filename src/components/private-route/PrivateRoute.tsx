import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuthContext();

  if (loading) {
    return <p>Loading...</p>;
  }

  return <>{session ? children : <Navigate to="/login" />}</>;
};

export default PrivateRoute;
