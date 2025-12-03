import React, { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PublisherPrototypeDetailPage from "../pages/PublisherPrototypeDetailPage";
import { apiService } from "../services/api";

const PrototypeDetailRouteWrapper: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [checkingOwner, setCheckingOwner] = useState(true);

  // Check if user is owner of the prototype
  useEffect(() => {
    const checkOwner = async () => {
      if (!id || !user || isLoading) {
        setCheckingOwner(false);
        return;
      }

      // If user is publisher, they can always access
      if (user.role === "publisher") {
        setIsOwner(true);
        setCheckingOwner(false);
        return;
      }

      // If user is creator, check if they are the owner
      if (user.role === "creator") {
        try {
          // Get preview data to check ownership (lighter request)
          const previewData = await apiService.getGameProjectPreview(id);
          
          // Check if user is owner (creatorId matches)
          const userIsOwner = previewData.creatorId === user.id;
          
          // If creatorId matches, allow access
          // If not, try to load full project to check owner/originalDeveloper
          if (userIsOwner) {
            setIsOwner(true);
          } else {
            try {
              // Try to load full project to check owner/originalDeveloper
              const projectData = await apiService.getGameProjectById(id);
              const isFullOwner =
                projectData.creatorId === user.id ||
                projectData.owner?.id === user.id ||
                projectData.originalDeveloper?.id === user.id;
              setIsOwner(isFullOwner);
            } catch (fullProjectErr) {
              // If we can't load full project, deny access
              setIsOwner(false);
            }
          }
        } catch (err) {
          console.error("Failed to check ownership:", err);
          setIsOwner(false);
        } finally {
          setCheckingOwner(false);
        }
      } else {
        setCheckingOwner(false);
      }
    };

    checkOwner();
  }, [id, user, isLoading]);

  // Show loading while auth is being checked
  if (isLoading || checkingOwner) {
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

  // Allow access if user is publisher OR creator (owner)
  const hasAccess = user.role === "publisher" || user.role === "creator";
  
  // If creator, check if they are the owner
  if (user.role === "creator") {
    // If still checking, wait
    if (checkingOwner || isOwner === null) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }
    // If not owner, deny access
    if (isOwner === false) {
      return <Navigate to="/403" replace />;
    }
  }

  // If not publisher or creator, deny access
  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  return <PublisherPrototypeDetailPage user={user} onLogout={handleLogout} />;
};

export default PrototypeDetailRouteWrapper;

