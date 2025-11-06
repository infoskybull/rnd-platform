import React, { useState } from "react";
import { User } from "../types";
import { Upload, ArrowLeft, CheckCircle, Save, Globe, X } from "lucide-react";
import RnDLogo from "./icons/RnDLogo";
import RoleBadge from "./RoleBadge";
import FileUpload from "./FileUpload";
import WebGLPreview from "./WebGLPreview";
import { WarningIcon } from "./icons/Icons";

declare const JSZip: any;

interface UploadViewProps {
  user: User;
  onBackToMain: () => void;
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
  hasProject?: boolean;
}

interface ProjectFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  tags: string;
}

const UploadView: React.FC<UploadViewProps> = ({
  user,
  onBackToMain,
  onFileUpload,
  isLoading = false,
  hasProject = false,
}) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [previewKey, setPreviewKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"publish" | "draft">("publish");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    price: "",
    category: "",
    tags: "",
  });

  const handleFileUploadWithPreview = async (file: File) => {
    // Call the original onFileUpload callback
    onFileUpload(file);

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
    }
  };

  const handleOpenModal = (type: "publish" | "draft") => {
    setModalType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      title: "",
      description: "",
      price: "",
      category: "",
      tags: "",
    });
  };

  const handleFormChange = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a project title");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const message =
        modalType === "publish"
          ? "Project published successfully!"
          : "Project saved as draft!";

      setToastMessage(message);
      setShowToast(true);
      setShowModal(false);

      // Auto-hide toast and navigate back
      setTimeout(() => {
        setShowToast(false);
        onBackToMain();
      }, 3000);
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={onBackToMain}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Main</span>
                <span className="sm:hidden">Back</span>
              </button>
              <RnDLogo size={32} className="sm:w-10 sm:h-10" />
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                <span className="hidden sm:inline">Welcome to RnD Game </span>
                <span className="sm:hidden">RnD Game </span>
                <span className="text-indigo-400">Marketplace</span>
              </h1>
            </div>

            <div className="text-right w-full sm:w-auto">
              <p className="text-sm text-gray-300">
                Welcome,{" "}
                <span className="font-medium text-white">{user.name}</span>
              </p>
              <div className="flex items-center justify-end space-x-2 text-xs text-gray-400 flex-wrap">
                <span className="hidden sm:inline">{user.email}</span>
                <span className="sm:hidden">{user.email.split("@")[0]}</span>
                {user.role && <RoleBadge role={user.role} size="sm" />}
                {user.isKYCVerified ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/20 text-green-400 border border-green-500/20">
                    <span className="hidden sm:inline">✓ KYC Verified</span>
                    <span className="sm:hidden">✓</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400 border border-yellow-500/20">
                    <span className="hidden sm:inline flex items-center gap-1">
                      <WarningIcon className="w-4 h-4 text-yellow-400" />
                      KYC Pending
                    </span>
                    <span className="sm:hidden">
                      <WarningIcon className="w-4 h-4 text-yellow-400" />
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-full mb-3 sm:mb-4">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
              Upload Your Game Project
            </h2>
            <p className="text-base sm:text-lg text-gray-400 mb-3 sm:mb-4">
              Share your creativity with the world and start earning
            </p>
            <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-900/20 text-indigo-300 rounded-lg border border-indigo-500/20">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">
                Account ready for uploads
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

                {/* Action Buttons */}
                {htmlContent && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h4 className="text-base font-semibold text-white mb-4">
                      Project Actions
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleOpenModal("draft")}
                        disabled={isSubmitting}
                        className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save as Draft
                      </button>
                      <button
                        onClick={() => handleOpenModal("publish")}
                        disabled={isSubmitting}
                        className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Publish Project
                      </button>
                    </div>
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
              Quick Tips
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <h5 className="font-medium text-white text-sm">
                    Prepare Files
                  </h5>
                  <p className="text-gray-400 text-xs">
                    Include index.html and all assets in your zip
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <h5 className="font-medium text-white text-sm">
                    Upload & Test
                  </h5>
                  <p className="text-gray-400 text-xs">
                    Preview your game before publishing
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 sm:col-span-2 lg:col-span-1">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <h5 className="font-medium text-white text-sm">
                    Publish & Earn
                  </h5>
                  <p className="text-gray-400 text-xs">
                    Set price and start earning from your games
                  </p>
                </div>
              </div>
            </div>
          </div>

          {hasProject && (
            <div className="mt-6 sm:mt-8 text-center">
              <button
                onClick={onBackToMain}
                className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Continue to Project Details</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Project Information Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  {modalType === "publish" ? (
                    <Globe className="w-6 h-6 text-indigo-400" />
                  ) : (
                    <Save className="w-6 h-6 text-gray-400" />
                  )}
                  <h2 className="text-xl font-bold text-white">
                    {modalType === "publish"
                      ? "Publish Project"
                      : "Save as Draft"}
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Describe your project"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleFormChange("price", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleFormChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    <option value="action">Action</option>
                    <option value="puzzle">Puzzle</option>
                    <option value="strategy">Strategy</option>
                    <option value="arcade">Arcade</option>
                    <option value="simulation">Simulation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleFormChange("tags", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="webgl, game, interactive"
                  />
                </div>
              </form>

              {/* Divider */}
              <div className="border-t border-gray-600 mt-8 mb-8"></div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.title.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {modalType === "publish" ? "Publishing..." : "Saving..."}
                    </>
                  ) : modalType === "publish" ? (
                    "Publish"
                  ) : (
                    "Save Draft"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default UploadView;
