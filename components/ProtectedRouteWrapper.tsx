import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteWrapperProps {
  children: React.ReactNode;
  userRole: "publisher" | "creator";
}

const ProtectedRouteWrapper: React.FC<ProtectedRouteWrapperProps> = ({
  children,
  userRole,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // Check if user role matches the required role
  if (user.role !== userRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRouteWrapper;
