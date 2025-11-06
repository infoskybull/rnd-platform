import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PublisherBrowseGamesPage from "../pages/PublisherBrowseGamesPage";
import PublisherInventoryPage from "../pages/PublisherInventoryPage";
import PublisherCollaborationsPage from "../pages/PublisherCollaborationsPage";
import PublisherContractsPage from "../pages/PublisherContractsPage";
import PublisherStatsPage from "../pages/PublisherStatsPage";
import PublisherHistoryPage from "../pages/PublisherHistoryPage";
import PublisherSettingsPage from "../pages/PublisherSettingsPage";

interface PublisherRouteWrapperProps {
  page:
    | "browse-games"
    | "inventory"
    | "collaborations"
    | "contracts"
    | "stats"
    | "history"
    | "settings";
}

const PublisherRouteWrapper: React.FC<PublisherRouteWrapperProps> = ({
  page,
}) => {
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

  // Check if user is publisher
  if (user.role !== "publisher") {
    return <Navigate to="/403" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  // Render the appropriate page based on the page prop
  switch (page) {
    case "browse-games":
      return <PublisherBrowseGamesPage user={user} onLogout={handleLogout} />;
    case "inventory":
      return <PublisherInventoryPage user={user} onLogout={handleLogout} />;
    case "collaborations":
      return (
        <PublisherCollaborationsPage user={user} onLogout={handleLogout} />
      );
    case "contracts":
      return <PublisherContractsPage user={user} onLogout={handleLogout} />;
    case "stats":
      return <PublisherStatsPage user={user} onLogout={handleLogout} />;
    case "history":
      return <PublisherHistoryPage user={user} onLogout={handleLogout} />;
    case "settings":
      return <PublisherSettingsPage user={user} onLogout={handleLogout} />;
    default:
      return <Navigate to="/404" replace />;
  }
};

export default PublisherRouteWrapper;
