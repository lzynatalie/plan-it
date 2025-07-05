import { AuthError } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { updateAccount, deleteAccount } from "../../services/accountService";

import profilePicture from "../../components/assets/profile-picture-1.jpg";
import UpcomingEvents from "../events/components/UpcomingEvents";

const HomePage = () => {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const { session, getProfile, logoutUser } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { display_name, username } = await getProfile();
      setDisplayName(display_name);
      setUsername(username);
    };

    fetchProfile();
  }, []);

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

  const handleUpdateAccount = async () => {
    setLoading(true);
    try {
      await updateAccount(session!.user.id, {
        username: username,
        display_name: displayName
      });
      alert('Profile updated successfully!');
      setEditing(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm("Are you sure you want to delete your account? This action is irreversible.");

    if (!isConfirmed) return;

    setLoading(true);
    try {
      await deleteAccount(session!.user.id);
      await logoutUser();
      navigate('/');
    } catch (error: any) {
      setError(error.message);
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
            {editing ? (
              <>
              <input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='Username'
              />
              <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder='Name'
              />
              <button onClick={handleUpdateAccount} disabled={loading}>
                Save
              </button>
              <button onClick={() => setEditing(false)} disabled={loading}>
                Cancel
              </button>
              </>
            ) : (
              <>
              <h1>{username}</h1>
              <h2>{displayName}</h2>
              <button onClick={() => setEditing(true)}>
                Edit Profile 
              </button>
              </>
            )}

            <button onClick={handleLogout} disabled={loading}>
              Logout
            </button>
            <button onClick={handleDeleteAccount} disabled={loading}>
              Delete Account
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
