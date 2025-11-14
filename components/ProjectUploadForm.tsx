import React, { useState, useEffect, useCallback, useRef } from "react";
import { User } from "../types";
import { useFileUpload } from "../hooks/useFileUpload";
import { useProjectCreation } from "../hooks/useProjectCreation";
import { apiService } from "../services/api";
import {
  Upload,
  ArrowLeft,
  CheckCircle,
  Save,
  Globe,
  X,
  AlertCircle,
} from "lucide-react";
import RnDLogo from "./icons/RnDLogo";
import RoleBadge from "./RoleBadge";
import {
  getFileTypeInfo,
  formatFileSize,
  SUPPORTED_FILE_TYPES,
} from "../utils/fileUtils";
import { WarningIcon } from "./icons/Icons";

interface ProjectUploadFormProps {
  user: User;
  onBackToMain: () => void;
  onSuccess?: (projectId: string) => void;
  preUploadedFile?: File;
  preHtmlContent?: string;
  autoUpload?: boolean; // Thêm prop để control auto upload
  showHeader?: boolean; // Thêm prop để control việc hiển thị header
}

interface ProjectFormData {
  title: string;
  shortDescription: string;
  projectType: "idea_sale" | "product_sale" | "dev_collaboration";
  status?: "draft" | "published"; // Add status field
  banner?: File | null;
  bannerPreviewUrl?: string; // For preview display
  bannerFileKey?: string; // For storage
  attachments?: {
    file: File;
    previewUrl: string;
    fileKey: string;
    type: "image" | "video";
  }[];
  ideaSaleData?: {
    description: string;
    askingPrice: number;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
  };
  productSaleData?: {
    description: string;
    codeFolderPath: string;
    askingPrice: number;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
  };
  creatorCollaborationData?: {
    description: string;
    proposal: string;
    budget: number;
    timeline: string;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
    skills?: string[];
  };
}

