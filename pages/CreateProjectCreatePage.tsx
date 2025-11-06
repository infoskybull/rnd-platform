import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import ProjectUploadForm from "../components/ProjectUploadForm";
import { useAuth } from "../hooks/useAuth";

const CreateProjectCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Get uploaded file, html content, generated code, and source from navigation state
  const { uploadedFile, htmlContent, generatedCode, source } =
    location.state || {};

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

  // Determine which file to pass based on source
  let preUploadedFile = undefined;
  let preHtmlContent = undefined;

  if (source === "ai-generator") {
    // From AI generator - use generated code
    preHtmlContent = generatedCode;
  } else {
    // From upload page - use uploaded file
    preUploadedFile = uploadedFile;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <ResponsiveNavbar
        title="Create Project"
        titleColor="text-green-400"
        user={user}
        onLogout={handleLogout}
        backButton={{
          text: "Back to Create Project",
          onClick: handleBackToMain,
        }}
      />

      <div className="pt-0">
        <ProjectUploadForm
          user={user}
          onBackToMain={handleBackToMain}
          onSuccess={handleProjectSuccess}
          preUploadedFile={preUploadedFile}
          preHtmlContent={preHtmlContent}
          autoUpload={false} // Tắt auto upload
          showHeader={false} // Tắt header riêng vì đã có ResponsiveNavbar
        />
      </div>
    </div>
  );
};

export default CreateProjectCreatePage;
