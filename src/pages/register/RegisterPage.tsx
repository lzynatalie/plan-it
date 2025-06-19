import React, { useState } from "react";
import styles from "./Register.module.css";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { AuthError } from "@supabase/supabase-js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, registerNewUser } = useAuthContext();

  const confirmPassword = (password: string, passwordAgain: string) => {
    if (passwordAgain !== password) {
      throw new Error("Passwords do not match.");
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      confirmPassword(password, passwordAgain);
      await registerNewUser(email, password);
      setEmail("");
      setPassword("");
      setPasswordAgain("");
      setMessage("A confirmation email has been sent to " + email);
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
        <form action="" onSubmit={handleRegister}>
          <h1>Register</h1>
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
            Register
          </button>

          <div className={styles.link}>
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
