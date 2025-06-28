import { AuthError } from "@supabase/supabase-js";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

import { faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./Login.module.css";

const LoginPage = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, loginUser, getProfile } = useAuthContext();
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await loginUser(usernameOrEmail, password);
      const profile = await getProfile(user.id);
      if (profile) {
        navigate("/home");
      } else {
        navigate("/create-profile");
      }
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
        <form action="" onSubmit={handleLogin}>
          <h1>Login</h1>

          <div className={styles.input}>
            <input
              type="text"
              placeholder={"Username / Email"}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
            <FontAwesomeIcon className={styles.icon} icon={faUser} />
          </div>

          <div className={styles.input}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FontAwesomeIcon className={styles.icon} icon={faLock} />
          </div>

          <div className={styles.forgotPassword}>
            <p>
              <Link to="/reset-password">Forgot password?</Link>
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}>
            Login
          </button>

          <div className={styles.link}>
            <p>
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
