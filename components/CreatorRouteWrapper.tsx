import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import CreatorYourProjectsPage from "../pages/CreatorYourProjectsPage";
import CreatorCollaborationsPage from "../pages/CreatorCollaborationsPage";
import CreatorContractsPage from "../pages/CreatorContractsPage";
import CreatorStatsPage from "../pages/CreatorStatsPage";
import CreatorHistoryPage from "../pages/CreatorHistoryPage";
import CreatorSettingsPage from "../pages/CreatorSettingsPage";

interface CreatorRouteWrapperProps {
  page:
    | "your-projects"
    | "collaborations"
    | "contracts"
    | "stats"
    | "history"
    | "settings";
}

const CreatorRouteWrapper: React.FC<CreatorRouteWrapperProps> = ({ page }) => {
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

  // Check if user is creator
  if (user.role !== "creator") {
    return <Navigate to="/403" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  // Render the appropriate page based on the page prop
  switch (page) {
    case "your-projects":
      return <CreatorYourProjectsPage user={user} onLogout={handleLogout} />;
    case "collaborations":
      return <CreatorCollaborationsPage user={user} onLogout={handleLogout} />;
    case "contracts":
      return <CreatorContractsPage user={user} onLogout={handleLogout} />;
    case "stats":
      return <CreatorStatsPage user={user} onLogout={handleLogout} />;
    case "history":
      return <CreatorHistoryPage user={user} onLogout={handleLogout} />;
    case "settings":
      return <CreatorSettingsPage user={user} onLogout={handleLogout} />;
    default:
      return <Navigate to="/404" replace />;
  }
};

export default CreatorRouteWrapper;
