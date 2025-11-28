import { RepoFormat } from "../types";

declare const JSZip: any;

/**
 * Analyzes source code to detect project format type
 * @param files - Array of files or a zip file
 * @returns Detected format type: "react" | "webgl" | "html"
 */
export const detectProjectFormat = async (
  files: File[] | File
): Promise<RepoFormat> => {
  try {
    let fileEntries: { path: string; content?: string }[] = [];

    // If single file and it's a zip, extract it
    if (files instanceof File && files.name.endsWith(".zip")) {
      const JSZip = (window as any).JSZip;
      if (!JSZip) {
        throw new Error("JSZip library not loaded");
      }

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(files);

      // Extract file paths and contents
      for (const [path, file] of Object.entries(zipContent.files)) {
        const zipFile = file as any;
        if (!zipFile.dir) {
          // For key files, read content for analysis
          const shouldReadContent =
            path.endsWith(".json") ||
            path.endsWith(".js") ||
            path.endsWith(".jsx") ||
            path.endsWith(".ts") ||
            path.endsWith(".tsx") ||
            path.endsWith(".html") ||
            path.toLowerCase().includes("package.json") ||
            path.toLowerCase().includes("manifest.json");

          if (shouldReadContent) {
            try {
              const content = await zipFile.async("string");
              fileEntries.push({ path, content });
            } catch {
              fileEntries.push({ path });
            }
          } else {
            fileEntries.push({ path });
          }
        }
      }
    } else {
      // Handle array of files
      const fileArray = Array.isArray(files) ? files : [files];
      for (const file of fileArray) {
        if (file.type === "text/html" || file.name.endsWith(".html")) {
          const content = await file.text();
          fileEntries.push({ path: file.name, content });
        } else if (
          file.name.endsWith(".json") ||
          file.name.endsWith(".js") ||
          file.name.endsWith(".jsx") ||
          file.name.endsWith(".ts") ||
          file.name.endsWith(".tsx")
        ) {
          const content = await file.text();
          fileEntries.push({ path: file.name, content });
        } else {
          fileEntries.push({ path: file.name });
        }
      }
    }

    // Check for React indicators
    const hasReactIndicators =
      fileEntries.some(
        (entry) =>
          entry.path.includes("package.json") &&
          entry.content &&
          (entry.content.includes('"react"') ||
            entry.content.includes("react-dom") ||
            entry.content.includes("create-react-app"))
      ) ||
      fileEntries.some(
        (entry) =>
          (entry.path.endsWith(".jsx") ||
            entry.path.endsWith(".tsx") ||
            entry.path.includes("node_modules/react")) &&
          entry.content &&
          (entry.content.includes("import React") ||
            entry.content.includes("from 'react'") ||
            entry.content.includes('from "react"'))
      ) ||
      fileEntries.some((entry) => entry.path.includes("src/") && entry.path.includes("App."));

    if (hasReactIndicators) {
      return "react";
    }

    // Check for WebGL/Unity indicators
    const hasWebGLIndicators =
      fileEntries.some(
        (entry) =>
          entry.path.includes("Build/") ||
          entry.path.includes("TemplateData/") ||
          entry.path.includes("UnityLoader.js") ||
          entry.path.includes("UnityInstance")
      ) ||
      fileEntries.some(
        (entry) =>
          entry.content &&
          (entry.content.includes("UnityLoader") ||
            entry.content.includes("UnityInstance") ||
            entry.content.includes("WebGL") ||
            entry.content.includes("Unity WebGL"))
      ) ||
      fileEntries.some((entry) => entry.path.toLowerCase().includes("webgl"));

    if (hasWebGLIndicators) {
      return "webgl";
    }

    // Default to HTML
    return "html";
  } catch (error) {
    console.error("Error detecting project format:", error);
    // Default to HTML if detection fails
    return "html";
  }
};

/**
 * Compresses files into a zip file
 * @param files - Array of files to compress
 * @param filename - Name for the zip file
 * @returns Compressed zip file
 */
export const compressFilesToZip = async (
  files: File[],
  filename: string = "project.zip"
): Promise<File> => {
  const JSZip = (window as any).JSZip;
  if (!JSZip) {
    throw new Error("JSZip library not loaded");
  }

  const zip = new JSZip();

  // Add all files to zip
  for (const file of files) {
    const fileBlob = await file.arrayBuffer();
    zip.file(file.name, fileBlob);
  }

  // Generate zip file
  const zipBlob = await zip.generateAsync({ type: "blob" });
  return new File([zipBlob], filename, { type: "application/zip" });
};

