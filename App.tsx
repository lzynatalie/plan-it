import React, { useState } from 'react';
import './App.css';
import ImportNUSMods from "./ImportNUSMods";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = (event) => {
    event.preventDefault();
    //TODO: Will eventually add in full login logic here. But for now,
    //will just ask user whether they want to import calendar upon logging in
    setLoggedIn(true);
  }

  if (!loggedIn) {
    return (
    <div className="App">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <label htmlFor="username">Username:</label>
        <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} />
      <br />
      <label htmlFor="password">Password:</label>
      <input id="password" type="password" value={password} onChange = {e => setPassword(e.target.value)} />
      <br />
      <button type="submit">Login</button>
      </form>
    </div>
    );
  }

  return (
    <div className = "App">
      <h2>Welcome, {username}!</h2>
      <ImportNUSMods />
    </div>
  );
}

export default App;
