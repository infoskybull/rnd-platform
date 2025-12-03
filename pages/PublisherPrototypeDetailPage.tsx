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

  // Helper function to check if project is free (payToViewAmount is 0, null, undefined, or missing)
  const isFreeToView = useMemo(() => {
    if (!project) return false;
    // If payToViewAmount field doesn't exist or is falsy (0, null, undefined), treat as free
    const amount = project.payToViewAmount;
    return (
      amount === 0 ||
      amount === null ||
      amount === undefined ||
      !("payToViewAmount" in project)
    );
  }, [project]);

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

      // If user is creator, check if they are the owner first
      if (user?.role === "creator") {
        // Get preview data to check ownership
        const previewData = await apiService.getGameProjectPreview(id);

        // Check if user is owner (creatorId, owner.id, or originalDeveloper.id)
        const isCreatorOwner =
          previewData.creatorId === user.id ||
          previewData.owner?.id === user.id ||
          previewData.originalDeveloper?.id === user.id;

        if (isCreatorOwner) {
          // If creator is owner, call full API directly to get all data for running prototype
          const projectData = await apiService.getGameProjectById(id);
          setProject(projectData);
          setIsPaid(true); // Owner can always view

          // Load following status if user is authenticated
          if (user?.id && projectData.creatorId && isAuthenticated) {
            try {
              const followingStatus = await apiService.checkFollowingStatus(
                projectData.creatorId
              );
              setIsFollowing(followingStatus.data.isFollowing);
            } catch (err) {
              console.error("Failed to load following status:", err);
            }
          }
          return;
        }
      }

      // For non-owner users, use the existing flow
      // Step 1: Get preview data first
      const previewData = await apiService.getGameProjectPreview(id);

      // Step 2: Check if we can load full detail
      // Project is free if payToViewAmount is 0, null, undefined, or missing from response
      const isFree =
        previewData.payToViewAmount === 0 ||
        previewData.payToViewAmount === null ||
        previewData.payToViewAmount === undefined ||
        !("payToViewAmount" in previewData);
      const canViewDetail =
        isFree || previewData.viewerIds?.includes(user?.id || "");

      if (canViewDetail) {
        // Load full project detail
        const projectData = await apiService.getGameProjectById(id);
        setProject(projectData);

        // Check if user has already paid to view
        if (projectData.viewerIds?.includes(user?.id || "")) {
          setIsPaid(true);
        }

        // Load following status if user is authenticated
        if (user?.id && projectData.creatorId && isAuthenticated) {
          try {
            const followingStatus = await apiService.checkFollowingStatus(
              projectData.creatorId
            );
            setIsFollowing(followingStatus.data.isFollowing);
          } catch (err) {
            console.error("Failed to load following status:", err);
          }
        }
      } else {
        // Only use preview data
        setProject(previewData);

        // Load following status if user is authenticated
        if (user?.id && previewData.creatorId && isAuthenticated) {
          try {
            const followingStatus = await apiService.checkFollowingStatus(
              previewData.creatorId
            );
            setIsFollowing(followingStatus.data.isFollowing);
          } catch (err) {
            console.error("Failed to load following status:", err);
          }
        }
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

  // Auto-set isPaid if user has paid to view or project is free
  useEffect(() => {
    if (hasPaidToView) {
      setIsPaid(true);
    } else if (isFreeToView) {
      setIsPaid(true);
    }
  }, [hasPaidToView, isFreeToView]);
  // Check if project has been purchased or collaboration is active
  const isPurchasedOrCollaboration = useMemo(() => {
    if (!project) return false;
    // Check if project has been purchased (has publisherId or soldAt)
    const isPurchased = !!project.publisherId || !!project.soldAt;
    // Check if collaboration is active (has collaborationStartDate)
    const isCollaboration = !!project.collaborationStartDate;
    return isPurchased || isCollaboration;
  }, [project?.publisherId, project?.soldAt, project?.collaborationStartDate]);

  // Check if current user is the owner of the project
  // For creator: check if user is creatorId, owner.id, or originalDeveloper.id
  // For publisher: check if user is publisherId (when purchased)
  const isOwner = useMemo(() => {
    if (!project || !user?.id) return false;

    // If user is creator, check if they are the creator/owner/originalDeveloper
    if (user.role === "creator") {
      return (
        project.creatorId === user.id ||
        project.owner?.id === user.id ||
        project.originalDeveloper?.id === user.id
      );
    }

    // If user is publisher, check if they are the publisherId (when purchased)
    if (user.role === "publisher" && project.publisherId) {
      return project.publisherId === user.id;
    }

    return false;
  }, [
    project?.publisherId,
    project?.creatorId,
    project?.owner?.id,
    project?.originalDeveloper?.id,
    user?.id,
    user?.role,
  ]);

  // Get current owner (publisher if purchased, creator otherwise)
  // When not purchased, project.owner contains creator info
  // When purchased, project.owner contains publisher info
  const currentOwner = useMemo(() => {
    if (!project) return null;
    // Always use project.owner if available (it contains creator info when not purchased, publisher info when purchased)
    if (project.owner) {
      return project.owner;
    }
    // Fallback to originalDeveloper if owner is not available
    return project.originalDeveloper || null;
  }, [project?.owner, project?.originalDeveloper]);

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
      if (
        !project?.fileUrls ||
        project.fileUrls.length === 0 ||
        (!isOwner && !hasPaidToView && !isPaid && !isFreeToView)
      ) {
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
  }, [project?.fileUrls, isPaid, hasPaidToView, isFreeToView, isOwner]);

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

  // Handle follow/unfollow
  const handleFollow = useCallback(async () => {
    if (!project || !isAuthenticated || !user?.id || !project.creatorId) return;
    if (isOwner) return; // Can't follow yourself

    try {
      const wasFollowing = isFollowing;
      setIsFollowing(!wasFollowing);

      if (wasFollowing) {
        await apiService.unfollowCreator(project.creatorId);
      } else {
        await apiService.followCreator(project.creatorId);
      }
    } catch (err) {
      // Revert on error
      setIsFollowing(!isFollowing);
      console.error("Failed to toggle follow:", err);
      alert(
        err instanceof Error ? err.message : "Failed to update follow status"
      );
    }
  }, [project, isAuthenticated, user?.id, isFollowing, isOwner]);

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
      <div className="flex-1 flex gap-6 p-6 overflow-hidden bg-[#EFEFEF]">
        {/* Left/Main Content Area - Fixed, no scroll */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Container with Preview and Packages */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Preview Area with Navigation and Action Buttons */}
            <div
              className={`flex flex-col items-center flex-shrink-0 relative ${
                isPurchasedOrCollaboration
                  ? "mt-10 flex-1 justify-center"
                  : "mt-10"
              }`}
            >
              {/* Preview Area - Mobile Screen Preview */}
              <div className="relative flex items-center justify-center mb-4">
                {/* Mobile Preview - Larger when purchased/collaboration */}
                <div
                  className={`relative ${
                    isPurchasedOrCollaboration ? "w-[420px]" : "w-[280px]"
                  } aspect-[9/16] bg-gray-800 rounded-[2.5rem] p-2 shadow-2xl`}
                >
                  {/* Phone Frame */}
                  <div
                    className="relative w-full h-full bg-white rounded-[2rem] overflow-hidden transition-all duration-300"
                    style={{
                      filter:
                        isOwner || hasPaidToView || isPaid || isFreeToView
                          ? "blur(0px)"
                          : "blur(10px)",
                    }}
                  >
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20"></div>

                    {/* Project Preview from fileUrls */}
                    {project?.fileUrls &&
                    project.fileUrls.length > 0 &&
                    (isOwner || hasPaidToView || isPaid || isFreeToView) ? (
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

                              // Mobile viewport CSS for proper fit in mobile preview - full screen
                              const mobileViewportCSS = `
                                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                <style>
                                  /* Mobile viewport rules for game preview - full screen */
                                  html, body {
                                    width: 100% !important;
                                    height: 100% !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    overflow: hidden !important;
                                    position: fixed !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    right: 0 !important;
                                    bottom: 0 !important;
                                    box-sizing: border-box !important;
                                  }
                                  
                                  * {
                                    box-sizing: border-box !important;
                                  }
                                  
                                  /* Ensure canvas fills full screen */
                                  canvas {
                                    width: 100vw !important;
                                    height: 100vh !important;
                                    max-width: 100vw !important;
                                    max-height: 100vh !important;
                                    display: block !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    position: absolute !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                  }
                                  
                                  /* Container elements should fill full screen */
                                  #game-container, #app, #root, .game-container, .app-container, 
                                  #canvas-container, .canvas-container, [id*="game"], [class*="game"],
                                  main, .main, #main, .container, #container {
                                    width: 100vw !important;
                                    height: 100vh !important;
                                    max-width: 100vw !important;
                                    max-height: 100vh !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    overflow: hidden !important;
                                    position: fixed !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    right: 0 !important;
                                    bottom: 0 !important;
                                  }
                                  
                                  /* Responsive images and media */
                                  img, video {
                                    max-width: 100vw !important;
                                    max-height: 100vh !important;
                                    width: auto !important;
                                    height: auto !important;
                                  }
                                  
                                  /* Prevent any scroll */
                                  body, html {
                                    overflow: hidden !important;
                                    overscroll-behavior: none !important;
                                  }
                                  
                                  /* Ensure full viewport coverage - remove any margins/padding */
                                  * {
                                    margin: 0;
                                    padding: 0;
                                  }
                                </style>
                              `;

                              const headEndIndex = htmlContent
                                .toLowerCase()
                                .indexOf("</head>");
                              return headEndIndex !== -1
                                ? htmlContent.slice(0, headEndIndex) +
                                    mobileViewportCSS +
                                    `<script>${interceptorScript}</script>` +
                                    htmlContent.slice(headEndIndex)
                                : `<head>${mobileViewportCSS}<script>${interceptorScript}</script></head>` +
                                    htmlContent;
                            })()}
                            className="w-full h-full border-0"
                            style={{
                              transform: "scale(1)",
                              transformOrigin: "top left",
                              width: "100%",
                              height: "100%",
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
                        {!isOwner &&
                          !hasPaidToView &&
                          !isPaid &&
                          !isFreeToView && (
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
              </div>

              {/* Edit Button - Top left (only for creator owner) - Same level as Pay to View */}
              {isOwner && user?.role === "creator" && (
                <div className="absolute top-0 left-10 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (id) {
                        navigate(`/prototype/upload/${id}`);
                      }
                    }}
                    className="w-32 px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                    title="Edit this prototype"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Pricing Packages - Hide if purchased or collaboration */}
            {!isPurchasedOrCollaboration && (
              <div className="grid grid-cols-3 gap-4 flex-shrink-0 items-stretch">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="flex flex-col gap-3 h-full">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col shadow-sm hover:shadow-md transition-shadow flex-1 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-semibold text-gray-900">
                          {pkg.name}
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {pkg.price === 0 || !pkg.isSet
                            ? pkg.type === "pay_to_view"
                              ? "Free"
                              : "Not set"
                            : `$${pkg.price.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="space-y-2.5 mb-5 flex-1 min-h-0">
                        {pkg.contents.map((content, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-gray-600 flex items-start leading-relaxed"
                          >
                            <span className="text-blue-600 mr-2 mt-0.5">•</span>
                            <span>{content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Hide Buy buttons if owner */}
                    {!isOwner && pkg.isSet && (
                      <>
                        {/* Show Paid button if pay_to_view and user has paid */}
                        {pkg.type === "pay_to_view" &&
                        pkg.price > 0 &&
                        hasPaidToView ? (
                          <div className="flex gap-2 mt-auto">
                            <button
                              disabled
                              className="flex-[2] px-4 py-2.5 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed text-sm"
                            >
                              Paid
                            </button>
                            <button
                              disabled
                              className="flex-[1] px-3 py-2.5 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed flex items-center justify-center"
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
                        ) : (
                          /* Show Pay buttons for other cases */
                          !(pkg.type === "pay_to_view" && hasPaidToView) && (
                            <div className="flex gap-2 mt-auto">
                              <button
                                onClick={() => handlePurchase(pkg)}
                                className="flex-[2] px-4 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors text-sm"
                              >
                                Pay
                              </button>
                              <button
                                onClick={() => handlePurchase(pkg)}
                                className="flex-[1] px-3 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
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
                          )
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex flex-col overflow-hidden">
          {/* Fixed Content - Profile, Details, Tags */}
          <div className="flex-shrink-0 space-y-6 pr-2">
            {/* Creator/Owner Profile */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex gap-4 items-start mb-4">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mb-3 shadow-md">
                  {currentOwner?.firstName && currentOwner?.lastName ? (
                    <span className="text-white text-2xl font-semibold">
                      {currentOwner.firstName.charAt(0).toUpperCase()}
                      {currentOwner.lastName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg
                      className="w-12 h-12 text-white"
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
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    {currentOwner?.firstName || "DEV"}{" "}
                    {currentOwner?.lastName || "name"}
                  </div>
                  <div className="text-sm text-gray-600 text-center">
                    {currentOwner?.role
                      ? `${
                          currentOwner.role === "creator"
                            ? "Developer"
                            : "Publisher"
                        }, designer`
                      : currentOwner?.email
                      ? currentOwner.email
                      : "Developer, designer"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-3">
                {!isOwner && (
                  <button
                    onClick={handleFollow}
                    disabled={!isAuthenticated || !user?.id}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      isFollowing
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                )}
                <button
                  onClick={() =>
                    navigate(`/dashboard/publisher/portfolio/${id || "1"}`)
                  }
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="text-lg font-bold text-gray-900 mb-2">
                {project.title || "Project name"}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {project.gameGenre
                  ? `${project.gameGenre}${
                      project.repoFormat
                        ? `, ${
                            project.repoFormat === "webgl"
                              ? "WebGL"
                              : project.repoFormat === "react"
                              ? "React"
                              : "HTML"
                          }`
                        : ""
                    }`
                  : project.repoFormat
                  ? `${
                      project.repoFormat === "webgl"
                        ? "WebGL"
                        : project.repoFormat === "react"
                        ? "React"
                        : "HTML"
                    }`
                  : "Puzzle, Mobile"}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {project.shortDescription || "Short description"}
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
                <button
                  onClick={handleLike}
                  disabled={!isAuthenticated || !user?.id}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className={`w-4 h-4 ${
                      isLikedByUser ? "text-blue-600" : "text-gray-600"
                    }`}
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
                  <span
                    className={`text-sm ${
                      isLikedByUser
                        ? "text-blue-600 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    {project.likeCount || 0}
                  </span>
                </button>
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
