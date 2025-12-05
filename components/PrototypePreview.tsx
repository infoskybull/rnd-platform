import React, { useState, useEffect, useRef } from "react";
import { buildService, BuildStatusResponse } from "../services/buildService";

interface PrototypePreviewProps {
  zipFile: File | null;
  htmlContent?: string | null; // Direct HTML content for simple HTML prototypes
  onBuildComplete?: (previewUrl: string, fileKey?: string) => void; // Updated to include fileKey
  onDeviceChange?: (previewWidth: number) => void; // Callback when device/preview size changes
  projectType?: "react" | "webgl" | "html"; // Project format type
  zipFileKey?: string; // Optional fileKey of the uploaded zip file
}

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  ratio: string;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { name: "iPhone 15 Pro Max", width: 430, height: 932, ratio: "19.5:9" },
  { name: "iPhone 15 Pro", width: 393, height: 852, ratio: "19.5:9" },
  { name: "iPhone 14 Pro Max", width: 430, height: 932, ratio: "19.5:9" },
  { name: "iPhone 14 Pro", width: 393, height: 852, ratio: "19.5:9" },
  { name: "iPhone SE", width: 375, height: 667, ratio: "16:9" },
  { name: "Samsung Galaxy S24 Ultra", width: 412, height: 915, ratio: "20:9" },
  { name: "Samsung Galaxy S24", width: 360, height: 780, ratio: "20:9" },
  { name: "Samsung Galaxy S23 Ultra", width: 412, height: 915, ratio: "20:9" },
  { name: "Google Pixel 8 Pro", width: 412, height: 915, ratio: "20:9" },
  { name: "Google Pixel 8", width: 360, height: 780, ratio: "20:9" },
  { name: "OnePlus 12", width: 412, height: 915, ratio: "20:9" },
  { name: "Xiaomi 14 Pro", width: 412, height: 915, ratio: "20:9" },
  { name: "Custom", width: 280, height: 480, ratio: "9:16" },
];

