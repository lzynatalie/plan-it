import { AuthError } from "@supabase/supabase-js";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "../Register.module.css";

const CreateProfilePage = () => {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, createProfile } = useAuthContext();
  const navigate = useNavigate();

  const handleCreateProfile = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createProfile(username, displayName);
      navigate("/home");
    } catch (error) {
      if (error instanceof AuthError || error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.hero}>
      <div className={styles.container}>
        <form action="" onSubmit={handleCreateProfile}>
          <h1>Create Profile</h1>
          <div className={styles.input}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <FontAwesomeIcon className={styles.icon} icon={faUser} />
          </div>
          <div className={styles.input}>
            <input
              type="text"
              placeholder="Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <FontAwesomeIcon className={styles.icon} icon={faUser} />
          </div>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProfilePage;
