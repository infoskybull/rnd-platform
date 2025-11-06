import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProjectUploadForm from "../components/ProjectUploadForm";
import { useAuth } from "../hooks/useAuth";

const CreateProjectUploadSavePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get uploaded file, html content, generated code, and source from navigation state
  const { uploadedFile, htmlContent, generatedCode, source } =
    location.state || {};

  const handleBackToMain = () => {
    navigate("/create-project");
  };

  const handleProjectSuccess = (projectId: string) => {
    console.log("Project created successfully:", projectId);
    // Navigate to dashboard or project details page
    navigate("/dashboard");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check source page and validate appropriate data
  if (source === "ai-generator") {
    // If coming from AI page, check for generated code
    if (!generatedCode) {
      navigate("/create-project/ai", { replace: true });
      return null;
    }
  } else {
    // If coming from upload page (or no source specified), check for uploaded file
    if (!uploadedFile) {
      navigate("/create-project/upload/preview", { replace: true });
      return null;
    }
  }

  return (
    <ProjectUploadForm
      user={user}
      onBackToMain={handleBackToMain}
      onSuccess={handleProjectSuccess}
      preUploadedFile={source === "ai-generator" ? undefined : uploadedFile}
      preHtmlContent={source === "ai-generator" ? generatedCode : htmlContent}
    />
  );
};

export default CreateProjectUploadSavePage;
