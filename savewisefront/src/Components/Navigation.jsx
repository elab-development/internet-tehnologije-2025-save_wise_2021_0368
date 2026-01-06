import React from "react";
import { Link, useNavigate } from "react-router-dom";

const BASE_URL = "http://127.0.0.1:8000/api";

const Navigation = ({ token, user, isAuthenticated, role, onLogoutLocal }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // ignore
    } finally {
      onLogoutLocal();
      navigate("/login");
    }
  };

  return (
    <nav
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        borderBottom: "1px solid #ddd",
      }}
    >
      <Link to="/" style={{ fontWeight: 700 }}>
        Save Wise
      </Link>

      {!isAuthenticated && (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}

      {isAuthenticated && role === "admin" && (
        <>
          <Link to="/admin">Home</Link>
          <Link to="/admin/categories">Categories Management</Link>
        </>
      )}

      {isAuthenticated && role === "user" && (
        <>
          <Link to="/home">Home</Link>
          <Link to="/accounts-budgets">Accounts & Budgets</Link>
          <Link to="/transactions">Transactions</Link>
        </>
      )}

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        {isAuthenticated && (
          <>
            <span>{user?.name}</span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
