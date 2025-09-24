import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const adminToken = Cookies.get("xbow_admin_token");

  if (!adminToken) {
    return <Navigate to="/admin_login" replace />;
  }

  return <>{children}</>;
};
