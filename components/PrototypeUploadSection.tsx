import React, { useState, useRef, useCallback, useEffect } from "react";
import { detectProjectFormat } from "../utils/projectAnalyzer";
import PrototypePreview from "./PrototypePreview";

declare const JSZip: any;

interface PrototypeUploadSectionProps {
  title: string;
  required?: boolean;
  onFilesChange?: (files: File[]) => void;
  maxFileSize?: number;
  initialFiles?: File[];
  validationError?: string;
  onPreviewDeviceChange?: (previewWidth: number) => void; // Callback when preview device changes
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

const PrototypeUploadSection: React.FC<PrototypeUploadSectionProps> = ({
  title,
  required = false,
  onFilesChange,
  maxFileSize = 100 * 1024 * 1024, // 100MB default for ZIP
  initialFiles,
  validationError,
  onPreviewDeviceChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<
    "html" | "webgl" | "react" | null
  >(null);
  const [fileStructure, setFileStructure] = useState<FileInfo[]>([]);
  const [previewReady, setPreviewReady] = useState(false);
  const [isSimpleHtml, setIsSimpleHtml] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check if it's a ZIP file
    if (!file.name.toLowerCase().endsWith(".zip")) {
      return "Chỉ hỗ trợ file định dạng .ZIP";
    }

    // Check file size
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      return `Kích thước file vượt quá ${maxSizeMB}MB`;
    }

    return null;
  };

  const processZipFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError("");
    setDetectedFormat(null);
    setFileStructure([]);
    setPreviewReady(false);

