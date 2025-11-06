// File utility functions for upload handling
import React from "react";
import { CameraIcon, PackageIcon } from "../components/icons/Icons";
import { PlayIcon } from "../components/ai-generator/icons/PlayIcon";

export interface FileTypeInfo {
  type: "video" | "image" | "archive" | "unknown";
  category: string;
  icon: React.ReactNode;
  maxSize: number; // in bytes
}

export const getFileTypeInfo = (file: File): FileTypeInfo => {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Video files
  if (
    mimeType.startsWith("video/") ||
    fileName.endsWith(".mp4") ||
    fileName.endsWith(".avi") ||
    fileName.endsWith(".mov") ||
    fileName.endsWith(".wmv") ||
    fileName.endsWith(".webm") ||
    fileName.endsWith(".ogg") ||
    fileName.endsWith(".mkv") ||
    fileName.endsWith(".flv")
  ) {
    return {
      type: "video",
      category: "Video",
      icon: <PlayIcon className="w-5 h-5" />,
      maxSize: 100 * 1024 * 1024, // 100MB
    };
  }

  // Image files
  if (
    mimeType.startsWith("image/") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".gif") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".svg") ||
    fileName.endsWith(".bmp") ||
    fileName.endsWith(".tiff")
  ) {
    return {
      type: "image",
      category: "Image",
      icon: <CameraIcon className="w-5 h-5" />,
      maxSize: 50 * 1024 * 1024, // 50MB
    };
  }

  // Archive files
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType.includes("compressed") ||
    fileName.endsWith(".zip") ||
    fileName.endsWith(".rar") ||
    fileName.endsWith(".7z") ||
    fileName.endsWith(".tar") ||
    fileName.endsWith(".gz")
  ) {
    return {
      type: "archive",
      category: "Archive",
      icon: <PackageIcon className="w-5 h-5" />,
      maxSize: 50 * 1024 * 1024, // 50MB
    };
  }

  return {
    type: "unknown",
    category: "Unknown",
    icon: "📄",
    maxSize: 10 * 1024 * 1024, // 10MB default
  };
};

export const validateFileSize = (
  file: File
): { valid: boolean; error?: string } => {
  const fileInfo = getFileTypeInfo(file);

  if (file.size > fileInfo.maxSize) {
    const maxSizeMB = (fileInfo.maxSize / 1024 / 1024).toFixed(0);
    return {
      valid: false,
      error: `${fileInfo.category} file size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileExtension = (fileName: string): string => {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
};

export const isSupportedFileType = (file: File): boolean => {
  const fileInfo = getFileTypeInfo(file);
  return fileInfo.type !== "unknown";
};

// Common file type groups for UI display
export const SUPPORTED_FILE_TYPES = {
  video: {
    extensions: [
      ".mp4",
      ".avi",
      ".mov",
      ".wmv",
      ".webm",
      ".ogg",
      ".mkv",
      ".flv",
    ],
    mimeTypes: [
      "video/mp4",
      "video/avi",
      "video/quicktime",
      "video/x-ms-wmv",
      "video/webm",
      "video/ogg",
    ],
    maxSize: "100MB",
    description: "Video files for game trailers, gameplay footage, or demos",
  },
  image: {
    extensions: [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".tiff",
    ],
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
    ],
    maxSize: "50MB",
    description:
      "Images for screenshots, concept art, or promotional materials",
  },
  archive: {
    extensions: [".zip", ".rar", ".7z", ".tar", ".gz"],
    mimeTypes: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/gzip",
    ],
    maxSize: "50MB",
    description: "Compressed archives containing game builds or assets",
  },
};
