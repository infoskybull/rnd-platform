import React, { useState, useCallback, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ProjectDetails, User, LoginCredentials, SignUpData } from "../types";
import ProjectControls from "../components/ProjectControls";
import WebGLPreview from "../components/WebGLPreview";
import UploadView from "../components/UploadView";
import RnDLogo from "../components/icons/RnDLogo";
import RoleBadge from "../components/RoleBadge";
import { useAuth } from "../hooks/useAuth";
import { gsap } from "gsap";
import { Menu, X } from "lucide-react";

declare const JSZip: any;

const MainPage: React.FC = () => {
  // Authentication using custom hook
  const {
    user,
    isLoading: authLoading,
    error: authError,
    login,
    signup,
    clearError,
    isAuthenticated,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<"main" | "upload">("main");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Project state - ALL HOOKS MUST BE AT THE TOP
  const [projectFiles, setProjectFiles] = useState<Record<string, Blob>>({});
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isListed, setIsListed] = useState<boolean>(false);
  const [progress, setProgress] = useState<{
    percent: number;
    stage: string;
  } | null>(null);
  const [previewKey, setPreviewKey] = useState(0); // Used to force iframe remount on new uploads
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    title: "My Awesome Game",
    description:
      "This is a stunning 3D experience built with the latest web technologies. Explore interactive scenes and beautiful graphics.",
    price: "19.99",
    seller: "Creative Coder",
  });

  // Refs
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Handle navigation based on auth state - MUST be at the top level
  useEffect(() => {
    // Only navigate if auth loading is complete
    if (!authLoading) {
      if (!isAuthenticated) {
        console.log("User not authenticated, navigating to landing page");
        navigate("/", { replace: true });
      } else if (isAuthenticated && user) {
        console.log("User authenticated, navigating to dashboard");
        // Navigate publisher directly to marketplace
        if (user.role === "publisher") {
          navigate("/marketplace", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

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

  // Update project details when user changes
  useEffect(() => {
    if (user) {
      setProjectDetails((prev) => ({ ...prev, seller: user.name }));
    }
  }, [user]);

  // Check if user just registered and navigate to upload
  useEffect(() => {
    if (isAuthenticated && user) {
      const isNewUser = localStorage.getItem("isNewUser") === "true";
      if (isNewUser) {
        setCurrentView("upload");
        // Clear the flag after navigation
        localStorage.removeItem("isNewUser");
      }
    }
  }, [isAuthenticated, user]);

  // Animate navbar on mount
  useEffect(() => {
    if (isAuthenticated && headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }

    if (isAuthenticated && logoRef.current) {
      gsap.fromTo(
        logoRef.current,
        { scale: 0, rotation: -360 },
        {
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: "elastic.out(1, 0.5)",
          delay: 0.2,
        }
      );
    }
  }, [isAuthenticated]);

  // File upload handler
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file || !file.name.endsWith(".zip")) {
        setError("Please upload a valid .zip file.");
        return;
      }

      setIsLoading(true);
      setError(null);
      setProgress({ percent: 0, stage: "Starting..." });
      setHtmlContent(null);
      setProjectFiles({});
      setIsListed(false);

      try {
        const zip = await JSZip.loadAsync(file, {
          onUpdate: (metadata: { percent: number }) => {
            setProgress({ percent: metadata.percent, stage: "Unzipping..." });
          },
        });

        setProgress({ percent: 100, stage: "Preparing preview..." });

        const fileBlobs: Record<string, Blob> = {};
        let htmlFile: string | null = null;
        let htmlFileInRoot: string | null = null;
        let htmlFileInSubdir: string | null = null;

        const promises = Object.keys(zip.files).map(async (filename) => {
          const zipEntry = zip.files[filename];
          if (!zipEntry.dir) {
            const blob = await zipEntry.async("blob");
            fileBlobs[filename] = blob;
            if (filename.toLowerCase().endsWith("index.html")) {
              if (!filename.includes("/")) {
                htmlFileInRoot = filename;
              } else {
                if (!htmlFileInSubdir) htmlFileInSubdir = filename;
              }
            }
          }
        });

        await Promise.all(promises);

        htmlFile = htmlFileInRoot || htmlFileInSubdir;

        if (!htmlFile) {
          throw new Error(
            "No index.html file found in the zip. Please ensure your project has an index.html file."
          );
        }

        setProjectFiles(fileBlobs);
        setHtmlContent(htmlFile);
        setPreviewKey((prev) => prev + 1); // Force iframe remount
        setProgress(null);
        setIsLoading(false);

        // Auto-navigate back to main view after successful upload
        if (currentView === "upload") {
          setTimeout(() => setCurrentView("main"), 1000);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to process the uploaded file."
        );
        setIsLoading(false);
        setProgress(null);
      }
    },
    [currentView]
  );

  // Authentication handlers using the useAuth hook
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      clearError(); // Clear any previous errors
      try {
        await login(credentials);
      } catch (err) {
        // Error is handled by the useAuth hook
        throw err;
      }
    },
    [login, clearError]
  );

  const handleSignUp = useCallback(
    async (data: SignUpData) => {
      clearError(); // Clear any previous errors
      try {
        await signup(data);
      } catch (err) {
        // Error is handled by the useAuth hook
        throw err;
      }
    },
    [signup, clearError]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    // Reset project details to default
    setProjectDetails({
      title: "My Awesome Game",
      description:
        "This is a stunning 3D experience built with the latest web technologies. Explore interactive scenes and beautiful graphics.",
      price: "19.99",
      seller: "Creative Coder",
    });
    setCurrentView("main");
    setHtmlContent(null);
    setProjectFiles({});
    setIsListed(false);
  }, [logout]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Conditional rendering based on current view
  if (currentView === "upload") {
    return (
      <UploadView
        user={user}
        onBackToMain={() => setCurrentView("main")}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col font-sans">
      <header
        ref={headerRef}
        className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10"
      >
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div ref={logoRef}>
                <RnDLogo size={32} className="sm:w-10 sm:h-10" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                RnD Game <span className="text-indigo-400">Marketplace</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">
                      Welcome,{" "}
                      <span className="font-medium text-white">
                        {user.name}
                      </span>
                    </p>
                    <div className="flex items-center justify-end space-x-2 text-xs text-gray-400">
                      <span>{user.email}</span>
                      <RoleBadge role={user.role} size="sm" />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setCurrentView("upload")}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border border-indigo-500 transition-colors"
                    >
                      Upload Project
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border border-indigo-500 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-4 pt-4 border-t border-gray-700">
              {isAuthenticated && user ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-300">
                      Welcome,{" "}
                      <span className="font-medium text-white">
                        {user.name}
                      </span>
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 mt-1">
                      <span>{user.email.split("@")[0]}</span>
                      <RoleBadge role={user.role} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        setCurrentView("upload");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border border-indigo-500 transition-colors"
                    >
                      Upload Project
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      navigate("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border border-indigo-500 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <aside className="lg:col-span-1 bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6 h-max">
          <ProjectControls
            onFileUpload={handleFileUpload}
            onListProject={(details) => setIsListed(true)}
            projectDetails={projectDetails}
            setProjectDetails={setProjectDetails}
            isListed={isListed}
            isLoading={isLoading}
            error={error}
            hasProject={!!htmlContent}
            progress={progress}
            user={user}
          />
        </aside>

        <section className="lg:col-span-2 bg-gray-800/60 rounded-xl border border-gray-700 shadow-md flex-grow overflow-hidden">
          <WebGLPreview
            key={previewKey}
            htmlContent={htmlContent}
            isLoading={isLoading}
          />
        </section>
      </main>
    </div>
  );
};

export default MainPage;