const PrototypePreview: React.FC<PrototypePreviewProps> = ({
  zipFile,
  htmlContent: directHtmlContent,
  onBuildComplete,
  onDeviceChange,
  projectType,
  zipFileKey,
}) => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] =
    useState<BuildStatusResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [buildId, setBuildId] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0); // Force iframe reload
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(
    DEVICE_PRESETS[DEVICE_PRESETS.length - 1]
  ); // Default to Custom
  const [previewWidth, setPreviewWidth] = useState<number>(280);
  const [previewHeight, setPreviewHeight] = useState<number>(480);
  const [isUnityWebGL, setIsUnityWebGL] = useState(false);

  useEffect(() => {
    // If direct HTML content is provided, use it directly (simple HTML prototype)
    if (directHtmlContent) {
      setHtmlContent(directHtmlContent);
      setError(null);
      setLoadError(false);
      setIsBuilding(false);
      setIframeKey((prev) => prev + 1);
      return;
    }

    // Otherwise, build project from ZIP
    if (zipFile) {
      startBuild();
    } else {
      // Reset state when zipFile is cleared
      setIsBuilding(false);
      setBuildProgress(null);
      setPreviewUrl(null);
      setHtmlContent(null);
      setError(null);
      setBuildId(null);
    }
  }, [zipFile, directHtmlContent]);

  const startBuild = async () => {
    if (!zipFile) return;

    setIsBuilding(true);
    setError(null);
    setBuildProgress({
      status: "pending",
      progress: { stage: "Starting build...", percent: 0 },
    });

    try {
      // Map projectType: "html" -> undefined (use default), "react" -> "react", "webgl" -> "webgl"
      const buildProjectType: "react" | "webgl" | undefined =
        projectType === "html" ? undefined : projectType;

      // Start build and get buildId
      const buildResponse = await buildService.buildProject({
        zipFile,
        projectName: "prototype",
        projectType: buildProjectType,
      });

      if (!buildResponse.success || !buildResponse.buildId) {
        throw new Error(buildResponse.error || "Failed to start build");
      }

      // Store buildId for reload functionality
      setBuildId(buildResponse.buildId);

      // Poll for status with progress tracking
      const finalStatus = await buildService.pollBuildStatus(
        buildResponse.buildId,
        (progress) => {
          setBuildProgress(progress);
        }
      );

      if (finalStatus.status === "completed" && finalStatus.standaloneHtmlUrl) {
        setPreviewUrl(finalStatus.standaloneHtmlUrl);
        onBuildComplete?.(finalStatus.standaloneHtmlUrl, zipFileKey);
        setError(null);
        setLoadError(false);
        // Load HTML content for mobile preview
        await loadHtmlContent(finalStatus.standaloneHtmlUrl);
        setIframeKey((prev) => prev + 1); // Reset iframe
      } else {
        throw new Error(
          finalStatus.error || "Build completed but no preview URL available"
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to build project";
      setError(errorMessage);
      setBuildProgress({
        status: "failed",
        error: errorMessage,
      });
    } finally {
      setIsBuilding(false);
    }
  };

  const getProgressStage = (): string => {
    if (!buildProgress) return "Waiting...";
    return buildProgress.progress?.stage || "Processing...";
  };

  const getProgressPercent = (): number => {
    if (!buildProgress) return 0;
    return buildProgress.progress?.percent || 0;
  };

  // Load HTML content from URL for mobile preview
  const loadHtmlContent = async (url: string) => {
    setIsLoadingHtml(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load HTML: ${response.statusText}`);
      }
      const html = await response.text();

      // Check if this is a Unity WebGL build (has createUnityInstance)
      const isUnityWebGL =
        html.includes("createUnityInstance") || html.includes("UnityLoader");

      // For Unity WebGL, we need to inject interceptor script to handle relative URLs
      if (isUnityWebGL) {
        const interceptorScript = `
          (function() {
            // Fix for Unity WebGL URL creation in srcDoc iframe
            const originalURL = window.URL || window.webkitURL;
            
            // Override URL constructor to handle relative paths
            if (originalURL) {
              const OriginalURL = originalURL;
              window.URL = function(url, base) {
                try {
                  // Try to create URL normally first
                  if (base) {
                    return new OriginalURL(url, base);
                  }
                  // If it's an absolute URL, use it directly
                  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
                    return new OriginalURL(url);
                  }
                  // For relative URLs in srcDoc, create a blob URL or use data URL
                  // This is a workaround for Unity WebGL
                  return new OriginalURL(url, window.location.href || 'about:srcdoc');
                } catch (e) {
                  // Fallback: create a blob URL from empty blob
                  const blob = new Blob();
                  const blobUrl = OriginalURL.createObjectURL(blob);
                  // Return a URL object that won't break Unity
                  try {
                    return new OriginalURL(blobUrl);
                  } catch (e2) {
                    // Last resort: return a dummy URL
                    return { href: url, toString: () => url };
                  }
                }
              };
              window.URL.prototype = OriginalURL.prototype;
              window.URL.createObjectURL = OriginalURL.createObjectURL.bind(OriginalURL);
              window.URL.revokeObjectURL = OriginalURL.revokeObjectURL.bind(OriginalURL);
            }
          })();
        `;

        // Inject interceptor script before Unity scripts
        const headEndIndex = html.toLowerCase().indexOf("</head>");
        if (headEndIndex !== -1) {
          setHtmlContent(
            `${html.slice(
              0,
              headEndIndex
            )}<script>${interceptorScript}</script>${html.slice(headEndIndex)}`
          );
        } else {
          setHtmlContent(`<script>${interceptorScript}</script>${html}`);
        }
      } else {
        setHtmlContent(html);
      }

      setLoadError(false);
    } catch (err) {
      console.error("Error loading HTML content:", err);
      setLoadError(true);
      setHtmlContent(null);
    } finally {
      setIsLoadingHtml(false);
    }
  };

  // Handle iframe load success
  const handleIframeLoad = () => {
    setLoadError(false);
    setIsReloading(false);
  };

  // Sync preview dimensions with selected device and auto-reload
  useEffect(() => {
    setPreviewWidth(selectedDevice.width);
    setPreviewHeight(selectedDevice.height);

    // Notify parent about preview width change
    onDeviceChange?.(selectedDevice.width);

    // Auto-reload iframe when device changes (if we have content to show)
    if (htmlContent || previewUrl) {
      setIframeKey((prev) => prev + 1);
      setIsReloading(true);

      // Reset reloading state after a short delay
      setTimeout(() => {
        setIsReloading(false);
      }, 500);
    }
  }, [selectedDevice, htmlContent, previewUrl, onDeviceChange]);

  // Handle device selection change
  const handleDeviceChange = (device: DevicePreset) => {
    setSelectedDevice(device);
  };

  // Detect iframe load errors using timeout
  useEffect(() => {
    if (previewUrl && !isBuilding) {
      const timeout = setTimeout(() => {
        // If iframe hasn't loaded after 10 seconds, consider it an error
        // This is a fallback - the iframe onLoad should handle successful loads
        const iframe = iframeRef.current;
        if (iframe) {
          try {
            // Try to check if iframe has content
            // If we can't access it due to CORS, that's okay - it might still be loading
            // We'll only show error if user explicitly reports it or after very long timeout
          } catch (e) {
            // Silent - CORS is expected
          }
        }
      }, 15000); // 15 second timeout for very slow connections

      return () => clearTimeout(timeout);
    }
  }, [previewUrl, isBuilding, iframeKey]);

  // Reload preview - fetch new previewUrl from API and reload iframe
  const handleReloadPreview = async () => {
    if (!buildId) {
      // If no buildId, just reload iframe with current URL
      setIframeKey((prev) => prev + 1);
      return;
    }

    setIsReloading(true);
    setLoadError(false);

    try {
      // Fetch latest build status from API
      const status = await buildService.getBuildStatus(buildId);

      if (status.status === "completed" && status.standaloneHtmlUrl) {
        // Update previewUrl with new URL from API
        const newPreviewUrl = status.standaloneHtmlUrl;

        // Only update if URL changed
        if (newPreviewUrl !== previewUrl) {
          setPreviewUrl(newPreviewUrl);
          onBuildComplete?.(newPreviewUrl, zipFileKey);
          // Load new HTML content
          await loadHtmlContent(newPreviewUrl);
        } else {
          // Reload HTML content even if URL is same
          await loadHtmlContent(newPreviewUrl);
        }

        // Force iframe reload with new/updated URL
        setIframeKey((prev) => prev + 1);
        setError(null);
      } else if (status.status === "building" || status.status === "pending") {
        // Build is still in progress, show progress
        setBuildProgress(status);
        setError(null);
        // Don't reload iframe yet, wait for completion
      } else {
        // Build failed or status unknown
        throw new Error(status.error || "Build status check failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reload preview";
      setError(errorMessage);
      setLoadError(true);

      // Still try to reload iframe with current URL as fallback
      setIframeKey((prev) => prev + 1);
    } finally {
      setIsReloading(false);
    }
  };

  // Calculate container width based on preview width + padding + border
  // p-3 = 12px padding on each side = 24px total
  // border = 1px on each side = 2px total
  const containerWidth = previewWidth + 24 + 2; // previewWidth + padding + border

  return (
    <div
      className="mt-3 p-3 bg-white rounded-lg border border-gray-300"
      style={{
        width: `${containerWidth}px`,
        maxWidth: "100%", // Ensure it doesn't exceed parent width
      }}
    >
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Prototype Preview
      </h4>

      {/* Building State */}
      {isBuilding && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm text-gray-700">{getProgressStage()}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercent()}%` }}
            ></div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            {getProgressPercent()}% - {getProgressStage()}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isBuilding && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-red-700">
              Build Failed
            </span>
          </div>
          <p className="text-xs text-red-600">{error}</p>
          <button
            onClick={startBuild}
            className="mt-2 px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Retry Build
          </button>
        </div>
      )}

      {/* Preview State - Show if we have HTML content (either from build or direct) */}
      {(htmlContent || previewUrl) && !isBuilding && !error && (
        <div className="space-y-2">
          {/* Device Selection Dropdown */}
          <div className="mb-2">
            <label className="text-xs text-gray-600 mb-1 block">
              Select Device Size
            </label>
            <div className="relative">
              <select
                value={selectedDevice.name}
                onChange={(e) => {
                  const device = DEVICE_PRESETS.find(
                    (d) => d.name === e.target.value
                  );
                  if (device) {
                    handleDeviceChange(device);
                  }
                }}
                className="w-full px-2 py-1.5 text-xs text-gray-500 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white pr-8"
                disabled={isReloading}
              >
                {DEVICE_PRESETS.map((device) => (
                  <option key={device.name} value={device.name}>
                    {device.name} ({device.width}×{device.height},{" "}
                    {device.ratio})
                  </option>
                ))}
              </select>
              {isReloading && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="animate-spin h-4 w-4 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-green-600">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-xs font-medium">
                {directHtmlContent ? "Preview ready" : "Build completed"}
              </span>
            </div>
            {!directHtmlContent && (
              <button
                onClick={handleReloadPreview}
                disabled={isReloading}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reload preview"
              >
                {isReloading ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Reloading...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Reload</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Load Error Warning - Only show for built projects */}
          {loadError && !directHtmlContent && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-xs font-medium text-yellow-700">
                  Preview load error
                </span>
              </div>
              <p className="text-xs text-yellow-600 mb-2">
                Có thể do lỗi CloudFront hoặc mất mạng. Vui lòng thử reload.
              </p>
              <button
                onClick={startBuild}
                className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Rebuild Project
              </button>
            </div>
          )}

          {/* Mobile Preview Container */}
          <div className="relative flex items-center justify-center">
            <div
              className="relative bg-gray-800 rounded-[2.5rem] p-2 shadow-2xl"
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
              }}
            >
              {/* Phone Frame */}
              <div className="relative w-full h-full bg-white rounded-[2rem] overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20"></div>

                {/* Loading State */}
                {(isLoadingHtml || isReloading) && !directHtmlContent && (
                  <div className="absolute inset-0 bg-gray-100 bg-opacity-95 flex flex-col justify-center items-center z-10">
                    <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-300 rounded-full animate-spin"></div>
                    <p className="mt-3 text-sm font-semibold text-gray-700 text-center">
                      Loading...
                    </p>
                  </div>
                )}

                {/* Error State */}
                {loadError && !isLoadingHtml && !directHtmlContent && (
                  <div className="absolute inset-0 bg-gray-100 flex justify-center items-center z-10">
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg max-w-xs text-center mx-4">
                      <h3 className="font-bold text-sm mb-1">Preview Error</h3>
                      <p className="text-xs break-words mb-2">
                        Không thể load preview
                      </p>
                      <button
                        onClick={handleReloadPreview}
                        className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Reload Preview
                      </button>
                    </div>
                  </div>
                )}

                {/* Preview Iframe */}
                {htmlContent && !isLoadingHtml && !loadError && (
                  <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    // For Unity WebGL, use src directly to avoid URL construction issues
                    // For other HTML, use srcDoc with mobile CSS injected
                    {...(isUnityWebGL && previewUrl
                      ? {
                          src: previewUrl,
                          sandbox:
                            "allow-scripts allow-same-origin allow-forms allow-popups allow-modals",
                        }
                      : {
                          srcDoc: (() => {
                            // Mobile viewport CSS for proper fit in mobile preview
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
                                  htmlContent.slice(headEndIndex)
                              : `<head>${mobileViewportCSS}</head>` +
                                  htmlContent;
                          })(),
                          sandbox:
                            "allow-scripts allow-same-origin allow-forms allow-popups allow-modals",
                        })}
                    className="w-full h-full border-0"
                    style={{
                      transform: "scale(1)",
                      transformOrigin: "top left",
                      width: "100%",
                      height: "100%",
                    }}
                    title="Prototype Preview"
                    onLoad={handleIframeLoad}
                  />
                )}

                {!htmlContent && !isLoadingHtml && !loadError && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-gray-600 text-xs text-center px-2">
                      No preview available
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {previewUrl && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Preview ready</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                Open in new tab
              </a>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!zipFile && !isBuilding && !previewUrl && !error && (
        <div className="text-center py-8 text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-2"
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
          <p className="text-xs">Upload ZIP file to build and preview</p>
        </div>
      )}
    </div>
  );
};

export default PrototypePreview;
