import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { User, GameProject } from "../types";
import DashboardNavbar from "../components/DashboardNavbar";
import RnDLogo from "../components/icons/RnDLogo";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import {
  getNavigationItems,
  getDefaultRightIcons,
} from "../utils/navbarConfig";

interface PublisherPrototypeDetailPageProps {
  user: User;
  onLogout: () => void;
}

const PublisherPrototypeDetailPage: React.FC<
  PublisherPrototypeDetailPageProps
> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  console.log("isAuthenticated", isAuthenticated);
  const [project, setProject] = useState<GameProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [projectFiles, setProjectFiles] = useState<{ [path: string]: Blob }>(
    {}
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  // Get navigation items with active state based on current path
  const navigationItems = getNavigationItems(user?.role, location.pathname);
  const rightIcons = getDefaultRightIcons();

  // Load project data
  useEffect(() => {
    if (id && !authLoading) {
      loadProject();
    }
  }, [id, authLoading]);

  const loadProject = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Step 1: Get preview data first
      const previewData = await apiService.getGameProjectPreview(id);

      // Step 2: Check if we can load full detail
      const canViewDetail =
        previewData.payToViewAmount === 0 ||
        previewData.viewerIds?.includes(user?.id || "");

      if (canViewDetail) {
        // Load full project detail
        const projectData = await apiService.getGameProjectById(id);
        setProject(projectData);

        // Check if user has already paid to view
        if (projectData.viewerIds?.includes(user?.id || "")) {
          setIsPaid(true);
        }
      } else {
        // Only use preview data
        setProject(previewData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  // Check if current user has liked this project
  const isLikedByUser = useMemo(() => {
    if (!project || !user?.id) return false;
    return project.likedBy?.includes(user.id) || false;
  }, [project?.likedBy, user?.id]);

  // Check if current user has paid to view
  const hasPaidToView = useMemo(() => {
    if (!project || !user?.id) return false;
    return project.viewerIds?.includes(user.id) || false;
  }, [project?.viewerIds, user?.id]);
  // Check if current user is the owner of the project
  // If publisherId exists, owner is the publisherId
  // Otherwise, owner is the creatorId
  const isOwner = useMemo(() => {
    if (!project || !user?.id) return false;
    // Nếu có publisherId thì owner là publisherId đó
    if (project.publisherId) {
      return project.publisherId === user.id;
    }
    // Nếu không có publisherId thì owner là creatorId
    return project.creatorId === user.id;
  }, [project?.publisherId, project?.creatorId, user?.id]);

  // Get current owner (publisher if purchased, creator otherwise)
  const currentOwner = useMemo(() => {
    if (!project) return null;
    return project.publisherId ? project.owner : project.originalDeveloper;
  }, [project?.publisherId, project?.owner, project?.originalDeveloper]);

  // Get images from project attachments
  const images = useMemo(() => {
    if (!project?.attachments || project.attachments.length === 0) {
      return project?.thumbnail ? [project.thumbnail] : [];
    }
    return project.attachments;
  }, [project?.attachments, project?.thumbnail]);

  // Load and extract project preview
  useEffect(() => {
    const loadProjectPreview = async () => {
      if (!project?.fileUrls || project.fileUrls.length === 0 || !isPaid) {
        setHtmlContent("");
        setProjectFiles({});
        return;
      }

      // Check if JSZip is available
      if (typeof (window as any).JSZip === "undefined") {
        setPreviewError("JSZip library is not loaded");
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);

      try {
        // Download the first file URL
        const response = await fetch(project.fileUrls[0]);
        if (!response.ok) {
          throw new Error(
            `Failed to download project file: ${response.statusText}`
          );
        }

        const zipBlob = await response.blob();
        const zip = new (window as any).JSZip();
        const zipContent = await zip.loadAsync(zipBlob);

        const files: { [path: string]: Blob } = {};

        // Extract all files from the zip
        for (const [path, file] of Object.entries(zipContent.files)) {
          const zipFile = file as any;
          if (!zipFile.dir) {
            const fileBlob = await zipFile.async("blob");
            files[path] = fileBlob;
          }
        }

        setProjectFiles(files);

        // Look for index.html
        let htmlFile = zipContent.file("index.html");
        if (!htmlFile) {
          htmlFile = zipContent.file("Build/index.html");
        }
        if (!htmlFile) {
          htmlFile = zipContent.file("TemplateData/index.html");
        }
        if (!htmlFile) {
          const htmlFiles = Object.keys(zipContent.files).filter(
            (path) =>
              path.toLowerCase().endsWith(".html") &&
              !(zipContent.files[path] as any).dir
          );
          if (htmlFiles.length > 0) {
            htmlFile = zipContent.file(htmlFiles[0]);
          }
        }

        if (htmlFile) {
          const htmlText = await htmlFile.async("text");
          setHtmlContent(htmlText);
          setPreviewKey((prev) => prev + 1);
        } else {
          setPreviewError("No HTML file found in the project");
        }
      } catch (err) {
        console.error("Error loading project preview:", err);
        setPreviewError(
          err instanceof Error ? err.message : "Failed to load preview"
        );
      } finally {
        setPreviewLoading(false);
      }
    };

    loadProjectPreview();
  }, [project?.fileUrls, isPaid]);

  // Listen for file requests from the preview iframe
  useEffect(() => {
    const handleFrameRequests = async (event: MessageEvent) => {
      if (event.source && event.data && event.data.type === "GET_FILE") {
        const { path, requestId } = event.data;
        const fileBlob = projectFiles[path];

        if (fileBlob) {
          try {
            const buffer = await fileBlob.arrayBuffer();
            (event.source as Window).postMessage(
              {
                type: "FILE_CONTENT",
                requestId,
                success: true,
                content: buffer,
                contentType: fileBlob.type,
              },
              { targetOrigin: "*", transfer: [buffer] }
            );
          } catch (e) {
            (event.source as Window).postMessage(
              {
                type: "FILE_CONTENT",
                requestId,
                success: false,
                error: `Failed to read file: ${path}`,
              },
              { targetOrigin: "*" }
            );
          }
        } else {
          (event.source as Window).postMessage(
            {
              type: "FILE_CONTENT",
              requestId,
              success: false,
              error: `File not found: ${path}`,
            },
            { targetOrigin: "*" }
          );
        }
      }
    };

    window.addEventListener("message", handleFrameRequests);
    return () => window.removeEventListener("message", handleFrameRequests);
  }, [projectFiles]);

  // Get packages from project data - always show all 3 packages
  const packages = useMemo(() => {
    const pkgList = [];

    // Package 1: Pay to view - always show
    pkgList.push({
      id: 1,
      name: "Pay to view",
      price: project?.payToViewAmount ?? 0,
      contents: [
        "Publisher will pay to view the app",
        "No ownership of the Idea is granted to the Publisher.",
      ],
      type: "pay_to_view",
      isFree: (project?.payToViewAmount ?? 0) === 0,
      isSet:
        project?.payToViewAmount !== undefined && project.payToViewAmount > 0,
    });

    // Package 2: Product Sale - always show
    pkgList.push({
      id: 2,
      name: "Pay per Prototype",
      price: project?.productSalePrice ?? 0,
      contents: [
        "100% of the copyright is transferred to the Publisher",
        "The Creator is not permitted to reproduce or duplicate the work in any form",
      ],
      type: "project_purchase",
      isSet:
        project?.productSalePrice !== undefined && project.productSalePrice > 0,
    });

    // Package 3: Collaboration - always show
    pkgList.push({
      id: 3,
      name: "Collaboration",
      price: project?.creatorCollaborationBudget ?? 0,
      contents: [
        "70% ownership is transferred to the Publisher",
        "The Creator will receive this payment for Prototype development",
      ],
      type: "collaboration_budget",
      isSet:
        project?.creatorCollaborationBudget !== undefined &&
        project.creatorCollaborationBudget > 0,
    });

    return pkgList;
  }, [project]);

  // Handle like
  const handleLike = useCallback(async () => {
    if (!project || !isAuthenticated || !user?.id) return;

    try {
      const wasLiked = isLikedByUser;
      setIsLiked(!wasLiked);

      // Optimistic update
      setProject((prevProject) => {
        if (!prevProject) return prevProject;
        const newLikedBy = wasLiked
          ? prevProject.likedBy?.filter((id) => id !== user.id) || []
          : [...(prevProject.likedBy || []), user.id];

        return {
          ...prevProject,
          likeCount: wasLiked
            ? Math.max(0, prevProject.likeCount - 1)
            : prevProject.likeCount + 1,
          likedBy: newLikedBy,
        };
      });

      await apiService.likeGameProject(project._id);
    } catch (err) {
      // Revert on error
      setIsLiked(isLikedByUser);
      console.error("Failed to like project:", err);
    }
  }, [project, isAuthenticated, user?.id, isLikedByUser]);

  // Handle purchase
  const handlePurchase = useCallback(
    (pkg: any) => {
      if (!project) return;

      // If package type is collaboration_budget, navigate to offer page
      if (pkg.type === "collaboration_budget") {
        // Get creatorId from project
        const creatorId = project.creatorId || project.originalDeveloper?.id;

        if (!creatorId) {
          console.error("Creator ID not found for collaboration offer");
          return;
        }

        // Navigate to offer page with projectId and creatorId
        navigate(`/offer?projectId=${project._id}&creatorId=${creatorId}`);
        return;
      }

      // For other package types, navigate to payment page
      navigate(`/payment?projectId=${project._id}&paymentType=${pkg.type}`);
    },
    [project, navigate]
  );

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-red-600">{error || "Project not found"}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        navigationItems={navigationItems}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        rightIcons={rightIcons}
        logo={<RnDLogo size={40} />}
      />

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left/Main Content Area - Fixed, no scroll */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Container with Preview and Packages */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Preview Area with Navigation and Action Buttons */}
            <div className="flex flex-col items-center flex-shrink-0 relative mt-10">
              {/* Preview Area - Mobile Screen Preview */}
              <div className="relative flex items-center justify-center mb-4 px-80">
                {/* Left Navigation Arrow */}
                {images.length > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-200/80 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors z-10"
                  >
                    <svg
                      className="w-6 h-6 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}

                {/* Mobile Preview */}
                <div className="relative w-[280px] aspect-[9/16] bg-gray-800 rounded-[2.5rem] p-2 shadow-2xl">
                  {/* Phone Frame */}
                  <div
                    className="relative w-full h-full bg-white rounded-[2rem] overflow-hidden transition-all duration-300"
                    style={{ filter: isPaid ? "blur(0px)" : "blur(10px)" }}
                  >
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20"></div>

                    {/* Project Preview from fileUrls */}
                    {project?.fileUrls &&
                    project.fileUrls.length > 0 &&
                    isPaid ? (
                      <>
                        {previewLoading && (
                          <div className="absolute inset-0 bg-gray-100 bg-opacity-95 flex flex-col justify-center items-center z-10">
                            <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-300 rounded-full animate-spin"></div>
                            <p className="mt-3 text-sm font-semibold text-gray-700 text-center">
                              Loading...
                            </p>
                          </div>
                        )}
                        {previewError && (
                          <div className="absolute inset-0 bg-gray-100 flex justify-center items-center z-10">
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg max-w-xs text-center mx-4">
                              <h3 className="font-bold text-sm mb-1">
                                Preview Error
                              </h3>
                              <p className="text-xs break-words">
                                {previewError}
                              </p>
                            </div>
                          </div>
                        )}
                        {htmlContent && !previewLoading && !previewError && (
                          <iframe
                            key={previewKey}
                            srcDoc={(() => {
                              // Interceptor script to handle file requests
                              const interceptorScript = `
                                const requests = new Map();
                                let requestIdCounter = 0;

                                window.addEventListener('message', (event) => {
                                    if (event.data && event.data.type === 'FILE_CONTENT') {
                                        const { requestId, success, content, error, contentType } = event.data;
                                        const callbacks = requests.get(requestId);
                                        if (callbacks) {
                                            requests.delete(requestId);
                                            if (success) {
                                                const blob = new Blob([content], { type: contentType });
                                                const response = new Response(blob, { status: 200, statusText: 'OK' });
                                                callbacks.resolve(response);
                                            } else {
                                                callbacks.reject(new Error(error));
                                            }
                                        }
                                    }
                                });

                                function requestFileFromHost(path) {
                                    return new Promise((resolve, reject) => {
                                        const requestId = requestIdCounter++;
                                        requests.set(requestId, { resolve, reject });
                                        window.parent.postMessage({ type: 'GET_FILE', path, requestId }, '*');
                                    });
                                }

                                const originalFetch = window.fetch;
                                window.fetch = (input, init) => {
                                    if (typeof input === 'string') {
                                        try {
                                            new URL(input);
                                            return originalFetch(input, init);
                                        } catch (e) {
                                            return requestFileFromHost(input);
                                        }
                                    }
                                    return originalFetch(input, init);
                                };

                                const originalXhrOpen = XMLHttpRequest.prototype.open;
                                const originalXhrSend = XMLHttpRequest.prototype.send;

                                XMLHttpRequest.prototype.open = function(method, url, ...args) {
                                    this._interceptedUrl = url;
                                    this._openArgs = [method, url, ...args];
                                };
                                
                                XMLHttpRequest.prototype.send = function(body) {
                                    if (this._interceptedUrl) {
                                        try {
                                            new URL(this._interceptedUrl, window.location.origin);
                                            originalXhrOpen.apply(this, this._openArgs);
                                            originalXhrSend.apply(this, [body]);
                                        } catch (e) {
                                            const xhr = this;
                                            requestFileFromHost(this._interceptedUrl)
                                                .then(response => response.blob())
                                                .then(blob => {
                                                    const blobUrl = URL.createObjectURL(blob);
                                                    originalXhrOpen.apply(xhr, [this._openArgs[0], blobUrl, ...this._openArgs.slice(2)]);
                                                    originalXhrSend.apply(xhr, [body]);
                                                    xhr.addEventListener('loadend', () => URL.revokeObjectURL(blobUrl), { once: true });
                                                })
                                                .catch(err => {
                                                    this.dispatchEvent(new ProgressEvent('error'));
                                                });
                                        }
                                    } else {
                                        originalXhrSend.apply(this, [body]);
                                    }
                                };
                              `;
                              const headEndIndex = htmlContent
                                .toLowerCase()
                                .indexOf("</head>");
                              return headEndIndex !== -1
                                ? htmlContent.slice(0, headEndIndex) +
                                    `<script>${interceptorScript}</script>` +
                                    htmlContent.slice(headEndIndex)
                                : `<head><script>${interceptorScript}</script></head>` +
                                    htmlContent;
                            })()}
                            className="w-full h-full border-0"
                            style={{
                              transform: "scale(0.5)",
                              transformOrigin: "top left",
                              width: "200%",
                              height: "200%",
                            }}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                            title={`Preview of ${project.title}`}
                          />
                        )}
                        {!htmlContent && !previewLoading && !previewError && (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="text-gray-600 text-xs text-center px-2">
                              No preview available
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Preview Image fallback */}
                        {images.length > 0 && images[currentImageIndex] && (
                          <img
                            src={images[currentImageIndex]}
                            alt={`Preview ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}

                        {/* Blurred Preview Content */}
                        {!isPaid && (
                          <>
                            <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-gray-400/60 to-gray-500/60">
                              {/* Simulated mobile content pattern */}
                              <div className="absolute inset-0 opacity-30">
                                <div className="h-full w-full bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200"></div>
                              </div>
                            </div>

                            {/* Overlay to enhance blur effect */}
                            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-2xl"></div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Right Navigation Arrow */}
                {images.length > 1 && (
                  <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-200/80 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors z-10"
                  >
                    <svg
                      className="w-6 h-6 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Edit Button - Top left (only for owner) - Same level as Pay to View */}
              {isOwner && (
                <div className="absolute top-0 left-10 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (id) {
                        navigate(`/prototype/upload/${id}`);
                      }
                    }}
                    className="w-32 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                    title="Edit this prototype"
                  >
                    Edit
                  </button>
                </div>
              )}

              {/* Action Buttons - Bottom right */}
              <div className="absolute bottom-0 right-0 flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (!project) return;

                    // If user has already paid to view, just enable preview
                    if (hasPaidToView) {
                      setIsPaid(true);
                      return;
                    }

                    if (project.payToViewAmount === 0) {
                      // Free to view, just enable preview
                      setIsPaid(true);
                      return;
                    }

                    // Navigate to payment page with projectId and paymentType
                    navigate(
                      `/payment?projectId=${project._id}&paymentType=pay_to_view`
                    );
                  }}
                  className="w-32 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  {hasPaidToView || project.payToViewAmount === 0
                    ? "View"
                    : "Pay to view"}
                </button>
                <button className="w-32 px-6 py-3 bg-white text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                  Skip
                </button>
              </div>
            </div>

            {/* Pricing Packages */}
            <div className="grid grid-cols-3 gap-4 flex-shrink-0 items-stretch">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-semibold text-gray-900">
                      {pkg.name}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {pkg.price === 0 || !pkg.isSet
                        ? pkg.type === "pay_to_view"
                          ? "Free"
                          : "Not set"
                        : `$${pkg.price.toLocaleString()}`}
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 flex-1">
                    {pkg.contents.map((content, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-600 flex items-start"
                      >
                        <span className="text-blue-600 mr-2">•</span>
                        <span>{content}</span>
                      </div>
                    ))}
                  </div>
                  {/* Hide Buy buttons if owner */}
                  {!isOwner &&
                    pkg.isSet &&
                    !(pkg.type === "pay_to_view" && hasPaidToView) && (
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => handlePurchase(pkg)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => handlePurchase(pkg)}
                          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex flex-col overflow-hidden">
          {/* Fixed Content - Profile, Details, Tags */}
          <div className="flex-shrink-0 space-y-6 pr-2">
            {/* Creator Profile */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-3">
                  {currentOwner?.firstName && currentOwner?.lastName ? (
                    <span className="text-white text-3xl font-medium">
                      {currentOwner.firstName.charAt(0).toUpperCase()}
                      {currentOwner.lastName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg
                      className="w-14 h-14 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {currentOwner?.firstName || "Name"}{" "}
                  {currentOwner?.lastName || ""}
                </div>
                <div className="text-sm text-gray-600 text-center">
                  {currentOwner?.email || "Developer, designer"}
                </div>
              </div>
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-3 ${
                  isFollowing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {isFollowing ? "Following" : "Follow"}
              </button>

              {/* Interaction Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleLike}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isLikedByUser
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill={isLikedByUser ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  Like
                </button>
                <button
                  onClick={() =>
                    navigate(`/dashboard/publisher/portfolio/${id || "1"}`)
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  Portfolio
                </button>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-lg font-bold text-gray-900 mb-2">
                {project.title}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {project.shortDescription}
                {project.shortDescription &&
                  project.shortDescription.length > 100 &&
                  !showMore && (
                    <button
                      onClick={() => setShowMore(true)}
                      className="text-blue-600 ml-1 hover:underline"
                    >
                      Show more
                    </button>
                  )}
              </div>
              {showMore && project.shortDescription && (
                <div className="text-sm text-gray-600 mb-2">
                  {project.shortDescription}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {project.likeCount || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {project.viewCount || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {project.reviewCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {project.tags && project.tags.length > 0 ? (
                  project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    No tags
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section - Scrollable */}
          <div className="flex-1 flex flex-col min-h-0 mt-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col flex-1 min-h-0">
              <div className="text-sm font-semibold text-gray-900 mb-4 flex-shrink-0">
                {project.reviewCount || 0} COMMENTS
              </div>
              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                {project.reviewCount && project.reviewCount > 0 ? (
                  <div className="text-sm text-gray-600 text-center py-4">
                    Comments feature coming soon
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 text-center py-4">
                    No comments yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublisherPrototypeDetailPage;
