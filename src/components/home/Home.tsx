import React, { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [loading, setLoading] = useState(false);

  const { session, logoutUser } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Home</h1>
      <h2>Welcome, {session?.user.email}</h2>
      <button onClick={handleLogout} disabled={loading}>
        Logout
      </button>
    </div>
  );
};

export default Home;
