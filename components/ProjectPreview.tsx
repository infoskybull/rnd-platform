import React, { useState, useEffect } from "react";
import { Play, Download, AlertCircle, Loader } from "lucide-react";

interface ProjectPreviewProps {
  fileUrls: string[];
  projectTitle: string;
}

interface ProjectFiles {
  [path: string]: Blob;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

const ProjectPreview: React.FC<ProjectPreviewProps> = ({
  fileUrls,
  projectTitle,
}) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [projectFiles, setProjectFiles] = useState<ProjectFiles>({});
  const [fileInfo, setFileInfo] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

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

  const downloadAndExtractProject = async () => {
    if (!fileUrls || fileUrls.length === 0) {
      setError("No project files available for preview");
      return;
    }

    // Check if JSZip is available
    if (typeof (window as any).JSZip === "undefined") {
      setError(
        "JSZip library is not loaded. Please refresh the page and try again."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Download the first file URL (assuming it's the main project file)
      const response = await fetch(fileUrls[0]);
      if (!response.ok) {
        throw new Error(
          `Failed to download project file: ${response.statusText}`
        );
      }

      const zipBlob = await response.blob();

      // Extract the zip file
      const zip = new (window as any).JSZip();
      const zipContent = await zip.loadAsync(zipBlob);

      const files: ProjectFiles = {};
      const fileInfos: FileInfo[] = [];

      // Extract all files from the zip
      for (const [path, file] of Object.entries(zipContent.files)) {
        const zipFile = file as any; // JSZip file object
        if (!zipFile.dir) {
          const fileBlob = await zipFile.async("blob");
          files[path] = fileBlob;

          // Get file extension
          const extension = path.split(".").pop()?.toLowerCase() || "unknown";

          fileInfos.push({
            name: path,
            size: fileBlob.size,
            type: extension,
          });
        }
      }

      setProjectFiles(files);
      setFileInfo(fileInfos);

      // Look for index.html in the root or in common directories
      let htmlFile = zipContent.file("index.html");
      if (!htmlFile) {
        htmlFile = zipContent.file("Build/index.html");
      }
      if (!htmlFile) {
        htmlFile = zipContent.file("TemplateData/index.html");
      }
      if (!htmlFile) {
        // Look for any HTML file
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
        setPreviewKey((prev) => prev + 1); // Force re-render of preview
      } else {
        setError(
          "No HTML file found in the project. This project may not be previewable."
        );
      }
    } catch (err) {
      console.error("Error processing project file:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load project preview"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const Placeholder = ({
    message,
    subtext,
  }: {
    message: string;
    subtext: string;
  }) => (
    <div className="w-full h-96 flex flex-col items-center justify-center bg-gray-800 rounded-lg text-center p-6">
      <div className="max-w-md">
        <Play className="mx-auto h-16 w-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">{message}</h3>
        <p className="text-sm text-gray-500 mb-4">{subtext}</p>
        <button
          onClick={downloadAndExtractProject}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Load Preview
            </>
          )}
        </button>
      </div>
    </div>
  );

  const ErrorDisplay = ({ error }: { error: string }) => (
    <div className="w-full h-96 flex flex-col items-center justify-center bg-gray-800 rounded-lg text-center p-6">
      <div className="max-w-md">
        <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-400 mb-2">
          Preview Error
        </h3>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <button
          onClick={downloadAndExtractProject}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Try Again
            </>
          )}
        </button>
      </div>
    </div>
  );

  const LoadingDisplay = () => (
    <div className="w-full h-96 flex flex-col items-center justify-center bg-gray-800 rounded-lg text-center p-6">
      <div className="max-w-md">
        <Loader className="mx-auto h-16 w-16 text-indigo-400 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">
          Loading Project...
        </h3>
        <p className="text-sm text-gray-500">
          Downloading and extracting project files...
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingDisplay />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!htmlContent) {
    return (
      <Placeholder
        message="Project Preview"
        subtext="Click the button below to load and preview this project."
      />
    );
  }

  // This script is injected into the iframe to intercept file requests
  const interceptorScript = `
    const requests = new Map();
    let requestIdCounter = 0;

    // Listen for file content responses from the parent window
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

    // Function to request a file from the parent window
    function requestFileFromHost(path) {
        return new Promise((resolve, reject) => {
            const requestId = requestIdCounter++;
            requests.set(requestId, { resolve, reject });
            window.parent.postMessage({ type: 'GET_FILE', path, requestId }, '*');
        });
    }

    // --- Fetch Interceptor ---
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

    // --- XHR Interceptor ---
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

  // Inject the interceptor script into the head of the HTML content
  const headEndIndex = htmlContent.toLowerCase().indexOf("</head>");
  const modifiedHtmlContent =
    headEndIndex !== -1
      ? htmlContent.slice(0, headEndIndex) +
        `<script>${interceptorScript}</script>` +
        htmlContent.slice(headEndIndex)
      : `<head><script>${interceptorScript}</script></head>` + htmlContent;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Play className="w-5 h-5 mr-2 text-indigo-400" />
            Live Preview
          </h3>
          <div className="flex items-center space-x-4">
            {fileInfo.length > 0 && (
              <div className="text-sm text-gray-400">
                {fileInfo.length} files •{" "}
                {formatFileSize(
                  fileInfo.reduce((sum, file) => sum + file.size, 0)
                )}
              </div>
            )}
            <span className="text-sm text-gray-400">
              Project: {projectTitle}
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        </div>
        <div className="relative" style={{ height: "600px" }}>
          <iframe
            key={previewKey}
            srcDoc={modifiedHtmlContent}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            title={`Preview of ${projectTitle}`}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectPreview;
