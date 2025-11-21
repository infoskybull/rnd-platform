import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { useAuth } from "../hooks/useAuth";
import { PromptPanel } from "../components/ai-generator/PromptPanel";
import { PreviewPanel } from "../components/ai-generator/PreviewPanel";
import { generateGameCodeStream } from "../services/geminiService";
import {
  PlanAccessRequirement,
  getPlanCode,
  meetsPlanRequirements,
} from "../utils/planAccess";
import { useFileUpload } from "../hooks/useFileUpload";
import { useProjectCreation } from "../hooks/useProjectCreation";
import { Upload, Globe, Save, X, CheckCircle, AlertCircle } from "lucide-react";

declare const JSZip: any;

const INITIAL_HTML_PLACEHOLDER = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Preview</title>
    <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #1f2937; color: #d1d5db; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; text-align: center; }
        .container { padding: 2rem; }
        h1 { color: #f9fafb; font-size: 1.8rem; margin-bottom: 1rem; }
        p { font-size: 1rem; max-width: 400px; margin: 0 auto; line-height: 1.5; }
        .logo { font-size: 2.5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
          <svg class="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h1>AI Game Generator</h1>
        <p>Describe the game you want to create in the panel on the left, and watch it come to life here!</p>
    </div>
</body>
</html>`;

const CreateProjectAIPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const aiRequirement: PlanAccessRequirement = {
    minPlan: "pro",
    features: ["hasAdvancedFeatures"],
  };

  const [prompt, setPrompt] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>(
    INITIAL_HTML_PLACEHOLDER
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");
  const [isGenerationComplete, setIsGenerationComplete] =
    useState<boolean>(false);

  // Modal and upload states
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"publish" | "draft">("publish");
  const [uploadedFileKey, setUploadedFileKey] = useState<string>("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [creating, setCreating] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    banner: null as File | null,
    bannerPreviewUrl: "",
    bannerFileKey: "",
    attachments: [] as {
      file: File;
      previewUrl: string;
      fileKey: string;
      type: "image" | "video";
    }[],
    gameGenre: "",
    targetPlatform: "PC",
    productSaleData: {
      description: "",
      askingPrice: 0,
      tags: [] as string[],
    },
    creatorCollaborationData: {
      description: "",
      proposal: "",
      budget: 0,
      timeline: "",
      tags: [] as string[],
      skills: [] as string[],
    },
  });
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<
    ("product_sale" | "dev_collaboration")[]
  >([]);
  const [payToViewAmount, setPayToViewAmount] = useState<number>(0);

  const { uploadFile } = useFileUpload();
  const { createProject } = useProjectCreation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setIsGenerationComplete(false);
    setError(null);
    setGeneratedCode(""); // Clear previous code
    setActiveView("code"); // Switch to code view to show progress

    try {
      // Use the streaming service
      await generateGameCodeStream(prompt, (chunk) => {
        // Append chunks as they arrive
        setGeneratedCode((prevCode) => prevCode + chunk);
      });
      // Mark generation as complete when streaming finishes
      setIsGenerationComplete(true);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setError(
        `Failed to generate game. ${errorMessage}. Please check your API key and try again.`
      );
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  const handleExamplePrompt = (example: string) => {
    setPrompt(example);
    setIsGenerationComplete(false); // Reset completion state when selecting new example
  };

  // Helper function to convert HTML content to a ZIP file
  const createHtmlZipFile = async (
    htmlContent: string,
    filename: string = "ai-generated-game.zip"
  ): Promise<File> => {
    const JSZip = (window as any).JSZip;
    const zip = new JSZip();

    // Add the HTML content as index.html in the zip
    zip.file("index.html", htmlContent);

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    return new File([zipBlob], filename, { type: "application/zip" });
  };

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleCreate = async () => {
    if (!generatedCode || generatedCode === INITIAL_HTML_PLACEHOLDER) {
      showToastMessage("Please generate a game first", "error");
      return;
    }

    setIsUploading(true);
    try {
      // Convert HTML to ZIP file
      const zipFile = await createHtmlZipFile(generatedCode);

      // Upload to S3
      const result = await uploadFile(zipFile);

      if (result.error) {
        showToastMessage(`Upload failed: ${result.error}`, "error");
        setIsUploading(false);
        return;
      }

      // Store uploaded file info
      setUploadedFileKey(result.fileKey);
      setUploadedFileUrl(result.uploadUrl || "");

      // Show choice modal to choose draft or publish
      setShowChoiceModal(true);
      showToastMessage("Source uploaded successfully!", "success");
    } catch (error) {
      console.error("Upload error:", error);
      showToastMessage(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenModal = (type: "publish" | "draft") => {
    if (!uploadedFileKey) {
      showToastMessage("Please upload source first", "error");
      return;
    }
    setModalType(type);
    setShowChoiceModal(false);
    setShowModal(true);
  };

  const handleCloseChoiceModal = () => {
    setShowChoiceModal(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      title: "",
      shortDescription: "",
      banner: null,
      bannerPreviewUrl: "",
      bannerFileKey: "",
      attachments: [],
      gameGenre: "",
      targetPlatform: "PC",
      productSaleData: {
        description: "",
        askingPrice: 0,
        tags: [],
      },
      creatorCollaborationData: {
        description: "",
        proposal: "",
        budget: 0,
        timeline: "",
        tags: [],
        skills: [],
      },
    });
    setSelectedProjectTypes([]);
    setPayToViewAmount(0);
    // Show Choose Action modal again when closing the form modal
    if (uploadedFileKey) {
      setShowChoiceModal(true);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleBannerUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToastMessage("Please select an image file for the banner", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToastMessage("Banner image size should be less than 10MB", "error");
      return;
    }

    try {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        banner: file,
        bannerPreviewUrl: previewUrl,
      }));

      const result = await uploadFile(file);
      if (result.error) {
        throw new Error(result.error);
      }

      setFormData((prev) => ({
        ...prev,
        bannerFileKey: result.fileKey,
      }));
      showToastMessage("Banner uploaded successfully!", "success");
    } catch (error) {
      showToastMessage(
        `Banner upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    }
  };

  const handleBannerRemove = () => {
    if (formData.bannerPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(formData.bannerPreviewUrl);
    }
    setFormData((prev) => ({
      ...prev,
      banner: null,
      bannerPreviewUrl: "",
      bannerFileKey: "",
    }));
  };

  const handleAttachmentsUpload = async (files: FileList) => {
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        if (!isImage && !isVideo) {
          throw new Error(`${file.name} is not an image or video file`);
        }

        const previewUrl = URL.createObjectURL(file);
        const attachment = {
          file,
          previewUrl,
          fileKey: "",
          type: (isImage ? "image" : "video") as "image" | "video",
        };

        setFormData((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), attachment],
        }));

        const result = await uploadFile(file);
        if (result.error) {
          throw new Error(result.error);
        }

        setFormData((prev) => ({
          ...prev,
          attachments:
            prev.attachments?.map((att) =>
              att.file === file ? { ...att, fileKey: result.fileKey } : att
            ) || [],
        }));

        return attachment;
      });

      await Promise.all(uploadPromises);
      showToastMessage(
        `${files.length} attachment(s) uploaded successfully!`,
        "success"
      );
    } catch (error) {
      showToastMessage(
        `Failed to upload attachments: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    }
  };

  const handleAttachmentRemove = (index: number) => {
    const attachment = formData.attachments?.[index];
    if (attachment && attachment.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToastMessage("Please enter a project title", "error");
      return;
    }

    if (!formData.shortDescription.trim()) {
      showToastMessage("Please enter a short description", "error");
      return;
    }

    if (selectedProjectTypes.length === 0) {
      showToastMessage("Please select at least one project type", "error");
      return;
    }

    setCreating(true);
    try {
      const projectData: any = {
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim(),
        projectType: selectedProjectTypes,
        repoFormat: "html",
        status: (modalType === "publish" ? "published" : "draft") as
          | "draft"
          | "published",
        payToViewAmount: payToViewAmount,
        fileKeys: [uploadedFileKey],
        fileUrls: uploadedFileUrl ? [uploadedFileUrl] : undefined,
        thumbnail: formData.bannerFileKey || undefined,
        attachments:
          formData.attachments
            ?.map((att) => att.fileKey)
            .filter((fileKey) => fileKey) || [],
      };

      // Add package-specific data
      if (selectedProjectTypes.includes("product_sale")) {
        projectData.productSaleData = {
          description: formData.productSaleData?.description || "",
          askingPrice: formData.productSaleData?.askingPrice || 0,
          gameGenre: formData.gameGenre || "",
          targetPlatform: formData.targetPlatform || "PC",
          tags: formData.productSaleData?.tags || [],
        };
      }

      if (selectedProjectTypes.includes("dev_collaboration")) {
        projectData.creatorCollaborationData = {
          proposal: formData.creatorCollaborationData?.proposal || "",
          budget: formData.creatorCollaborationData?.budget || 0,
          timeline: formData.creatorCollaborationData?.timeline || "",
          gameGenre: formData.gameGenre || "",
          targetPlatform: formData.targetPlatform || "PC",
          tags: formData.creatorCollaborationData?.tags || [],
          skills: formData.creatorCollaborationData?.skills || [],
        };
      }

      const result = await createProject(projectData);

      if (result.success) {
        const message =
          modalType === "publish"
            ? "Project published successfully!"
            : "Project saved as draft!";
        showToastMessage(message, "success");
        setShowModal(false);
        setShowChoiceModal(false);

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        showToastMessage(result.error || "Failed to create project", "error");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      showToastMessage("Failed to create project. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  };

  // DEBUG for CODE
  // if (!meetsPlanRequirements(user || null, aiRequirement)) {
  //   const requiredPlan = aiRequirement.minPlan ?? "pro";
  //   const currentPlan = getPlanCode(user || null);
  //   return (
  //     <div className="min-h-screen bg-gray-dark text-gray-text flex items-center justify-center px-4">
  //       <div className="max-w-xl w-full bg-gray-900 border border-gray-700 rounded-2xl p-8 space-y-6 text-center">
  //         <h1 className="text-3xl font-semibold text-white">
  //           Upgrade Required
  //         </h1>
  //         <p className="text-gray-400">
  //           The AI Game Generator is available starting from the{" "}
  //           <span className="font-semibold text-indigo-300 capitalize">
  //             {requiredPlan}
  //           </span>{" "}
  //           plan. Your current plan{" "}
  //           <span className="font-semibold text-white capitalize">
  //             {currentPlan}
  //           </span>{" "}
  //           does not include this feature.
  //         </p>
  //         <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
  //           <button
  //             onClick={() =>
  //               navigate("/plan?required=ai-generator", { replace: true })
  //             }
  //             className="px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
  //           >
  //             View Plans
  //           </button>
  //           <button
  //             onClick={() => navigate(-1)}
  //             className="px-5 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
  //           >
  //             Go Back
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="h-screen bg-gray-dark text-gray-text font-sans flex flex-col overflow-hidden">
      <ResponsiveNavbar
        title="AI Studio"
        titleColor="text-purple-400"
        user={user}
        onLogout={handleLogout}
        backButton={{
          text: "Back",
          onClick: () => navigate("/create-project"),
        }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <div className="flex-1 lg:flex-none lg:w-1/2 min-h-0 overflow-hidden">
          <PromptPanel
            prompt={prompt}
            setPrompt={(newPrompt) => {
              setPrompt(newPrompt);
              if (newPrompt !== prompt) {
                setIsGenerationComplete(false); // Reset completion state when prompt changes
              }
            }}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            onExampleSelect={handleExamplePrompt}
            onCreate={handleCreate}
            hasGeneratedCode={isGenerationComplete && !isLoading}
          />
        </div>
        <div className="flex-1 lg:flex-none lg:w-1/2 border-t lg:border-t-0 lg:border-l border-gray-600 min-h-0 overflow-hidden">
          <PreviewPanel
            code={generatedCode}
            isLoading={isLoading}
            error={error}
            view={activeView}
            setView={setActiveView}
          />
        </div>
      </main>

      {/* Choice Modal - Choose Draft or Publish */}
      {showChoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Choose Action</h2>
                <button
                  onClick={handleCloseChoiceModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-300 mb-6">
                Source has been uploaded successfully. Would you like to publish
                your project or save it as a draft?
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleOpenModal("draft")}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save as Draft
                </button>
                <button
                  onClick={() => handleOpenModal("publish")}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Globe className="w-5 h-5" />
                  Publish Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Information Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                    Short Description *
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) =>
                      handleFormChange("shortDescription", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Brief description of your project"
                    required
                  />
                </div>

                {/* Project Banner Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Banner
                  </label>
                  <div className="space-y-3">
                    {formData.bannerPreviewUrl && (
                      <div className="relative">
                        <img
                          src={formData.bannerPreviewUrl}
                          alt="Project banner preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={handleBannerRemove}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleBannerUpload(file);
                          }
                        }}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label
                        htmlFor="banner-upload"
                        className="flex-1 px-4 py-2 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer transition-colors hover:border-indigo-500 hover:bg-gray-700"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-300">
                            {formData.bannerPreviewUrl
                              ? "Change Banner"
                              : "Upload Project Banner"}
                          </span>
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-400">
                      Recommended size: 1200x400px. Max file size: 10MB
                    </p>
                  </div>
                </div>

                {/* Project Attachments Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Attachments
                  </label>
                  <div className="space-y-3">
                    {formData.attachments &&
                      formData.attachments.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {formData.attachments.map((attachment, index) => (
                            <div key={index} className="relative">
                              {attachment.type === "image" ? (
                                <img
                                  src={attachment.previewUrl}
                                  alt={`Attachment ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-600"
                                />
                              ) : (
                                <video
                                  src={attachment.previewUrl}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-600"
                                  controls={false}
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => handleAttachmentRemove(index)}
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                {attachment.type}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            handleAttachmentsUpload(files);
                          }
                        }}
                        className="hidden"
                        id="attachments-upload"
                      />
                      <label
                        htmlFor="attachments-upload"
                        className="flex-1 px-4 py-2 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer transition-colors hover:border-indigo-500 hover:bg-gray-700"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-300">
                            Upload Images/Videos
                          </span>
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-400">
                      Supported formats: JPG, PNG, GIF, MP4, AVI, MOV. Max size:
                      10MB for images, 50MB for videos
                    </p>
                  </div>
                </div>

                {/* Pay to View Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pay to View Amount ($) *
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Set the amount users must pay to view this project
                  </p>
                  <input
                    type="number"
                    value={payToViewAmount}
                    onChange={(e) =>
                      setPayToViewAmount(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Project Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Type(s) *
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Select one or more project types
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProjectTypes.includes("product_sale")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjectTypes([
                              ...selectedProjectTypes,
                              "product_sale",
                            ]);
                          } else {
                            setSelectedProjectTypes(
                              selectedProjectTypes.filter(
                                (t) => t !== "product_sale"
                              )
                            );
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-white">Product Sale</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProjectTypes.includes(
                          "dev_collaboration"
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjectTypes([
                              ...selectedProjectTypes,
                              "dev_collaboration",
                            ]);
                          } else {
                            setSelectedProjectTypes(
                              selectedProjectTypes.filter(
                                (t) => t !== "dev_collaboration"
                              )
                            );
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-white">
                        Development Collaboration
                      </span>
                    </label>
                  </div>
                </div>

                {/* Common fields for all project types */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Game Genre
                    </label>
                    <select
                      value={formData.gameGenre || ""}
                      onChange={(e) =>
                        handleFormChange("gameGenre", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select genre</option>
                      <option value="action">Action</option>
                      <option value="adventure">Adventure</option>
                      <option value="puzzle">Puzzle</option>
                      <option value="strategy">Strategy</option>
                      <option value="arcade">Arcade</option>
                      <option value="simulation">Simulation</option>
                      <option value="rpg">RPG</option>
                      <option value="racing">Racing</option>
                      <option value="sports">Sports</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Platform
                    </label>
                    <select
                      value={formData.targetPlatform || "PC"}
                      onChange={(e) =>
                        handleFormChange("targetPlatform", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="PC">PC</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Console">Console</option>
                      <option value="Web">Web</option>
                      <option value="VR">VR</option>
                      <option value="Multi-platform">Multi-platform</option>
                    </select>
                  </div>
                </div>

                {/* Project type specific fields */}
                {selectedProjectTypes.includes("product_sale") && (
                  <div className="space-y-4 border-t border-gray-600 pt-4">
                    <h3 className="text-lg font-semibold text-white">
                      Product Sale Details
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.productSaleData?.description || ""}
                        onChange={(e) =>
                          handleFormChange("productSaleData.description", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        placeholder="Describe your product..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Asking Price ($)
                      </label>
                      <input
                        type="number"
                        value={formData.productSaleData?.askingPrice || ""}
                        onChange={(e) =>
                          handleFormChange(
                            "productSaleData.askingPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                {selectedProjectTypes.includes("dev_collaboration") && (
                  <div className="space-y-4 border-t border-gray-600 pt-4">
                    <h3 className="text-lg font-semibold text-white">
                      Collaboration Details
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Proposal
                      </label>
                      <textarea
                        value={formData.creatorCollaborationData?.proposal || ""}
                        onChange={(e) =>
                          handleFormChange("creatorCollaborationData.proposal", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        placeholder="Your collaboration proposal..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Budget ($)
                      </label>
                      <input
                        type="number"
                        value={formData.creatorCollaborationData?.budget || ""}
                        onChange={(e) =>
                          handleFormChange(
                            "creatorCollaborationData.budget",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Timeline
                      </label>
                      <input
                        type="text"
                        value={formData.creatorCollaborationData?.timeline || ""}
                        onChange={(e) =>
                          handleFormChange("creatorCollaborationData.timeline", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 3 months"
                      />
                    </div>
                  </div>
                )}
              </form>

              {/* Divider */}
              <div className="border-t border-gray-600 mt-8 mb-8"></div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCloseModal}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    creating ||
                    !formData.title.trim() ||
                    !formData.shortDescription.trim()
                  }
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creating ? (
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

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
            toastType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Upload Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="text-white text-lg">Uploading source to S3...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProjectAIPage;
