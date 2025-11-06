import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Upload, CheckCircle, Save } from "lucide-react";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import FileUpload from "../components/FileUpload";
import WebGLPreview from "../components/WebGLPreview";

declare const JSZip: any;

const CreateProjectUploadPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [previewKey, setPreviewKey] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBackToMain = () => {
    navigate("/create-project");
  };

  const handleFileUploadWithPreview = async (file: File) => {
    setUploadedFile(file);
    setIsLoading(true);

    // Process the file for preview
    try {
      const zip = new (window as any).JSZip();
      const zipContent = await zip.loadAsync(file);

      // Look for index.html in the root or in common directories
      let htmlFile = zipContent.file("index.html");
      if (!htmlFile) {
        htmlFile = zipContent.file("Build/index.html");
      }
      if (!htmlFile) {
        htmlFile = zipContent.file("TemplateData/index.html");
      }

      if (htmlFile) {
        const htmlText = await htmlFile.async("text");
        setHtmlContent(htmlText);
        setPreviewKey((prev) => prev + 1); // Force re-render of preview
      } else {
        console.warn("No index.html found in the uploaded zip file");
        setHtmlContent("");
      }
    } catch (error) {
      console.error("Error processing zip file:", error);
      setHtmlContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = () => {
    if (!uploadedFile) {
      alert("Please upload a file first");
      return;
    }

    // Navigate to create page with the uploaded file
    navigate("/create-project/create", {
      state: {
        uploadedFile,
        htmlContent,
        source: "upload-preview",
      },
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <ResponsiveNavbar
        title="Project Upload Preview"
        titleColor="text-indigo-400"
        user={user}
        onLogout={() => {}}
        backButton={{
          text: "Back",
          onClick: handleBackToMain,
        }}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-full mb-3 sm:mb-4">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
              Upload & Preview Your Game
            </h2>
            <p className="text-base sm:text-lg text-gray-400 mb-3 sm:mb-4">
              Upload your game files and preview them before creating your
              project
            </p>
            <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-900/20 text-indigo-300 rounded-lg border border-indigo-500/20">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">
                Preview your game before publishing
              </span>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Upload Section - Takes 1/4 of the width */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6 h-full">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
                  Upload Project
                </h3>
                <p className="text-sm text-gray-400 mb-4 sm:mb-6">
                  Upload your game files and see them in action
                </p>

                <FileUpload
                  onFileUpload={handleFileUploadWithPreview}
                  disabled={isLoading}
                />

                {/* Create Button */}
                {htmlContent && uploadedFile && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h4 className="text-base font-semibold text-white mb-4">
                      Ready to Create Project
                    </h4>
                    <button
                      onClick={handleCreateProject}
                      className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Project
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section - Takes 3/4 of the width */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md overflow-hidden h-full flex flex-col">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white">
                        Game Preview
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Live preview of your uploaded game
                      </p>
                    </div>
                    {htmlContent && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-green-900/20 text-green-400 rounded-full text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Ready</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 bg-gray-900 min-h-[400px]">
                  <WebGLPreview
                    key={previewKey}
                    htmlContent={htmlContent}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 sm:mt-8 bg-gray-800/40 rounded-xl border border-gray-700 p-4 sm:p-6">
            <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
              Preview Tips
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <h5 className="font-medium text-white text-sm">
                    Upload Files
                  </h5>
                  <p className="text-gray-400 text-xs">
                    Upload your game zip file to see the preview
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <h5 className="font-medium text-white text-sm">
                    Test Preview
                  </h5>
                  <p className="text-gray-400 text-xs">
                    Make sure your game works correctly in the preview
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:col-span-2 lg:col-span-1">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <h5 className="font-medium text-white text-sm">
                    Create Project
                  </h5>
                  <p className="text-gray-400 text-xs">
                    Click Create Project to proceed with publishing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateProjectUploadPreviewPage;
