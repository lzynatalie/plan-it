import React from 'react';
import './App.css';
import { useState } from 'react';

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event) => {
    event.preventdefault();
    //TODO: add whatever api whatever, login logic whatever
  }

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

export default App;
