import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../layouts/Loader";
export default function ProtectedRoute({ isAdmin, children }) {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();
  if (loading !== false) return <Loader />;
  if (!isAuthenticated || !user)
    return (
      <Navigate
        replace
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
      />
    );
  if (isAdmin && user.role !== "admin") return <Navigate replace to="/" />;
  return children;
}
