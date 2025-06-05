import React, { useState } from "react";
import "./LoginRegister.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { AuthError } from "@supabase/supabase-js";

import user from "../assets/user-icon.png";
import mail from "../assets/mail-icon.png";
import lock from "../assets/lock-icon.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, loginUser } = useAuthContext();
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await loginUser(email, password);
      navigate("/home");
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
      <form action="" onSubmit={handleLogin}>
        <h1>Login</h1>
        {/* <div className="input">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <img className="icon" src={user} alt="" />
        </div> */}
        <div className="input">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <img className="icon" src={mail} alt="" />
        </div>
        <div className="input">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <img className="icon" src={lock} alt="" />
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
