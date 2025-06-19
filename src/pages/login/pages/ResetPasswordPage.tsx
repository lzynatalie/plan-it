import React, { useState } from "react";
import styles from "../Login.module.css";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import { AuthError } from "@supabase/supabase-js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, resetPassword } = useAuthContext();

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage("An email has been sent to " + email);
      setEmail("");
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
        <form action="" onSubmit={handleReset}>
          <h1>Reset Password</h1>
          <div className={styles.input}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FontAwesomeIcon className={styles.icon} icon={faEnvelope} />
          </div>

          {message && (
            <div className={styles.message}>
              <p>{message}</p>
            </div>
          )}
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

export default ResetPasswordPage;
