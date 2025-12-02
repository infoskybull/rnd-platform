import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PublisherDashboardPage from "../pages/PublisherDashboardPage";
import CreatorDashboardPage from "../pages/CreatorDashboardPage";
import {
  PlanAccessRequirement,
  getPlanCode,
  meetsPlanRequirements,
} from "../utils/planAccess";

const DashboardRouteWrapper: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

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
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading user data...</div>
      </div>
    );
  }

  // Check if user is admin - redirect to admin dashboard
  if (user.role === "admin") {
    return <Navigate to="/admin/accounts" replace />;
  }

  // Check if user is creator or publisher
  if (user.role !== "creator" && user.role !== "publisher") {
    return <Navigate to="/403" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  // Render appropriate dashboard based on role
  if (user.role === "publisher") {
    return <PublisherDashboardPage user={user} onLogout={handleLogout} />;
  } else if (user.role === "creator") {
    return <CreatorDashboardPage user={user} onLogout={handleLogout} />;
  }

  return <Navigate to="/" replace />;
};

export default DashboardRouteWrapper;

