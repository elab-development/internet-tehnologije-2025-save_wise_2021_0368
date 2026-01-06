import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000/api";

const Register = ({ onAuthSuccess }) => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Register failed.");

      onAuthSuccess({ token: data.token, user: data.user });
      navigate("/home");
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Register</h2>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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

        <input
          type="password"
          placeholder="Confirm password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
        />

        <button type="submit">Create account</button>
      </form>

      <p style={{ marginTop: 10 }}>
        Have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
