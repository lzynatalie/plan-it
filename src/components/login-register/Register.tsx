import React, { useState } from "react";
import "./LoginRegister.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { AuthError } from "@supabase/supabase-js";

import user from "../assets/user-icon.png";
import mail from "../assets/mail-icon.png";
import lock from "../assets/lock-icon.png";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, registerNewUser } = useAuthContext();
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await registerNewUser(email, password);
      navigate("/login");
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
      <form action="" onSubmit={handleRegister}>
        <h1>Register</h1>
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

        <button type="submit" disabled={loading}>
          Register
        </button>

        <div className="navigate">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>

        <div className="error">{error && <p>{error}</p>}</div>
      </form>
    </div>
  );
};

export default Register;
