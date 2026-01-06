import "./App.css";

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navigation from "./Components/Navigation"

import UserHome from "./Pages/UserHome";
import AdminHome from "./Pages/AdminHome";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import AccountsBudgets from "./Pages/AccountsBudgets";
import CategoriesManagement from "./Pages/CategoriesManagement";
import Transactions from "./Pages/Transactions";

const TOKEN_KEY = "savewise_token";
const USER_KEY = "savewise_user";

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const isAuthenticated = !!token && !!user;
  const role = user?.user_type || null; // "admin" ili "user"

  // sync u sessionStorage
  useEffect(() => {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_KEY);
  }, [user]);

  // poziva se posle uspešnog login/register
  const handleAuthSuccess = ({ token, user }) => {
    setToken(token);
    setUser(user);
  };

  const handleLogoutLocal = () => {
    setToken("");
    setUser(null);
  };

  // Guard komponente (u istom fajlu)
  const RequireAuth = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
  };

  const RequireRole = ({ allowed, children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!allowed.includes(role)) return <Navigate to="/" replace />;
    return children;
  };

  const RootRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/home" replace />;
  };

  return (
    <BrowserRouter>
      <Navigation
        token={token}
        user={user}
        isAuthenticated={isAuthenticated}
        role={role}
        onLogoutLocal={handleLogoutLocal}
      />

      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* public */}
        <Route
          path="/login"
          element={<Login onAuthSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/register"
          element={<Register onAuthSuccess={handleAuthSuccess} />}
        />

        {/* user */}
        <Route
          path="/home"
          element={
            <RequireRole allowed={["user"]}>
              <UserHome user={user} token={token} />
            </RequireRole>
          }
        />
        <Route
          path="/accounts-budgets"
          element={
            <RequireRole allowed={["user"]}>
              <AccountsBudgets user={user} token={token} />
            </RequireRole>
          }
        />
        <Route
          path="/transactions"
          element={
            <RequireRole allowed={["user"]}>
              <Transactions user={user} token={token} />
            </RequireRole>
          }
        />

        {/* admin */}
        <Route
          path="/admin"
          element={
            <RequireRole allowed={["admin"]}>
              <AdminHome user={user} token={token} />
            </RequireRole>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <RequireRole allowed={["admin"]}>
              <CategoriesManagement user={user} token={token} />
            </RequireRole>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
