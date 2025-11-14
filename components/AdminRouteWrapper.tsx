import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "./AdminLayout";
import AdminAccountsPage from "../pages/AdminAccountsPage";
import AdminReportsPage from "../pages/AdminReportsPage";
import MessagesTab from "./dashboard/MessagesTab";

interface AdminRouteWrapperProps {
  page: "accounts" | "messages" | "reports";
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

  // Render the appropriate page based on the page prop with AdminLayout
  const renderPageContent = () => {
    switch (page) {
      case "accounts":
        return <AdminAccountsPage />;
      case "messages":
        return <MessagesTab useFullHeight />;
      case "reports":
        return <AdminReportsPage />;
      default:
        return <Navigate to="/404" replace />;
    }
  };

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      {renderPageContent()}
    </AdminLayout>
  );
};

export default AdminRouteWrapper;
