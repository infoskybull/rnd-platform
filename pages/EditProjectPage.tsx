import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameProject } from "../types";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import EditProjectForm from "../components/EditProjectForm";

const EditProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState<GameProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && isAuthenticated) {
      loadProject();
    }
  }, [id, isAuthenticated]);

  const loadProject = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const projectData = await apiService.getGameProjectById(id);
      setProject(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDetail = () => {
    navigate(`/project-detail/${id}`);
  };

  const handleSuccess = () => {
    navigate(`/project-detail/${id}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-400 mb-6">
            You need to be logged in to edit projects.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Project Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            {error || "The project you're trying to edit doesn't exist."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if user is the owner
  if (project.owner?.id !== user?.id) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-400 mb-6">
            You can only edit projects that you own.
          </p>
          <button
            onClick={() => navigate(`/project-detail/${id}`)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            View Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <EditProjectForm
      user={user!}
      project={project}
      onBackToDetail={handleBackToDetail}
      onSuccess={handleSuccess}
    />
  );
};

export default EditProjectPage;
