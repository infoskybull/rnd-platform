import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminManagementPage from "../pages/AdminManagementPage";

interface AdminRouteWrapperProps {
  page: "management";
}

const AdminRouteWrapper: React.FC<AdminRouteWrapperProps> = ({ page }) => {
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

  // Check if user is admin
  if (user.role !== "admin") {
    return <Navigate to="/403" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  // Render the appropriate page based on the page prop
  switch (page) {
    case "management":
      return <AdminManagementPage user={user} onLogout={handleLogout} />;
    default:
      return <Navigate to="/404" replace />;
  }
};

export default AdminRouteWrapper;
