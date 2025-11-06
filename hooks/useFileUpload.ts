import { useState } from "react";
import { apiService } from "../services/api";
import {
  getFileTypeInfo,
  validateFileSize,
  isSupportedFileType,
} from "../utils/fileUtils";

interface FileUploadResult {
  fileKey: string; // S3 key for the uploaded file
  uploadUrl: string; // URL to upload file to S3
  error?: string;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file: File) => {
    // Check if file type is supported
    if (!isSupportedFileType(file)) {
      throw new Error(
        "File type not supported. Please use video files (MP4, AVI, MOV, etc.), image files (JPEG, PNG, GIF, etc.), or archive files (ZIP, RAR, 7Z)."
      );
    }

    // Check file size
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      throw new Error(sizeValidation.error);
    }

    return true;
  };

  const uploadFile = async (file: File): Promise<FileUploadResult> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Validate file before upload
      validateFile(file);

      // Get file type info
      const fileInfo = getFileTypeInfo(file);

      // Ensure we have a supported file type
      if (fileInfo.type === "unknown") {
        throw new Error("Unsupported file type");
      }

      // Step 1: Get presigned URL using API service
      const { uploadUrl, fileKey } = await apiService.getPresignedUrl({
        fileName: file.name,
        fileType: file.name.endsWith(".zip")
          ? "archive"
          : fileInfo.type === "video"
          ? "video"
          : "image",
        contentType: file.type,
        fileSize: file.size,
      });

      // Step 2: Upload to S3 with progress tracking
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            setUploading(false);
            setUploadProgress(0);
            resolve({ fileKey, uploadUrl });
          } else {
            setUploading(false);
            setUploadProgress(0);
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => {
          setUploading(false);
          setUploadProgress(0);
          reject(new Error("Upload failed"));
        });

        xhr.addEventListener("abort", () => {
          setUploading(false);
          setUploadProgress(0);
          reject(new Error("Upload cancelled"));
        });

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      return { fileKey: "", uploadUrl: "", error: errorMessage };
    }
  };

  const uploadWithRetry = async (
    file: File,
    maxRetries = 3
  ): Promise<FileUploadResult> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await uploadFile(file);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Upload failed");

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    setUploading(false);
    setUploadProgress(0);
    throw lastError;
  };

  const cancelUpload = () => {
    setUploading(false);
    setUploadProgress(0);
  };

  return {
    uploadFile,
    uploadWithRetry,
    uploading,
    uploadProgress,
    cancelUpload,
  };
};
