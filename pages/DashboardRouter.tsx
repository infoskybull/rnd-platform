import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const DashboardRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Only redirect to login if auth is complete and user is not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If still loading or no user data, show loading
  if (!user || !user.role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading user data...</div>
      </div>
    );
  }

  // Redirect to appropriate dashboard based on user role
  if (user.role === "admin") {
    return <Navigate to="/admin/accounts" replace />;
  } else if (user.role === "publisher") {
    return <Navigate to="/dashboard/publisher/browse-games" replace />;
  } else if (user.role === "creator") {
    return <Navigate to="/dashboard/creator/your-projects" replace />;
  }

  return <Navigate to="/" replace />;
};

export default DashboardRouter;
