import { AuthError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

import profilePicture from "../../components/assets/profile-picture-1.jpg";
import UpcomingEvents from "../events/components/UpcomingEvents";

const HomePage = () => {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, getProfile, logoutUser } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { display_name, username } = await getProfile();
      setDisplayName(display_name);
      setUsername(username);
    };

    fetchProfile();
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
    <div className="main">
      <h1>Home</h1>

      <div className="box">
        <div className="row">
          <img id="profile-picture" src={profilePicture} />
          <div className="column">
            <h1>{username}</h1>
            <h2>{displayName}</h2>
            <button onClick={handleLogout} disabled={loading}>
              Logout
            </button>
            <div className="error">{error && <p>{error}</p>}</div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* TODO */}
        <div className="column">
          <h2>Notifications</h2>
          <div className="box">No notifications yet</div>
        </div>

        <UpcomingEvents />
      </div>
    </div>
  );
};

export default HomePage;