    try {
      // Check if JSZip is available
      if (typeof (window as any).JSZip === "undefined") {
        throw new Error(
          "JSZip library is not loaded. Please refresh the page."
        );
      }

      const JSZip = (window as any).JSZip;
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      // Extract file structure
      const files: FileInfo[] = [];
      const htmlFiles: string[] = [];

      for (const [path, zipFile] of Object.entries(zipContent.files)) {
        const file = zipFile as any;
        if (!file.dir) {
          const extension = path.split(".").pop()?.toLowerCase() || "unknown";
          files.push({
            name: path,
            size: file._data?.uncompressedSize || 0,
            type: extension,
          });

          // Check if it's an HTML file
          if (extension === "html" || extension === "htm") {
            htmlFiles.push(path);
          }
        }
      }

      setFileStructure(files);

      // Check if ZIP only contains 1 HTML file (simple HTML prototype)
      if (files.length === 1 && htmlFiles.length === 1) {
        // Extract HTML content directly
        const htmlFile = zipContent.file(htmlFiles[0]);
        if (htmlFile) {
          const html = await htmlFile.async("string");
          setHtmlContent(html);
          setIsSimpleHtml(true);
          setDetectedFormat("html");
          setPreviewReady(true);
          return; // Skip build process
        }
      }

      // For complex projects, detect format and require build
      setIsSimpleHtml(false);
      setHtmlContent(null);

      // Detect project format
      try {
        const format = await detectProjectFormat(file);
        setDetectedFormat(format);
      } catch (err) {
        console.error("Error detecting format:", err);
        setDetectedFormat("html"); // Default
      }

      setPreviewReady(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi khi xử lý file ZIP";
      setError(errorMessage);
      setPreviewReady(false);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Initialize with initialFiles if provided
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !hasInitialized) {
      const file = initialFiles[0];
      setUploadedFile(file);
      processZipFile(file);
      onFilesChange?.(initialFiles);
      setHasInitialized(true);
    }
  }, [initialFiles, hasInitialized, onFilesChange, processZipFile]);

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setUploadedFile(file);
      setError("");
      await processZipFile(file);
      onFilesChange?.([file]);
    },
    [validateFile, processZipFile, onFilesChange]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setDetectedFormat(null);
    setFileStructure([]);
    setPreviewReady(false);
    onFilesChange?.([]);
    setError("");
  }, [onFilesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFormatDisplayName = (format: string): string => {
    switch (format) {
      case "react":
        return "React";
      case "webgl":
        return "WebGL";
      case "html":
        return "HTML";
      default:
        return format;
    }
  };

  return (
    <div className="bg-white p-2 rounded-lg flex flex-col items-center justify-center">
      <h3
        className="mb-3"
        style={{
          fontWeight: 700,
          fontSize: "20px",
          lineHeight: "100%",
          letterSpacing: "0%",
          textAlign: "center",
          color: "#374151",
        }}
      >
        {title}
        {required && <span className="text-red-500">*</span>}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-3 text-center px-4">
        Hỗ trợ định dạng HTML, WEBGL và REACT source code. Vui lòng upload file
        .ZIP chứa source code của bạn.
      </p>

      {/* Uploaded File Display */}
      {uploadedFile && (
        <div className="w-full max-w-[295px] mb-2">
          <div className="relative flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-12 h-12 rounded bg-blue-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 truncate font-medium">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
              title="Remove file"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-lg flex items-center max-w-[295px] flex-col ${
          uploadedFile ? "min-h-[80px]" : "max-h-[125px]"
        } justify-center text-center transition-colors cursor-pointer relative p-4 ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-500"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
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
            <p className="text-xs text-gray-500">Đang xử lý...</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center gap-1">
            <svg
              width="40"
              height="40"
              viewBox="0 0 74 74"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-1"
            >
              <path
                d="M18.4783 61.9279C16.7844 61.9279 15.3349 61.3253 14.1297 60.1201C12.9245 58.9149 12.3209 57.4643 12.3188 55.7684V49.609C12.3188 48.7364 12.6145 48.0055 13.2058 47.4163C13.7971 46.827 14.528 46.5314 15.3986 46.5293C16.2691 46.5273 17.001 46.8229 17.5944 47.4163C18.1878 48.0096 18.4824 48.7405 18.4783 49.609V55.7684H55.4348V49.609C55.4348 48.7364 55.7305 48.0055 56.3218 47.4163C56.9131 46.827 57.644 46.5314 58.5145 46.5293C59.3851 46.5273 60.117 46.8229 60.7104 47.4163C61.3037 48.0096 61.5983 48.7405 61.5942 49.609V55.7684C61.5942 57.4623 60.9916 58.9128 59.7864 60.1201C58.5813 61.3273 57.1307 61.9299 55.4348 61.9279H18.4783ZM33.8768 24.5094L28.1024 30.2838C27.4864 30.8998 26.7555 31.1954 25.9096 31.1708C25.0637 31.1461 24.3318 30.8248 23.7138 30.2068C23.1492 29.5909 22.8535 28.8723 22.8268 28.051C22.8001 27.2298 23.0958 26.5112 23.7138 25.8952L34.8007 14.8083C35.1087 14.5003 35.4424 14.2827 35.8017 14.1554C36.161 14.0281 36.5459 13.9634 36.9565 13.9614C37.3672 13.9593 37.7521 14.024 38.1114 14.1554C38.4707 14.2868 38.8044 14.5044 39.1123 14.8083L50.1993 25.8952C50.8152 26.5112 51.1109 27.2298 51.0863 28.051C51.0616 28.8723 50.766 29.5909 50.1993 30.2068C49.5834 30.8228 48.8524 31.1441 48.0065 31.1708C47.1607 31.1975 46.4287 30.9018 45.8107 30.2838L40.0363 24.5094V46.5293C40.0363 47.4019 39.7406 48.1338 39.1493 48.7251C38.558 49.3164 37.8271 49.6111 36.9565 49.609C36.086 49.607 35.3551 49.3113 34.7638 48.7221C34.1725 48.1328 33.8768 47.4019 33.8768 46.5293V24.5094Z"
                fill="#1C8EF9"
              />
            </svg>
            <p className="text-xs text-gray-500">Click để thay đổi file</p>
          </div>
        ) : (
          <>
            <svg
              width="74"
              height="74"
              viewBox="0 0 74 74"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-2"
            >
              <path
                d="M18.4783 61.9279C16.7844 61.9279 15.3349 61.3253 14.1297 60.1201C12.9245 58.9149 12.3209 57.4643 12.3188 55.7684V49.609C12.3188 48.7364 12.6145 48.0055 13.2058 47.4163C13.7971 46.827 14.528 46.5314 15.3986 46.5293C16.2691 46.5273 17.001 46.8229 17.5944 47.4163C18.1878 48.0096 18.4824 48.7405 18.4783 49.609V55.7684H55.4348V49.609C55.4348 48.7364 55.7305 48.0055 56.3218 47.4163C56.9131 46.827 57.644 46.5314 58.5145 46.5293C59.3851 46.5273 60.117 46.8229 60.7104 47.4163C61.3037 48.0096 61.5983 48.7405 61.5942 49.609V55.7684C61.5942 57.4623 60.9916 58.9128 59.7864 60.1201C58.5813 61.3273 57.1307 61.9299 55.4348 61.9279H18.4783ZM33.8768 24.5094L28.1024 30.2838C27.4864 30.8998 26.7555 31.1954 25.9096 31.1708C25.0637 31.1461 24.3318 30.8248 23.7138 30.2068C23.1492 29.5909 22.8535 28.8723 22.8268 28.051C22.8001 27.2298 23.0958 26.5112 23.7138 25.8952L34.8007 14.8083C35.1087 14.5003 35.4424 14.2827 35.8017 14.1554C36.161 14.0281 36.5459 13.9634 36.9565 13.9614C37.3672 13.9593 37.7521 14.024 38.1114 14.1554C38.4707 14.2868 38.8044 14.5044 39.1123 14.8083L50.1993 25.8952C50.8152 26.5112 51.1109 27.2298 51.0863 28.051C51.0616 28.8723 50.766 29.5909 50.1993 30.2068C49.5834 30.8228 48.8524 31.1441 48.0065 31.1708C47.1607 31.1975 46.4287 30.9018 45.8107 30.2838L40.0363 24.5094V46.5293C40.0363 47.4019 39.7406 48.1338 39.1493 48.7251C38.558 49.3164 37.8271 49.6111 36.9565 49.609C36.086 49.607 35.3551 49.3113 34.7638 48.7221C34.1725 48.1328 33.8768 47.4019 33.8768 46.5293V24.5094Z"
                fill="#1C8EF9"
              />
            </svg>
            <p className="text-sm text-gray-600 mb-2">Kéo thả file ZIP</p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".zip,application/zip"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Error Message */}
      {(error || validationError) && (
        <p className="text-xs text-red-500 mt-1 text-center w-full px-4">
          {validationError || error}
        </p>
      )}

      {/* Preview Section */}
      {previewReady && uploadedFile && (
        <div className="w-full max-w-[295px] mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Preview Source Code
          </h4>

          {/* Detected Format */}
          {detectedFormat && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">Định dạng phát hiện:</p>
              <div className="inline-flex items-center px-2 py-1 rounded bg-blue-100 border border-blue-300">
                <span className="text-xs font-medium text-blue-700">
                  {getFormatDisplayName(detectedFormat)}
                </span>
              </div>
            </div>
          )}

          {/* File Structure Preview */}
          {fileStructure.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">
                Cấu trúc file ({fileStructure.length} files):
              </p>
              <div className="max-h-[150px] overflow-y-auto space-y-1 text-xs">
                {fileStructure.slice(0, 10).map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-1 bg-white rounded border border-gray-200"
                  >
                    <span className="text-gray-500 truncate flex-1">
                      {file.name}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
                {fileStructure.length > 10 && (
                  <p className="text-xs text-gray-500 text-center pt-1">
                    ... và {fileStructure.length - 10} file khác
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Indicator */}
          <div className="mt-3 flex items-center gap-2 text-green-600">
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
              Đã upload đúng source code
            </span>
          </div>
        </div>
      )}

      {/* Prototype Build & Preview Section */}
      {previewReady && uploadedFile && (
        <PrototypePreview
          zipFile={isSimpleHtml ? null : uploadedFile}
          htmlContent={isSimpleHtml ? htmlContent : null}
          onDeviceChange={onPreviewDeviceChange}
          projectType={detectedFormat || undefined}
        />
      )}

      {/* Bottom Info */}
      <div className="flex items-start justify-between w-full px-4 pt-1">
        <div className="bottom-2 left-2 flex flex-col items-start">
          <p className="text-xs text-gray-500">Format: ZIP</p>
          <p className="text-xs text-gray-500">
            Max: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB
          </p>
        </div>
        <div className="bottom-2 right-2">
          <p className="text-xs text-gray-500">
            {uploadedFile ? "1/1 file uploaded" : "0/1 file uploaded"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrototypeUploadSection;
