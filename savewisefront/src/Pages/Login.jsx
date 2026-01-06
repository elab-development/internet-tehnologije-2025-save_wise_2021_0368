import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000/api";

const Login = ({ onAuthSuccess }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed.");

      onAuthSuccess({ token: data.token, user: data.user });

      if (data.user?.user_type === "admin") navigate("/admin");
      else navigate("/home");
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Login</h2>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: 10 }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;
