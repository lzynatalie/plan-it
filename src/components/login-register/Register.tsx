import React, { useState } from "react";
import "./LoginRegister.css";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { AuthError } from "@supabase/supabase-js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";

const Register = () => {
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
    <div className="container">
      <form action="" onSubmit={handleRegister}>
        <h1>Register</h1>
        <div className="input">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FontAwesomeIcon className="icon" icon={faEnvelope} />
        </div>
        <div className="input">
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FontAwesomeIcon className="icon" icon={faLock} />
        </div>
        <div className="input">
          <input
            type="password"
            placeholder="Re-enter your password"
            value={passwordAgain}
            onChange={(e) => setPasswordAgain(e.target.value)}
            required
          />
          <FontAwesomeIcon className="icon" icon={faLock} />
        </div>

        <div className="error">{message && <p>{message}</p>}</div>

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
