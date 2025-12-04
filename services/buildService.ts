import { apiService } from "./api";

export interface BuildRequest {
  zipFile: File;
  projectName?: string;
  projectType?: "react" | "webgl"; // Project type: 'react' or 'webgl'
}

export interface BuildResponse {
  success: boolean;
  previewUrl?: string;
  standaloneHtmlUrl?: string;
  buildId?: string;
  error?: string;
  progress?: {
    stage: string;
    percent: number;
  };
}

export interface BuildStatusResponse {
  status: "pending" | "building" | "completed" | "failed";
  progress?: {
    stage: string;
    percent: number;
  };
  previewUrl?: string;
  standaloneHtmlUrl?: string;
  error?: string;
}

class BuildService {
  /**
   * Upload ZIP file and start build process
   * This will:
   * 1. Extract ZIP
   * 2. Copy build-standalone.js to repo
   * 3. Install dependencies with npm
   * 4. Build with vite
   * 5. Run build-standalone.js
   * 6. Return preview URL for index-standalone.html
   */
  async buildProject(request: BuildRequest): Promise<BuildResponse> {
    try {
      // Step 1: Upload ZIP file and get fileKey
      const { fileKey, uploadUrl } = await apiService.getPresignedUrl({
        fileName: request.zipFile.name,
        fileType: "archive",
        contentType: "application/zip",
        fileSize: request.zipFile.size,
      });

      // Upload file to S3
      await fetch(uploadUrl, {
        method: "PUT",
        body: request.zipFile,
        headers: {
          "Content-Type": "application/zip",
        },
      });

      // Step 2: Start build process via API
      const buildResponse = await apiService.request<BuildResponse>(
        "/build/start",
        {
          method: "POST",
          body: JSON.stringify({
            fileKey,
            projectName: request.projectName || "prototype",
            projectType: request.projectType, // Optional: 'react' or 'webgl'
          }),
        }
      );

      return buildResponse;
    } catch (error) {
      console.error("Build service error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to start build process",
      };
    }
  }

  /**
   * Check build status
   */
  async getBuildStatus(buildId: string): Promise<BuildStatusResponse> {
    try {
      const response = await apiService.request<BuildStatusResponse>(
        `/build/status/${buildId}`,
        {
          method: "GET",
        }
      );
      return response;
    } catch (error) {
      console.error("Get build status error:", error);
      return {
        status: "failed",
        error:
          error instanceof Error ? error.message : "Failed to get build status",
      };
    }
  }

  /**
   * Poll build status until completion
   */
  async pollBuildStatus(
    buildId: string,
    onProgress?: (status: BuildStatusResponse) => void,
    interval: number = 2000,
    maxAttempts: number = 150 // 5 minutes max
  ): Promise<BuildStatusResponse> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getBuildStatus(buildId);
          onProgress?.(status);

          if (status.status === "completed") {
            resolve(status);
            return;
          }

          if (status.status === "failed") {
            // reject(new Error(status.error || "Build failed"));
            resolve(status);
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error("Build timeout: Maximum attempts reached"));
            return;
          }

          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Build project with progress tracking
   */
  async buildProjectWithProgress(
    request: BuildRequest,
    onProgress?: (progress: BuildStatusResponse) => void
  ): Promise<BuildStatusResponse> {
    // Start build
    const buildResponse = await this.buildProject(request);

    if (!buildResponse.success || !buildResponse.buildId) {
      throw new Error(buildResponse.error || "Failed to start build");
    }

    // Poll for status
    const finalStatus = await this.pollBuildStatus(
      buildResponse.buildId,
      onProgress
    );

    return finalStatus;
  }
}

export const buildService = new BuildService();
export default buildService;
