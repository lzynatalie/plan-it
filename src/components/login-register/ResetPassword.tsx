import React, { useState } from "react";
import "./LoginRegister.css";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { AuthError } from "@supabase/supabase-js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

const ResetPassword = () => {
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
    <div className="container">
      <form action="" onSubmit={handleReset}>
        <h1>Reset Password</h1>
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

        <div className="error">{message && <p>{message}</p>}</div>

        <button type="submit" disabled={loading}>
          Submit
        </button>

        <div className="navigate">
          <Link to="/login">Return to Login</Link>
        </div>

        <div className="error">{error && <p>{error}</p>}</div>
      </form>
    </div>
  );
};

export default ResetPassword;
