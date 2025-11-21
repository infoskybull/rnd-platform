import { useState } from "react";
import { apiService } from "../services/api";

interface ProjectData {
  title: string;
  shortDescription: string;
  projectType: ("product_sale" | "dev_collaboration")[]; // Always an array
  repoFormat: "react" | "webgl" | "html"; // Required per API docs
  status?: "draft" | "published";
  payToViewAmount: number; // Required - giá trị từ select package để creator set
  productSaleData?: {
    screenshots?: string[];
    demoUrl?: string;
    askingPrice: number;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
    techStack?: string;
    isPlayable?: boolean;
  };
  creatorCollaborationData?: {
    proposal: string;
    budget: number;
    timeline: string;
    prototypeImages?: string[];
    videoUrl?: string;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
    skills?: string[];
  };
  searchKeywords?: string[]; // Added per API docs
  fileKeys?: string[]; // S3 keys from presigned-url response
  fileUrls?: string[]; // Upload URLs from presigned-url response
  attachments?: string[];
  thumbnail?: string;
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

    // Validate projectType is an array and not empty
    if (
      !Array.isArray(projectData.projectType) ||
      projectData.projectType.length === 0
    ) {
      throw new Error("Project type must be a non-empty array");
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

    // Validate payToViewAmount
    if (
      typeof projectData.payToViewAmount !== "number" ||
      projectData.payToViewAmount < 0
    ) {
      throw new Error("payToViewAmount must be a number >= 0");
    }

    // Validate project type specific data based on what's in the array
    if (projectData.projectType.includes("product_sale")) {
      if (!projectData.productSaleData) {
        throw new Error(
          "Product sale data is required when projectType includes 'product_sale'"
        );
      }
      if (projectData.productSaleData.askingPrice <= 0) {
        throw new Error("Asking price must be greater than 0");
      }
    }

    if (projectData.projectType.includes("dev_collaboration")) {
      if (!projectData.creatorCollaborationData) {
        throw new Error(
          "Development collaboration data is required when projectType includes 'dev_collaboration'"
        );
      }
      if (
        !projectData.creatorCollaborationData.proposal ||
        projectData.creatorCollaborationData.proposal.trim().length === 0
      ) {
        throw new Error("Collaboration proposal is required");
      }
      if (projectData.creatorCollaborationData.budget <= 0) {
        throw new Error("Budget must be greater than 0");
      }
      if (
        !projectData.creatorCollaborationData.timeline ||
        projectData.creatorCollaborationData.timeline.trim().length === 0
      ) {
        throw new Error("Timeline is required");
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

      // Prepare the request body according to API documentation
      const requestBody = {
        title: projectData.title.trim(),
        shortDescription: projectData.shortDescription.trim(),
        projectType: projectData.projectType, // Already an array
        repoFormat: projectData.repoFormat,
        status: projectData.status || "draft", // Default to draft if not specified
        payToViewAmount: projectData.payToViewAmount, // Required - giá trị từ select package
        ...(projectData.productSaleData && {
          productSaleData: {
            ...projectData.productSaleData,
          },
        }),
        ...(projectData.creatorCollaborationData && {
          creatorCollaborationData: projectData.creatorCollaborationData,
        }),
        ...(projectData.searchKeywords && {
          searchKeywords: projectData.searchKeywords,
        }),
        ...(projectData.fileKeys && { fileKeys: projectData.fileKeys }),
        ...(projectData.fileUrls && { fileUrls: projectData.fileUrls }),
        ...(projectData.attachments && {
          attachments: projectData.attachments,
        }),
        ...(projectData.thumbnail && { thumbnail: projectData.thumbnail }),
      };

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