const ProjectUploadForm: React.FC<ProjectUploadFormProps> = ({
  user,
  onBackToMain,
  onSuccess,
  preUploadedFile,
  preHtmlContent,
  autoUpload = true, // Default là true để giữ behavior hiện tại
  showHeader = true, // Default là true để giữ behavior hiện tại
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"publish" | "draft">("publish");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [uploadedFiles, setUploadedFiles] = useState<
    { fileKey: string; uploadUrl: string }[]
  >([]);
  const [hasAutoUploaded, setHasAutoUploaded] = useState(false);
  const autoUploadRef = useRef(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);
  const [attachmentsUploadProgress, setAttachmentsUploadProgress] = useState(0);

  const { uploadFile, uploading, uploadProgress, cancelUpload } =
    useFileUpload();
  const { createProject, creating } = useProjectCreation();

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

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    shortDescription: "",
    projectType: "idea_sale",
    banner: null,
    bannerPreviewUrl: "",
    bannerFileKey: "",
    attachments: [],
    ideaSaleData: {
      description: "",
      askingPrice: 0,
      gameGenre: "",
      targetPlatform: "PC",
      tags: [],
    },
  });

  // Handle pre-uploaded file - only run once
  useEffect(() => {
    if (preUploadedFile && !autoUploadRef.current && autoUpload) {
      autoUploadRef.current = true;
      setFiles([preUploadedFile]);
      // Auto-upload the pre-uploaded file
      const autoUpload = async () => {
        const uploadedFileData: { fileKey: string; uploadUrl: string }[] = [];
        try {
          const result = await uploadFile(preUploadedFile);
          if (result.error) {
            showToastMessage(
              `Failed to upload ${preUploadedFile.name}: ${result.error}`,
              "error"
            );
            return;
          }
          uploadedFileData.push({
            fileKey: result.fileKey,
            uploadUrl: result.uploadUrl,
          });
          setUploadedFiles(uploadedFileData);
          setHasAutoUploaded(true);
          showToastMessage("Files uploaded successfully!", "success");
        } catch (error) {
          showToastMessage("Upload failed. Please try again.", "error");
        }
      };
      autoUpload();
    } else if (preUploadedFile && !autoUploadRef.current && !autoUpload) {
      // Chỉ set files mà không auto upload
      autoUploadRef.current = true;
      setFiles([preUploadedFile]);
    }
  }, [preUploadedFile, autoUpload]); // Thêm autoUpload vào dependencies

  // Handle pre-html content - convert to ZIP file and add to files state without auto-uploading
  useEffect(() => {
    if (preHtmlContent && !preUploadedFile) {
      const createZipFile = async () => {
        try {
          const zipFile = await createHtmlZipFile(preHtmlContent);
          setFiles([zipFile]);
        } catch (error) {
          console.error("Error creating ZIP file:", error);
          // Fallback to HTML file if ZIP creation fails
          const blob = new Blob([preHtmlContent], { type: "text/html" });
          const htmlFile = new File([blob], "ai-generated-game.html", {
            type: "text/html",
          });
          setFiles([htmlFile]);
        }
      };
      createZipFile();
    }
  }, [preHtmlContent, preUploadedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) {
      showToastMessage("Please select files to upload", "error");
      return;
    }

    // If we already have uploaded files from preview, don't upload again
    if (hasAutoUploaded && uploadedFiles.length > 0) {
      showToastMessage("Files already uploaded from preview", "success");
      return;
    }

    const uploadedFileData: { fileKey: string; uploadUrl: string }[] = [];

    try {
      for (const file of files) {
        const result = await uploadFile(file);
        if (result.error) {
          showToastMessage(
            `Failed to upload ${file.name}: ${result.error}`,
            "error"
          );
          return;
        }
        uploadedFileData.push({
          fileKey: result.fileKey,
          uploadUrl: result.uploadUrl,
        });
      }

      setUploadedFiles(uploadedFileData);
      showToastMessage("Files uploaded successfully!", "success");
    } catch (error) {
      showToastMessage("Upload failed. Please try again.", "error");
    }
  };

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleOpenModal = (type: "publish" | "draft") => {
    if (uploadedFiles.length === 0 && files.length > 0 && !hasAutoUploaded) {
      showToastMessage("Please upload files first", "error");
      return;
    }
    setModalType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      title: "",
      shortDescription: "",
      projectType: "idea_sale",
      ideaSaleData: {
        description: "",
        askingPrice: 0,
        gameGenre: "",
        targetPlatform: "PC",
        tags: [],
      },
    });
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

    // Validate file type (only images)
    if (!file.type.startsWith("image/")) {
      showToastMessage("Please select an image file for the banner", "error");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToastMessage("Banner image size should be less than 10MB", "error");
      return;
    }

    // Create preview URL from file immediately
    const previewUrl = URL.createObjectURL(file);

    // Update form data with banner file and preview URL
    setFormData((prev) => ({
      ...prev,
      banner: file,
      bannerPreviewUrl: previewUrl,
    }));

    setBannerUploading(true);
    setBannerUploadProgress(0);

    try {
      const result = await uploadFile(file);
      if (result.error) {
        showToastMessage(`Banner upload failed: ${result.error}`, "error");
        // Remove the preview if upload failed
        setFormData((prev) => ({
          ...prev,
          banner: null,
          bannerPreviewUrl: "",
          bannerFileKey: "",
        }));
        URL.revokeObjectURL(previewUrl);
        return;
      }

      // Update form data with the actual uploaded file key (keep preview URL for display)
      setFormData((prev) => ({
        ...prev,
        bannerFileKey: result.fileKey, // Store fileKey for backend
      }));

      showToastMessage("Banner uploaded successfully!", "success");
    } catch (error) {
      console.error("Banner upload error:", error);
      showToastMessage("Failed to upload banner. Please try again.", "error");
      // Remove the preview if upload failed
      setFormData((prev) => ({
        ...prev,
        banner: null,
        bannerPreviewUrl: "",
        bannerFileKey: "",
      }));
      URL.revokeObjectURL(previewUrl);
    } finally {
      setBannerUploading(false);
      setBannerUploadProgress(0);
    }
  };

  const handleBannerRemove = () => {
    // Revoke the object URL to free memory
    if (
      formData.bannerPreviewUrl &&
      formData.bannerPreviewUrl.startsWith("blob:")
    ) {
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
    if (!files || files.length === 0) return;

    setAttachmentsUploading(true);
    setAttachmentsUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          throw new Error(
            `File ${file.name} is not a supported image or video format`
          );
        }

        // Validate file size (max 50MB for videos, 10MB for images)
        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(
            `File ${file.name} is too large. Max size: ${
              isVideo ? "50MB" : "10MB"
            }`
          );
        }

        // Create preview URL from file immediately
        const previewUrl = URL.createObjectURL(file);

        // Add to form data immediately with preview
        const attachment = {
          file,
          previewUrl: previewUrl,
          fileKey: "", // Will be set after upload
          type: isImage ? ("image" as const) : ("video" as const),
        };

        setFormData((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), attachment],
        }));

        // Upload to server
        const result = await uploadFile(file);
        if (result.error) {
          throw new Error(result.error);
        }

        // Update the attachment with fileKey (keep preview URL for display)
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
      console.error("Attachments upload error:", error);
      showToastMessage(
        `Failed to upload attachments: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setAttachmentsUploading(false);
      setAttachmentsUploadProgress(0);
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

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      if (
        formData.bannerPreviewUrl &&
        formData.bannerPreviewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(formData.bannerPreviewUrl);
      }

      // Cleanup attachments URLs
      formData.attachments?.forEach((attachment) => {
        if (attachment.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, [formData.bannerPreviewUrl, formData.attachments]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToastMessage("Please enter a project title", "error");
      return;
    }

    if (!formData.shortDescription.trim()) {
      showToastMessage("Please enter a short description", "error");
      return;
    }

    try {
      // Automatically extract fileKeys and fileUrls from uploaded files
      // fileKeys = fileKey từ presigned-url response
      // fileUrls = uploadUrl từ presigned-url response
      const fileKeys = uploadedFiles.map((file) => file.fileKey);
      const fileUrls = uploadedFiles.map((file) => file.uploadUrl);

      // Prepare banner for thumbnail field (store fileKey)
      const thumbnail = formData.bannerFileKey || undefined;

      // Prepare attachments fileKeys (excluding banner)
      const attachmentFileKeys =
        formData.attachments
          ?.map((attachment) => attachment.fileKey)
          .filter((fileKey) => fileKey) || [];

      const projectData = {
        ...formData,
        status: (modalType === "publish" ? "published" : "draft") as
          | "draft"
          | "published", // Set status based on modal type
        fileKeys: fileKeys.length > 0 ? fileKeys : undefined,
        fileUrls: fileUrls.length > 0 ? fileUrls : undefined,
        thumbnail: thumbnail,
        attachments:
          attachmentFileKeys.length > 0 ? attachmentFileKeys : undefined,
      };

      const result = await createProject(projectData);

      if (result.success) {
        const message =
          modalType === "publish"
            ? "Project published successfully!"
            : "Project saved as draft!";

        showToastMessage(message, "success");
        setShowModal(false);

        setTimeout(() => {
          if (onSuccess && result.projectId) {
            onSuccess(result.projectId);
          } else {
            onBackToMain();
          }
        }, 2000);
      } else {
        showToastMessage(result.error || "Failed to create project", "error");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      showToastMessage("Failed to create project. Please try again.", "error");
    }
  };

  const renderProjectTypeForm = () => {
    switch (formData.projectType) {
      case "idea_sale":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Idea Description *
              </label>
              <textarea
                value={formData.ideaSaleData?.description || ""}
                onChange={(e) =>
                  handleFormChange("ideaSaleData.description", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Describe your game idea in detail"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Asking Price ($) *
              </label>
              <input
                type="number"
                value={formData.ideaSaleData?.askingPrice || ""}
                onChange={(e) =>
                  handleFormChange(
                    "ideaSaleData.askingPrice",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </>
        );

      case "product_sale":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Description *
              </label>
              <textarea
                value={formData.productSaleData?.description || ""}
                onChange={(e) =>
                  handleFormChange(
                    "productSaleData.description",
                    e.target.value
                  )
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Describe your game product"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Code Folder Path *
              </label>
              <input
                type="text"
                value={formData.productSaleData?.codeFolderPath || ""}
                onChange={(e) =>
                  handleFormChange(
                    "productSaleData.codeFolderPath",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="/path/to/code"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Asking Price ($) *
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </>
        );

      case "dev_collaboration":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Collaboration Description *
              </label>
              <textarea
                value={formData.creatorCollaborationData?.description || ""}
                onChange={(e) =>
                  handleFormChange(
                    "creatorCollaborationData.description",
                    e.target.value
                  )
                }
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Describe the collaboration opportunity"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposal *
              </label>
              <textarea
                value={formData.creatorCollaborationData?.proposal || ""}
                onChange={(e) =>
                  handleFormChange(
                    "creatorCollaborationData.proposal",
                    e.target.value
                  )
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Describe your proposal for collaboration"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget ($) *
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeline *
                </label>
                <input
                  type="text"
                  value={formData.creatorCollaborationData?.timeline || ""}
                  onChange={(e) =>
                    handleFormChange(
                      "creatorCollaborationData.timeline",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., 3 months, 6 weeks"
                  required
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      {showHeader && (
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
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 rounded-full mb-3 sm:mb-4">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
              Create Your Game Project
            </h2>
            <p className="text-base sm:text-lg text-gray-400 mb-3 sm:mb-4">
              Upload files and create your project to start earning
            </p>
          </div>

          {/* File Upload Section */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Upload Files
            </h3>

            <div className="mb-4">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept="video/*,image/*,.zip,.rar,.7z"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-400">
                  <strong>Supported formats:</strong>
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>
                    • <strong>Videos:</strong>{" "}
                    {SUPPORTED_FILE_TYPES.video.extensions.join(", ")} (
                    {SUPPORTED_FILE_TYPES.video.maxSize})
                  </div>
                  <div>
                    • <strong>Images:</strong>{" "}
                    {SUPPORTED_FILE_TYPES.image.extensions.join(", ")} (
                    {SUPPORTED_FILE_TYPES.image.maxSize})
                  </div>
                  <div>
                    • <strong>Archives:</strong>{" "}
                    {SUPPORTED_FILE_TYPES.archive.extensions.join(", ")} (
                    {SUPPORTED_FILE_TYPES.archive.maxSize})
                  </div>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Selected Files:
                </h4>
                <ul className="space-y-2">
                  {files.map((file, index) => {
                    const fileInfo = getFileTypeInfo(file);

                    return (
                      <li
                        key={index}
                        className="flex items-center space-x-3 p-2 bg-gray-700/50 rounded-lg"
                      >
                        <span className="text-lg">{fileInfo.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {fileInfo.category} • {formatFileSize(file.size)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleUploadFiles}
                disabled={
                  files.length === 0 ||
                  uploading ||
                  creating ||
                  (hasAutoUploaded && uploadedFiles.length > 0)
                }
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? "Uploading..."
                  : hasAutoUploaded && uploadedFiles.length > 0
                  ? "Files Ready"
                  : "Upload Files"}
              </button>

              {uploading && (
                <button
                  onClick={cancelUpload}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">
                    {uploadedFiles.length} file(s) uploaded successfully
                    {hasAutoUploaded && " (from preview)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleOpenModal("draft")}
              disabled={
                uploading ||
                creating ||
                (uploadedFiles.length === 0 && !hasAutoUploaded)
              }
              className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5 mr-2" />
              Save as Draft
            </button>
            <button
              onClick={() => handleOpenModal("publish")}
              disabled={
                uploading ||
                creating ||
                (uploadedFiles.length === 0 && !hasAutoUploaded)
              }
              className="flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Globe className="w-5 h-5 mr-2" />
              Publish Project
            </button>
          </div>
        </div>
      </main>

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
                    {/* Banner Preview */}
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

                    {/* Upload Progress */}
                    {bannerUploading && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${bannerUploadProgress}%` }}
                        ></div>
                      </div>
                    )}

                    {/* File Input */}
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
                        disabled={bannerUploading}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label
                        htmlFor="banner-upload"
                        className={`flex-1 px-4 py-2 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer transition-colors ${
                          bannerUploading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:border-indigo-500 hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-300">
                            {bannerUploading
                              ? "Uploading..."
                              : formData.bannerPreviewUrl
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
                    {/* Attachments Preview */}
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

                    {/* Upload Progress */}
                    {attachmentsUploading && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${attachmentsUploadProgress}%` }}
                        ></div>
                      </div>
                    )}

                    {/* File Input */}
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
                        disabled={attachmentsUploading}
                        className="hidden"
                        id="attachments-upload"
                      />
                      <label
                        htmlFor="attachments-upload"
                        className={`flex-1 px-4 py-2 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer transition-colors ${
                          attachmentsUploading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:border-indigo-500 hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-300">
                            {attachmentsUploading
                              ? "Uploading..."
                              : "Upload Images/Videos"}
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Type *
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => {
                      const newType = e.target.value as
                        | "idea_sale"
                        | "product_sale"
                        | "dev_collaboration";
                      handleFormChange("projectType", newType);
                      // Reset project type specific data
                      if (newType === "idea_sale") {
                        setFormData((prev) => ({
                          ...prev,
                          projectType: newType,
                          ideaSaleData: {
                            description: "",
                            askingPrice: 0,
                            gameGenre: "",
                            targetPlatform: "PC",
                            tags: [],
                          },
                          productSaleData: undefined,
                          creatorCollaborationData: undefined,
                        }));
                      } else if (newType === "product_sale") {
                        setFormData((prev) => ({
                          ...prev,
                          projectType: newType,
                          productSaleData: {
                            description: "",
                            codeFolderPath: "",
                            askingPrice: 0,
                            gameGenre: "",
                            targetPlatform: "PC",
                            tags: [],
                          },
                          ideaSaleData: undefined,
                          creatorCollaborationData: undefined,
                        }));
                      } else if (newType === "dev_collaboration") {
                        setFormData((prev) => ({
                          ...prev,
                          projectType: newType,
                          creatorCollaborationData: {
                            description: "",
                            proposal: "",
                            budget: 0,
                            timeline: "",
                            gameGenre: "",
                            targetPlatform: "PC",
                            tags: [],
                            skills: [],
                          },
                          ideaSaleData: undefined,
                          productSaleData: undefined,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="idea_sale">Idea Sale</option>
                    <option value="product_sale">Product Sale</option>
                    <option value="dev_collaboration">
                      Development Collaboration
                    </option>
                  </select>
                </div>

                {/* Common fields for all project types */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Game Genre
                    </label>
                    <select
                      value={
                        formData.ideaSaleData?.gameGenre ||
                        formData.productSaleData?.gameGenre ||
                        formData.creatorCollaborationData?.gameGenre ||
                        ""
                      }
                      onChange={(e) => {
                        const genre = e.target.value;
                        if (formData.projectType === "idea_sale") {
                          handleFormChange("ideaSaleData.gameGenre", genre);
                        } else if (formData.projectType === "product_sale") {
                          handleFormChange("productSaleData.gameGenre", genre);
                        } else if (
                          formData.projectType === "dev_collaboration"
                        ) {
                          handleFormChange(
                            "creatorCollaborationData.gameGenre",
                            genre
                          );
                        }
                      }}
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
                      value={
                        formData.ideaSaleData?.targetPlatform ||
                        formData.productSaleData?.targetPlatform ||
                        formData.creatorCollaborationData?.targetPlatform ||
                        "PC"
                      }
                      onChange={(e) => {
                        const platform = e.target.value;
                        if (formData.projectType === "idea_sale") {
                          handleFormChange(
                            "ideaSaleData.targetPlatform",
                            platform
                          );
                        } else if (formData.projectType === "product_sale") {
                          handleFormChange(
                            "productSaleData.targetPlatform",
                            platform
                          );
                        } else if (
                          formData.projectType === "dev_collaboration"
                        ) {
                          handleFormChange(
                            "creatorCollaborationData.targetPlatform",
                            platform
                          );
                        }
                      }}
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
                {renderProjectTypeForm()}
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
    </div>
  );
};

export default ProjectUploadForm;
