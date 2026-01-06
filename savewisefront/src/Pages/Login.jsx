import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../Components/AuthForm";

const BASE_URL = "http://127.0.0.1:8000/api";

const Login = ({ onAuthSuccess }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const readErrorMessage = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      if (res.status === 401) return "Invalid email or password.";
      if (res.status === 422) return "Please check your input and try again.";
      return "Something went wrong. Please try again later.";
    }

    const data = await res.json().catch(() => null);
    if (data?.message) return data.message;

    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      const firstMsg = data.errors[firstKey]?.[0];
      if (firstMsg) return firstMsg;
    }

    if (res.status === 401) return "Invalid email or password.";
    return "Something went wrong. Please try again later.";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setErrorMsg(msg);
        return;
      }

      const data = await res.json();

      setSuccessMsg("Login successful. Redirecting...");
      onAuthSuccess({ token: data.token, user: data.user });

      setTimeout(() => {
        if (data.user?.user_type === "admin") navigate("/admin");
        else navigate("/home");
      }, 600);
    } catch (error) {
      setErrorMsg("Error has occured, please check all of the fields and try again...");
    }
  };

  const fields = [
    {
      name: "email",
      type: "email",
      placeholder: "Email",
      value: email,
      onChange: (e) => setEmail(e.target.value),
    },
    {
      name: "password",
      type: "password",
      placeholder: "Password",
      value: password,
      onChange: (e) => setPassword(e.target.value),
    },
  ];

  const footer = (
    <p className="auth-footer">
      No account? <Link to="/register">Register</Link>
    </p>
  );

  return (
    <AuthForm
      title="Login to SaveWise"
      errorMsg={errorMsg}
      successMsg={successMsg}
      onSubmit={onSubmit}
      fields={fields}
      submitText="Login"
      footer={footer}
    />
  );
};

export default Login;
