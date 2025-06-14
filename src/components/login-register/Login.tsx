import React, { useState } from "react";
import "./LoginRegister.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { AuthError } from "@supabase/supabase-js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUser } from "@fortawesome/free-solid-svg-icons";

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, loginUser } = useAuthContext();
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(usernameOrEmail, password);
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
    <div className="container">
      <form action="" onSubmit={handleLogin}>
        <h1>Login</h1>
        <div className="input">
          <input
            type="text"
            placeholder={"Username / Email"}
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
          />
          <FontAwesomeIcon className="icon" icon={faUser} />
        </div>
        <div className="input">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FontAwesomeIcon className="icon" icon={faLock} />
        </div>
        <div className="forgot">
          <p>
            <Link to="/reset-password">Forgot password?</Link>
          </p>
        </div>

        <button type="submit" disabled={loading}>
          Login
        </button>

        <div className="navigate">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>

        <div className="error">{error && <p>{error}</p>}</div>
      </form>
    </div>
  );
};

export default Login;
