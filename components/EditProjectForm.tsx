import React, { useState, useEffect } from "react";
import { User, GameProject } from "../types";
import { useFileUpload } from "../hooks/useFileUpload";
import { apiService } from "../services/api";
import {
  Upload,
  ArrowLeft,
  CheckCircle,
  Save,
  Globe,
  X,
} from "lucide-react";
import RnDLogo from "./icons/RnDLogo";
import RoleBadge from "./RoleBadge";

interface EditProjectFormProps {
  user: User;
  project: GameProject;
  onBackToDetail: () => void;
  onSuccess?: () => void;
  showHeader?: boolean;
}

interface ProjectFormData {
  title: string;
  shortDescription: string;
  projectType: "idea_sale" | "product_sale" | "dev_collaboration";
  status?: "draft" | "published";
  banner?: File | null;
  bannerPreviewUrl?: string;
  bannerFileKey?: string;
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

const EditProjectForm: React.FC<EditProjectFormProps> = ({
  user,
  project,
  onBackToDetail,
  onSuccess,
  showHeader = true,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"publish" | "draft">("publish");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    { fileKey: string; uploadUrl: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [existingFiles, setExistingFiles] = useState<{ url: string; name: string }[]>([]);
  const [removedFiles, setRemovedFiles] = useState<string[]>([]);

  const { uploadFile, uploading, uploadProgress, cancelUpload } =
    useFileUpload();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    shortDescription: "",
    projectType: "idea_sale",
    banner: null,
    bannerPreviewUrl: "",
    bannerFileKey: "",
    attachments: [],
  });

  // Load project data into form
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        shortDescription: project.shortDescription,
        projectType: project.projectType,
        status: project.status as "draft" | "published",
        banner: null,
        bannerPreviewUrl: project.thumbnail || "",
        bannerFileKey: project.thumbnail || "",
        attachments: project.attachments?.map(att => ({
          file: new File([], "existing"),
          previewUrl: att,
          fileKey: att,
          type: "image" as const,
        })) || [],
        ideaSaleData: project.ideaSaleData ? {
          description: project.ideaSaleData.description || "",
          askingPrice: project.ideaSaleData.askingPrice || 0,
          gameGenre: project.ideaSaleData.gameGenre || "",
          targetPlatform: project.ideaSaleData.targetPlatform || "PC",
          tags: project.ideaSaleData.tags || [],
        } : undefined,
        productSaleData: project.productSaleData ? {
          description: project.productSaleData.description || "",
          codeFolderPath: project.productSaleData.codeFolderPath || "",
          askingPrice: project.productSaleData.askingPrice || 0,
          gameGenre: project.productSaleData.gameGenre || "",
          targetPlatform: project.productSaleData.targetPlatform || "PC",
          tags: project.productSaleData.tags || [],
        } : undefined,
        creatorCollaborationData: project.creatorCollaborationData ? {
          description: project.creatorCollaborationData.description || "",
          proposal: project.creatorCollaborationData.proposal || "",
          budget: project.creatorCollaborationData.budget || 0,
          timeline: project.creatorCollaborationData.timeline || "",
          gameGenre: project.creatorCollaborationData.gameGenre || "",
          targetPlatform: project.creatorCollaborationData.targetPlatform || "PC",
          tags: project.creatorCollaborationData.tags || [],
          skills: project.creatorCollaborationData.skills || [],
        } : undefined,
      });
      setExistingFiles(project.fileUrls?.map(url => ({ url, name: url.split('/').pop() || 'File' })) || []);
      setRemovedFiles([]);
      setLoading(false);
    }
  }, [project]);

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleOpenModal = (type: "publish" | "draft") => {
    setModalType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
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

    const previewUrl = URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      banner: file,
      bannerPreviewUrl: previewUrl,
    }));

    try {
      const result = await uploadFile(file);
      if (result.error) {
        showToastMessage(`Banner upload failed: ${result.error}`, "error");
        setFormData((prev) => ({
          ...prev,
          banner: null,
          bannerPreviewUrl: "",
          bannerFileKey: "",
        }));
        URL.revokeObjectURL(previewUrl);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        bannerFileKey: result.fileKey,
      }));

      showToastMessage("Banner uploaded successfully!", "success");
    } catch (error) {
      console.error("Banner upload error:", error);
      showToastMessage("Failed to upload banner. Please try again.", "error");
      setFormData((prev) => ({
        ...prev,
        banner: null,
        bannerPreviewUrl: "",
        bannerFileKey: "",
      }));
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleBannerRemove = () => {
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

  const handleAttachmentsUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          throw new Error(
            `File ${file.name} is not a supported image or video format`
          );
        }

        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(
            `File ${file.name} is too large. Max size: ${
              isVideo ? "50MB" : "10MB"
            }`
          );
        }

        const previewUrl = URL.createObjectURL(file);

        const attachment = {
          file,
          previewUrl: previewUrl,
          fileKey: "",
          type: isImage ? ("image" as const) : ("video" as const),
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
      console.error("Attachments upload error:", error);
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

  const handleRemoveExistingFile = (url: string) => {
    setRemovedFiles(prev => [...prev, url]);
  };

  useEffect(() => {
    return () => {
      if (
        formData.bannerPreviewUrl &&
        formData.bannerPreviewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(formData.bannerPreviewUrl);
      }

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

    const remainingFiles = existingFiles.filter(f => !removedFiles.includes(f.url)).length;
    const newFiles = uploadedFiles.length;
    if (remainingFiles === 0 && newFiles === 0) {
      showToastMessage("Cannot save without any files. Please upload new files or keep existing ones.", "error");
      return;
    }

    setUpdating(true);

    try {
      const thumbnail = formData.bannerFileKey || undefined;

      const attachmentFileKeys =
        formData.attachments
          ?.map((attachment) => attachment.fileKey)
          .filter((fileKey) => fileKey) || [];

      const newFileUrls = uploadedFiles.length > 0 ? uploadedFiles.map(f => f.uploadUrl) : existingFiles.filter(f => !removedFiles.includes(f.url)).map(f => f.url);

      const updateData = {
        title: formData.title,
        shortDescription: formData.shortDescription,
        projectType: formData.projectType,
        status: (modalType === "publish" ? "published" : "draft") as
          | "draft"
          | "published",
        thumbnail: thumbnail,
        attachments: attachmentFileKeys.length > 0 ? attachmentFileKeys : undefined,
        fileKeys: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.fileKey) : undefined,
        fileUrls: newFileUrls.length > 0 ? newFileUrls : undefined,
        ideaSaleData: formData.ideaSaleData,
        productSaleData: formData.productSaleData,
        creatorCollaborationData: formData.creatorCollaborationData,
      };

      const result = await apiService.updateGameProject(project._id, updateData);

      if (result) {
        const message =
          modalType === "publish"
            ? "Project updated and published successfully!"
            : "Project updated as draft!";

        showToastMessage(message, "success");
        setShowModal(false);

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            onBackToDetail();
          }
        }, 2000);
      } else {
        showToastMessage("Failed to update project", "error");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      showToastMessage("Failed to update project. Please try again.", "error");
    } finally {
      setUpdating(false);
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Game Genre
              </label>
              <input
                type="text"
                value={formData.ideaSaleData?.gameGenre || ""}
                onChange={(e) =>
                  handleFormChange("ideaSaleData.gameGenre", e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Action, RPG, Strategy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Platform
              </label>
              <select
                value={formData.ideaSaleData?.targetPlatform || "PC"}
                onChange={(e) =>
                  handleFormChange("ideaSaleData.targetPlatform", e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="PC">PC</option>
                <option value="Mobile">Mobile</option>
                <option value="Console">Console</option>
                <option value="Web">Web</option>
                <option value="Cross-platform">Cross-platform</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.ideaSaleData?.tags?.join(", ") || ""}
                onChange={(e) =>
                  handleFormChange(
                    "ideaSaleData.tags",
                    e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean)
                  )
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., indie, multiplayer, 2D"
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
                  handleFormChange("productSaleData.description", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Describe your game product in detail"
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
                  handleFormChange("productSaleData.codeFolderPath", e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Path to the main code folder"
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Game Genre
              </label>
              <input
                type="text"
                value={formData.productSaleData?.gameGenre || ""}
                onChange={(e) =>
                  handleFormChange("productSaleData.gameGenre", e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Action, RPG, Strategy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Platform
              </label>
              <select
                value={formData.productSaleData?.targetPlatform || "PC"}
                onChange={(e) =>
                  handleFormChange("productSaleData.targetPlatform", e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="PC">PC</option>
                <option value="Mobile">Mobile</option>
                <option value="Console">Console</option>
                <option value="Web">Web</option>
                <option value="Cross-platform">Cross-platform</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.productSaleData?.tags?.join(", ") || ""}
                onChange={(e) =>
                  handleFormChange(
                    "productSaleData.tags",
                    e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean)
                  )
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., indie, multiplayer, 2D"
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
                  handleFormChange("creatorCollaborationData.description", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Describe the collaboration opportunity"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Detailed Proposal *
              </label>
              <textarea
                value={formData.creatorCollaborationData?.proposal || ""}
                onChange={(e) =>
                  handleFormChange("creatorCollaborationData.proposal", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Provide detailed collaboration proposal"
                required
              />
            </div>
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
                  handleFormChange("creatorCollaborationData.timeline", e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 3 months, 6 weeks"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Required Skills (comma-separated)
              </label>
              <input
                type="text"
                value={formData.creatorCollaborationData?.skills?.join(", ") || ""}
                onChange={(e) =>
                  handleFormChange(
                    "creatorCollaborationData.skills",
                    e.target.value.split(",").map((skill) => skill.trim()).filter(Boolean)
                  )
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Unity, C#, Game Design"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {showHeader && (
        <header className="bg-gray-800/60 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <RnDLogo className="h-8 w-8" />
                <h1 className="text-2xl font-bold text-white">Edit Project</h1>
              </div>
              <div className="flex items-center space-x-4">
                <RoleBadge role={user.role} />
                <span className="text-gray-300">{user.firstName} {user.lastName}</span>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={onBackToDetail}
            className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Project Details
          </button>
        </div>

        <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Edit Project Information</h2>

          <form className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Project Type
                </label>
                <select
                  value={formData.projectType}
                  onChange={(e) => handleFormChange("projectType", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled
                >
                  <option value="idea_sale">Idea Sale</option>
                  <option value="product_sale">Product Sale</option>
                  <option value="dev_collaboration">Dev Collaboration</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Short Description *
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => handleFormChange("shortDescription", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Brief description of your project"
                required
              />
            </div>

            {/* Project Type Specific Fields */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                {formData.projectType === "idea_sale" && "Idea Sale Details"}
                {formData.projectType === "product_sale" && "Product Sale Details"}
                {formData.projectType === "dev_collaboration" && "Collaboration Details"}
              </h3>
              {renderProjectTypeForm()}
            </div>

            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Banner
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
                {formData.bannerPreviewUrl ? (
                  <div className="relative">
                    <img
                      src={formData.bannerPreviewUrl}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleBannerRemove}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">
                      Upload a banner image for your project
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleBannerUpload(e.target.files[0])}
                      className="hidden"
                      id="banner-upload"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Banner
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attachments (Images/Videos)
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    {formData.attachments.map((attachment, index) => (
                      <div key={index} className="relative">
                        {attachment.type === "image" ? (
                          <img
                            src={attachment.previewUrl}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={attachment.previewUrl}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleAttachmentRemove(index)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => e.target.files && handleAttachmentsUpload(e.target.files)}
                    className="hidden"
                    id="attachments-upload"
                  />
                  <label
                    htmlFor="attachments-upload"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Attachments
                  </label>
                </div>
              </div>
            </div>

            {/* Upload Files Section */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
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
                      mp4, avi, mov, wmv, flv, webm, mkv (max 50MB)
                    </div>
                    <div>
                      • <strong>Images:</strong>{" "}
                      jpg, jpeg, png, gif, webp, svg (max 10MB)
                    </div>
                    <div>
                      • <strong>Archives:</strong>{" "}
                      zip, rar, 7z (max 100MB)
                    </div>
                  </div>
                </div>
              </div>

              {existingFiles.filter(f => !removedFiles.includes(f.url)).length > 0 && files.length === 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Existing Files:
                  </h4>
                  <div className="space-y-2">
                    {existingFiles.filter(f => !removedFiles.includes(f.url)).map((file, index) => {
                      const isImage = file.url.includes('.jpg') || file.url.includes('.jpeg') || file.url.includes('.png') || file.url.includes('.gif') || file.url.includes('.webp');
                      const isVideo = file.url.includes('.mp4') || file.url.includes('.avi') || file.url.includes('.mov') || file.url.includes('.wmv') || file.url.includes('.flv') || file.url.includes('.webm') || file.url.includes('.mkv');
                      const isArchive = file.url.includes('.zip') || file.url.includes('.rar') || file.url.includes('.7z');

                      let fileType = "File";
                      let icon = "📄";
                      if (isImage) {
                        fileType = "Image";
                        icon = "🖼️";
                      } else if (isVideo) {
                        fileType = "Video";
                        icon = "🎥";
                      } else if (isArchive) {
                        fileType = "Archive";
                        icon = "📦";
                      }

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {fileType}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveExistingFile(file.url)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Selected Files:
                  </h4>
                  <ul className="space-y-2">
                    {files.map((file, index) => {
                      const isImage = file.type.startsWith("image/");
                      const isVideo = file.type.startsWith("video/");
                      const isArchive = file.type.includes("zip") || file.type.includes("rar") || file.type.includes("7z");

                      let fileType = "File";
                      if (isImage) fileType = "Image";
                      else if (isVideo) fileType = "Video";
                      else if (isArchive) fileType = "Archive";

                      return (
                        <li
                          key={index}
                          className="flex items-center space-x-3 p-2 bg-gray-700/50 rounded-lg"
                        >
                          <span className="text-lg">
                            {isImage ? "🖼️" : isVideo ? "🎥" : isArchive ? "📦" : "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {fileType} • {(file.size / 1024 / 1024).toFixed(2)} MB
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
                    updating
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Files
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
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => handleOpenModal("draft")}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <Save className="w-5 h-5 mr-2" />
                {updating ? "Updating..." : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={() => handleOpenModal("publish")}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <Globe className="w-5 h-5 mr-2" />
                {updating ? "Updating..." : "Update & Publish"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                {modalType === "publish" ? "Publish Project" : "Save as Draft"}
              </h3>
              <p className="text-gray-300 mb-6">
                {modalType === "publish"
                  ? "Your project will be updated and published."
                  : "Your project will be updated as a draft."}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleCloseModal}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 text-white font-medium rounded-lg transition-colors"
                >
                  {updating ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
          toastType === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default EditProjectForm;

