import { useState } from "react";
import { apiService } from "../services/api";

interface ProjectData {
  title: string;
  shortDescription: string;
  longDescription: string; // NEW - Required
  projectType: ("product_sale" | "dev_collaboration")[]; // Always an array
  repoFormat: "react" | "webgl" | "html"; // Required per API docs
  status?: "draft" | "published";
  payToViewAmount: number; // Required - always present (can be 0 for free viewing)
  productSalePrice?: number; // Required if 'product_sale' in projectType (min: 1)
  creatorCollaborationBudget?: number; // Required if 'dev_collaboration' in projectType (min: 1)
  gameGenre?: string; // Common field
  targetPlatform?: string; // Common field
  tags?: string[]; // Common field
  attachments?: string[]; // Optional - fileKeys from S3
  fileUrls?: string[]; // Optional - S3 URLs already uploaded
  fileKeys?: string[]; // Optional - S3 keys to move from pending to created
  thumbnail?: string; // Optional - thumbnail fileKey
  appIcon?: string; // NEW - Optional - app icon fileKey
  previewCode?: string; // Optional - S3 URL of built preview from /api/build/start
}

interface ProjectCreationResult {
  success: boolean;
  projectId?: string;
  error?: string;
}

export const useProjectCreation = () => {
  const [creating, setCreating] = useState(false);

  const validateProjectData = (projectData: ProjectData) => {
    if (!projectData.title || projectData.title.trim().length === 0) {
      throw new Error("Project title is required");
    }

    if (
      !projectData.shortDescription ||
      projectData.shortDescription.trim().length === 0
    ) {
      throw new Error("Short description is required");
    }

    // NEW - Validate longDescription
    if (
      !projectData.longDescription ||
      projectData.longDescription.trim().length === 0
    ) {
      throw new Error("Long description is required");
    }

    if (projectData.title.length > 100) {
      throw new Error("Project title must be less than 100 characters");
    }

    if (projectData.shortDescription.length > 500) {
      throw new Error("Short description must be less than 500 characters");
    }

    // Validate projectType is an array (can be empty for PayToView only)
    if (!Array.isArray(projectData.projectType)) {
      throw new Error("Project type must be an array");
    }

    // Validate each project type in the array
    const validTypes = ["product_sale", "dev_collaboration"];
    for (const type of projectData.projectType) {
      if (!validTypes.includes(type)) {
        throw new Error(
          `Invalid project type: ${type}. Must be one of: ${validTypes.join(
            ", "
          )}`
        );
      }
    }

    // Validate payToViewAmount - always required (can be 0 for free viewing)
    if (
      typeof projectData.payToViewAmount !== "number" ||
      projectData.payToViewAmount < 0
    ) {
      throw new Error("payToViewAmount must be a number >= 0");
    }

    // Validate project type specific pricing based on what's in the array
    if (projectData.projectType.includes("product_sale")) {
      if (
        !projectData.productSalePrice ||
        typeof projectData.productSalePrice !== "number" ||
        projectData.productSalePrice < 1
      ) {
        throw new Error(
          "Product sale price is required and must be at least 1 for product sale projects"
        );
      }
    } else {
      // If projectType does not include product_sale, productSalePrice should not be provided
      if (projectData.productSalePrice !== undefined) {
        throw new Error(
          "Product sale price should not be provided when project type does not include product sale"
        );
      }
    }

    if (projectData.projectType.includes("dev_collaboration")) {
      if (
        !projectData.creatorCollaborationBudget ||
        typeof projectData.creatorCollaborationBudget !== "number" ||
        projectData.creatorCollaborationBudget < 1
      ) {
        throw new Error(
          "Creator collaboration budget is required and must be at least 1 for collaboration projects"
        );
      }
    } else {
      // If projectType does not include dev_collaboration, creatorCollaborationBudget should not be provided
      if (projectData.creatorCollaborationBudget !== undefined) {
        throw new Error(
          "Creator collaboration budget should not be provided when project type does not include dev collaboration"
        );
      }
    }
  };

  const createProject = async (
    projectData: ProjectData
  ): Promise<ProjectCreationResult> => {
    setCreating(true);

    try {
      // Validate project data
      validateProjectData(projectData);

      // Check authentication
      const token = apiService.getAccessToken();
      if (!token) {
        throw new Error("No authentication token found. Please login first.");
      }

      // Prepare the request body according to new flat structure API documentation
      const requestBody: any = {
        title: projectData.title.trim(),
        shortDescription: projectData.shortDescription.trim(),
        longDescription: projectData.longDescription.trim(), // NEW - Required
        projectType: projectData.projectType, // Already an array
        repoFormat: projectData.repoFormat,
        status: projectData.status || "draft", // Default to draft if not specified
        payToViewAmount: projectData.payToViewAmount, // Required - always present
        ...(projectData.gameGenre && { gameGenre: projectData.gameGenre }),
        ...(projectData.targetPlatform && {
          targetPlatform: projectData.targetPlatform,
        }),
        ...(projectData.tags &&
          projectData.tags.length > 0 && { tags: projectData.tags }),
        ...(projectData.fileKeys && { fileKeys: projectData.fileKeys }),
        ...(projectData.fileUrls && { fileUrls: projectData.fileUrls }),
        ...(projectData.attachments && {
          attachments: projectData.attachments,
        }),
        ...(projectData.thumbnail && { thumbnail: projectData.thumbnail }),
        ...(projectData.appIcon && { appIcon: projectData.appIcon }), // NEW
        ...(projectData.previewCode && { previewCode: projectData.previewCode }), // NEW - previewCode from build
      };

      // Add flat pricing fields based on projectType
      if (projectData.projectType.includes("product_sale")) {
        requestBody.productSalePrice = projectData.productSalePrice;
      }
      if (projectData.projectType.includes("dev_collaboration")) {
        requestBody.creatorCollaborationBudget =
          projectData.creatorCollaborationBudget;
      }

      console.log("Creating project with data:", requestBody);

      // Use the new createGameProject method that matches API docs
      const result = await apiService.createGameProject(requestBody);
      console.log("Project created successfully:", result);

      return {
        success: true,
        projectId: result._id || result.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create project";
      console.error("Project creation error:", error);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setCreating(false);
    }
  };

  const updateProject = async (
    projectId: string,
    projectData: Partial<ProjectData>
  ): Promise<ProjectCreationResult> => {
    setCreating(true);

    try {
      const token = apiService.getAccessToken();
      if (!token) {
        throw new Error("No authentication token found. Please login first.");
      }

      const result = await apiService.updateGameProject(projectId, projectData);
      console.log("Project updated successfully:", result);

      return {
        success: true,
        projectId: result._id || result.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update project";
      console.error("Project update error:", error);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setCreating(false);
    }
  };

  return {
    createProject,
    updateProject,
    creating,
  };
};
