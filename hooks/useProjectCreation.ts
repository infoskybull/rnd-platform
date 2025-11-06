import { useState } from "react";
import { apiService } from "../services/api";

interface ProjectData {
  title: string;
  shortDescription: string;
  projectType: "idea_sale" | "product_sale" | "dev_collaboration";
  status?: "draft" | "published"; // Add status field
  ideaSaleData?: {
    description: string;
    askingPrice: number;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
  };
  productSaleData?: {
    description: string;
    codeFolderPath: string;
    askingPrice: number;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
  };
  devCollaborationData?: {
    description: string;
    proposal: string;
    budget: number;
    timeline: string;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
    skills?: string[];
  };
  fileKeys?: string[]; // S3 keys from presigned-url response
  fileUrls?: string[]; // Upload URLs from presigned-url response
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

    if (projectData.title.length > 100) {
      throw new Error("Project title must be less than 100 characters");
    }

    if (projectData.shortDescription.length > 500) {
      throw new Error("Short description must be less than 500 characters");
    }

    // Validate project type specific data
    switch (projectData.projectType) {
      case "idea_sale":
        if (!projectData.ideaSaleData) {
          throw new Error("Idea sale data is required");
        }
        if (
          !projectData.ideaSaleData.description ||
          projectData.ideaSaleData.description.trim().length === 0
        ) {
          throw new Error("Idea description is required");
        }
        if (projectData.ideaSaleData.askingPrice <= 0) {
          throw new Error("Asking price must be greater than 0");
        }
        break;

      case "product_sale":
        if (!projectData.productSaleData) {
          throw new Error("Product sale data is required");
        }
        if (
          !projectData.productSaleData.description ||
          projectData.productSaleData.description.trim().length === 0
        ) {
          throw new Error("Product description is required");
        }
        if (
          !projectData.productSaleData.codeFolderPath ||
          projectData.productSaleData.codeFolderPath.trim().length === 0
        ) {
          throw new Error("Code folder path is required");
        }
        if (projectData.productSaleData.askingPrice <= 0) {
          throw new Error("Asking price must be greater than 0");
        }
        break;

      case "dev_collaboration":
        if (!projectData.devCollaborationData) {
          throw new Error("Development collaboration data is required");
        }
        if (
          !projectData.devCollaborationData.description ||
          projectData.devCollaborationData.description.trim().length === 0
        ) {
          throw new Error("Collaboration description is required");
        }
        if (
          !projectData.devCollaborationData.proposal ||
          projectData.devCollaborationData.proposal.trim().length === 0
        ) {
          throw new Error("Collaboration proposal is required");
        }
        if (projectData.devCollaborationData.budget <= 0) {
          throw new Error("Budget must be greater than 0");
        }
        if (
          !projectData.devCollaborationData.timeline ||
          projectData.devCollaborationData.timeline.trim().length === 0
        ) {
          throw new Error("Timeline is required");
        }
        break;

      default:
        throw new Error("Invalid project type");
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

      // Prepare the request body
      const requestBody = {
        title: projectData.title.trim(),
        shortDescription: projectData.shortDescription.trim(),
        projectType: projectData.projectType,
        status: projectData.status || "draft", // Default to draft if not specified
        ...(projectData.ideaSaleData && {
          ideaSaleData: projectData.ideaSaleData,
        }),
        ...(projectData.productSaleData && {
          productSaleData: projectData.productSaleData,
        }),
        ...(projectData.devCollaborationData && {
          devCollaborationData: projectData.devCollaborationData,
        }),
        ...(projectData.fileKeys && { fileKeys: projectData.fileKeys }),
        ...(projectData.fileUrls && { fileUrls: projectData.fileUrls }),
        ...(projectData.attachments && {
          attachments: projectData.attachments,
        }),
        ...(projectData.thumbnail && { thumbnail: projectData.thumbnail }),
      };

      console.log("Creating project with data:", requestBody);

      const result = await apiService.createProjectWithFiles(requestBody);
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
