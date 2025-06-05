import React, { useState } from "react";
import "./LoginRegister.css";
import { Link } from "react-router-dom";

import mail from "../assets/mail-icon.png";

const ResetPassword = () => {
  const [email, setEmail] = useState("");

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {};

  return (
    <div className="container">
      <form action="" onSubmit={handleReset}>
        <h1>Reset Password</h1>
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
        <div className="navigate">
          <Link to="/login">Return to Login</Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
