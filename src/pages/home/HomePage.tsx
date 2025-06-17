import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthError } from "@supabase/supabase-js";

import Header from "../../components/header/Header";
import profilePicture from "../../components/assets/profile-picture-1.jpg";

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
    <div className="container">
      <Header />

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
          <div className="column">
            <h2>Notifications</h2>
            <div className="box">No notifications yet</div>
          </div>
          <div className="column">
            <h2>Upcoming Events</h2>
            <div className="box">No upcoming events</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
