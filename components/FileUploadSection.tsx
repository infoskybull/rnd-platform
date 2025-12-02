import React, { useState, useRef, useCallback, useEffect } from "react";

interface FileUploadSectionProps {
  title: string;
  required?: boolean;
  format?: string;
  size?: string;
  maxFiles?: number;
  currentFiles?: number;
  acceptedFileTypes?: string; // e.g., "image/*" or ".jpg,.png"
  onFilesChange?: (files: File[]) => void;
  maxFileSize?: number; // in bytes
  initialFiles?: File[]; // Initial files to display (for edit mode)
}

interface UploadedFile {
  file: File;
  preview: string;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  title,
  required = false,
  format = "JPEG; JPG; PNG;",
  size = "512x512 pixels",
  maxFiles = 1,
  currentFiles: externalCurrentFiles,
  acceptedFileTypes = "image/*",
  onFilesChange,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  initialFiles,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const currentFiles =
    externalCurrentFiles !== undefined
      ? externalCurrentFiles
      : uploadedFiles.length;

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type based on acceptedFileTypes
    if (acceptedFileTypes) {
      const acceptedTypes = acceptedFileTypes.split(",").map((t) => t.trim());
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const fileType = file.type;

      const isAccepted = acceptedTypes.some((type) => {
        if (type.includes("*")) {
          // Handle wildcards like "image/*"
          const baseType = type.split("/")[0];
          return fileType.startsWith(baseType + "/");
        } else if (type.startsWith(".")) {
          // Handle extensions like ".jpg,.png"
          return fileExtension === type.toLowerCase();
        } else {
          // Handle MIME types
          return fileType === type;
        }
      });

      if (!isAccepted) {
        return `File type not supported. Accepted: ${format}`;
      }
    }

    return null;
  };

  const createPreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        // For non-image files, return empty string or a placeholder
        resolve("");
      }
    });
  }, []);

  // Initialize with initialFiles if provided (for edit mode)
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0 && !hasInitialized) {
      const initializeFiles = async () => {
        const filePromises = initialFiles.map(async (file) => {
          const preview = await createPreview(file);
          return { file, preview };
        });
        const filesWithPreviews = await Promise.all(filePromises);
        setUploadedFiles(filesWithPreviews);
        onFilesChange?.(initialFiles);
        setHasInitialized(true);
      };
      initializeFiles();
    }
  }, [initialFiles, hasInitialized, onFilesChange, createPreview]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      setError("");

      // Check max files limit
      const remainingSlots = maxFiles - uploadedFiles.length;
      if (fileArray.length > remainingSlots) {
        setError(`You can only upload ${remainingSlots} more file(s)`);
        return;
      }

      const validFiles: UploadedFile[] = [];
      const errors: string[] = [];

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          continue;
        }

        try {
          const preview = await createPreview(file);
          validFiles.push({ file, preview });
        } catch (err) {
          errors.push(`${file.name}: Failed to create preview`);
        }
      }

      if (errors.length > 0) {
        setError(errors.join("; "));
      }

      if (validFiles.length > 0) {
        const newFiles = [...uploadedFiles, ...validFiles];
        setUploadedFiles(newFiles);
        onFilesChange?.(newFiles.map((f) => f.file));
      }
    },
    [
      uploadedFiles,
      maxFiles,
      acceptedFileTypes,
      format,
      maxFileSize,
      onFilesChange,
    ]
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
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    if (uploadedFiles.length >= maxFiles) {
      setError(`Maximum ${maxFiles} file(s) allowed`);
      return;
    }
    fileInputRef.current?.click();
  }, [uploadedFiles.length, maxFiles]);

  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(newFiles);
      onFilesChange?.(newFiles.map((f) => f.file));
      setError("");
    },
    [uploadedFiles, onFilesChange]
  );

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

      {/* Uploaded Files List - Show separately when files exist */}
      {uploadedFiles.length > 0 && (
        <div className="w-full max-w-[295px] mb-2">
          <div className="file-list-scroll max-h-[200px] overflow-y-auto space-y-2 pr-1">
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="relative flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {uploadedFile.preview ? (
                  <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-white border border-gray-200">
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
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
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate font-medium">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
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
          uploadedFiles.length === 0 ? "max-h-[125px]" : "min-h-[80px]"
        } justify-center text-center transition-colors cursor-pointer relative p-4 ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-500"
        } ${
          uploadedFiles.length >= maxFiles
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        {uploadedFiles.length === 0 ? (
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
            <p className="text-sm text-gray-600 mb-2">Drag and Drop file</p>
          </>
        ) : (
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
            {uploadedFiles.length < maxFiles && (
              <p className="text-xs text-gray-500">Click to add more files</p>
            )}
            {uploadedFiles.length >= maxFiles && (
              <p className="text-xs text-gray-400">Maximum files reached</p>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes}
          multiple={maxFiles > 1}
          onChange={handleFileInputChange}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 mt-1 text-center w-full px-4">
          {error}
        </p>
      )}

      {/* Bottom Info */}
      <div className="flex items-start justify-between w-full px-4 pt-1">
        {/* Bottom left - Format and Size */}
        <div className="bottom-2 left-2 flex flex-col items-start">
          <p className="text-xs text-gray-500">Format: {format}</p>
          <p className="text-xs text-gray-500">Size: {size}</p>
        </div>

        {/* Bottom right - File count */}
        <div className="bottom-2 right-2">
          <p className="text-xs text-gray-500">
            {currentFiles}/{maxFiles} file uploaded
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadSection;
