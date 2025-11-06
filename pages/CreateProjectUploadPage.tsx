import React from "react";
import { useNavigate } from "react-router-dom";
import ProjectUploadForm from "../components/ProjectUploadForm";
import { useAuth } from "../hooks/useAuth";

const CreateProjectUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToMain = () => {
    navigate("/create-project");
  };

  const handleProjectSuccess = (projectId: string) => {
    console.log("Project created successfully:", projectId);
    // Navigate to dashboard or project details page
    navigate("/dashboard");
  };

  if (!user || !user.role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <ProjectUploadForm
      user={user}
      onBackToMain={handleBackToMain}
      onSuccess={handleProjectSuccess}
    />
  );
};

export default CreateProjectUploadPage;
