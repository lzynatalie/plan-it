import React, { useState } from 'react';
import './LoginRegister.css';

import user from '../assets/user-icon.png'
import lock from '../assets/lock-icon.png'

const LoginRegister = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        //TODO: add whatever api whatever, login logic whatever
    }

    return (
        <div className="container">
            <form action="" onSubmit={handleLogin}>
                <h1>Login</h1>
                <div className="input">
                    <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required/>
                    <img className="icon" src={user} alt="" />
                </div>
                <div className="input">
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required/>
                    <img className="icon" src={lock} alt="" />
                </div>
                <div className="remember-forgot">
                    <label><input type="checkbox" />Remember me</label>
                    <a href="#">Forgot password?</a>
                </div>

                <button type="submit">Login</button>

                <div className="register">
                    <p>Don't have an account? <a href="#">Register</a></p>
                </div>
            </form>
        </div>
    );
}

export default LoginRegister;
