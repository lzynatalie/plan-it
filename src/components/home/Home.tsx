import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthError } from "@supabase/supabase-js";

const Home = () => {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, getProfile, logoutUser } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const getDisplayName = async () => {
      const { display_name } = await getProfile();
      setDisplayName(display_name);
    };

    getDisplayName();
  });

  const handleLogout = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await logoutUser();
      navigate("/");
    } catch (error) {
      if (error instanceof AuthError) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Home</h1>
      <h2>Welcome, {displayName}</h2>
      <button onClick={handleLogout} disabled={loading}>
        Logout
      </button>

      <div className="error">{error && <p>{error}</p>}</div>
    </div>
  );
};

export default Home;
