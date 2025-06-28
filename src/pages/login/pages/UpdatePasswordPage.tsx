import { AuthError } from "@supabase/supabase-js";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";

import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "../Login.module.css";

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, updatePassword } = useAuthContext();
  const navigate = useNavigate();

  const confirmPassword = (password: string, passwordAgain: string) => {
    if (passwordAgain !== password) {
      throw new Error("Passwords do not match.");
    }
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      confirmPassword(password, passwordAgain);
      await updatePassword(password);
      navigate("/login");
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
        <form action="" onSubmit={handleChangePassword}>
          <h1>Reset Password</h1>
          <div className={styles.input}>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FontAwesomeIcon className={styles.icon} icon={faLock} />
          </div>
          <div className={styles.input}>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={passwordAgain}
              onChange={(e) => setPasswordAgain(e.target.value)}
              required
            />
            <FontAwesomeIcon className={styles.icon} icon={faLock} />
          </div>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}>
            Submit
          </button>

          <div className={styles.link}>
            <Link to="/login">Return to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
