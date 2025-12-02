import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import OfferPage from "../pages/OfferPage";

const OfferRouteWrapper: React.FC = () => {
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

  // Check if user is publisher (offers are typically made by publishers)
  if (user.role !== "publisher") {
    return <Navigate to="/403" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  return <OfferPage user={user} onLogout={handleLogout} />;
};

export default OfferRouteWrapper;
