import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../Components/AuthForm";

const BASE_URL = "http://127.0.0.1:8000/api";

const Register = ({ onAuthSuccess }) => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const readErrorMessage = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
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

    return "Something went wrong. Please try again later.";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

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

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        setErrorMsg(msg);
        return;
      }

      const data = await res.json();

      setSuccessMsg("Account created. Redirecting...");
      onAuthSuccess({ token: data.token, user: data.user });

      setTimeout(() => {
        navigate("/home");
      }, 600);
    } catch (error) {
      setErrorMsg("Error has occured, please check all of the fields and try again...");
    }
  };

  const fields = [
    {
      name: "name",
      type: "text",
      placeholder: "Name",
      value: name,
      onChange: (e) => setName(e.target.value),
    },
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
    {
      name: "password_confirmation",
      type: "password",
      placeholder: "Confirm password",
      value: passwordConfirmation,
      onChange: (e) => setPasswordConfirmation(e.target.value),
    },
  ];

  const footer = (
    <p className="auth-footer">
      Have an account? <Link to="/login">Login</Link>
    </p>
  );

  return (
    <AuthForm
      title="Create your SaveWise account"
      errorMsg={errorMsg}
      successMsg={successMsg}
      onSubmit={onSubmit}
      fields={fields}
      submitText="Create account"
      footer={footer}
    />
  );
};

export default Register;
