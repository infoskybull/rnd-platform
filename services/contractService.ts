import { apiService } from "./api";
import type {
  Contract,
  ContractMilestone,
  ContractSignature,
  ContractFilters,
  ContractResponse,
  ContractStats,
  CreateContractRequest,
  UpdateContractRequest,
  SignContractRequest,
  UpdateMilestoneRequest,
  MilestoneProgressResponse,
} from "../types";

// Re-export types for backward compatibility
export type {
  Contract,
  ContractMilestone,
  ContractSignature,
  ContractFilters,
  ContractResponse,
  ContractStats,
  CreateContractRequest,
  UpdateContractRequest,
  SignContractRequest,
  UpdateMilestoneRequest,
  MilestoneProgressResponse,
};

class ContractService {
  // Contract CRUD Operations
  async createContract(contractData: CreateContractRequest): Promise<Contract> {
    return apiService.request("/contracts", {
      method: "POST",
      body: JSON.stringify(contractData),
    });
  }

  async getContracts(filters: ContractFilters = {}): Promise<ContractResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/contracts${queryString ? `?${queryString}` : ""}`;

    return apiService.request(endpoint);
  }

  async getContractById(contractId: string): Promise<Contract> {
    const response = await apiService.request<{
      success: boolean;
      data: Contract;
    }>(`/contracts/${contractId}`);

    // Handle both response formats: {success, data} or direct Contract
    const contract: Contract = (response.data || response) as Contract;

    // Normalize field names for backward compatibility
    if ((contract as Contract).creatorId && !contract.creatorId) {
      contract.creatorId = contract.creatorId;
    }
    if (contract.creatorId && !contract.creatorId) {
      contract.creatorId = contract.creatorId;
    }

    return contract;
  }

  async updateContract(
    contractId: string,
    updateData: UpdateContractRequest
  ): Promise<Contract> {
    return apiService.request(`/contracts/${contractId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  async deleteContract(contractId: string): Promise<void> {
    return apiService.request(`/contracts/${contractId}`, {
      method: "DELETE",
    });
  }

  // Contract Signing
  async signContract(
    contractId: string,
    signatureData: SignContractRequest
  ): Promise<Contract> {
    const response = await apiService.request<{
      success: boolean;
      data: Contract;
    }>(`/contracts/${contractId}/sign`, {
      method: "POST",
      body: JSON.stringify(signatureData),
    });

    // Handle both response formats: {success, data} or direct Contract
    return (response.data || response) as Contract;
  }

  // Milestone Management
  async updateMilestone(
    contractId: string,
    milestoneId: string,
    updateData: UpdateMilestoneRequest
  ): Promise<Contract> {
    const response = await apiService.request<{
      success: boolean;
      data: Contract;
    }>(`/contracts/${contractId}/milestones/${milestoneId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });

    // Handle both response formats: {success, data} or direct Contract
    return (response.data || response) as Contract;
  }

  async getMilestoneProgress(
    contractId: string
  ): Promise<MilestoneProgressResponse> {
    const response = await apiService.request<{
      success: boolean;
      data: MilestoneProgressResponse;
    }>(`/contracts/${contractId}/milestones/progress`);

    // Handle both response formats: {success, data} or direct MilestoneProgressResponse
    const progressData: MilestoneProgressResponse = (response.data ||
      response) as MilestoneProgressResponse;

    // Normalize response to ensure backward compatibility
    const normalized: MilestoneProgressResponse = {
      contractId: progressData.contractId || contractId,
      totalMilestones:
        progressData.totalMilestones || progressData.milestones?.length || 0,
      completedMilestones: progressData.completedMilestones || 0,
      progressPercentage:
        progressData.progressPercentage || progressData.totalProgress || 0,
      upcomingMilestones: progressData.upcomingMilestones || [],
      overdueMilestones: progressData.overdueMilestones || [],
      totalBudget: progressData.totalBudget || 0,
      paidAmount: progressData.paidAmount || progressData.totalPaid || 0,
      pendingAmount: progressData.pendingAmount || 0,
      // Legacy fields
      milestones: progressData.milestones,
      totalProgress:
        progressData.progressPercentage || progressData.totalProgress,
      totalPaid: progressData.paidAmount || progressData.totalPaid,
    };

    return normalized;
  }

  // Contract Analytics
  async getContractStats(): Promise<ContractStats> {
    return apiService.request("/contracts/stats");
  }

  async getContractsByCollaboration(
    collaborationId: string
  ): Promise<Contract[]> {
    return apiService.request(`/contracts/collaboration/${collaborationId}`);
  }

  async getContractsByUser(userId: string): Promise<Contract[]> {
    return apiService.request(`/contracts/user/${userId}`);
  }

  // Publisher-specific contract endpoints
  async getPublisherContracts(
    filters: ContractFilters = {}
  ): Promise<ContractResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/contracts/publisher/my-contracts${
      queryString ? `?${queryString}` : ""
    }`;

    return apiService.request(endpoint);
  }

  async getPublisherContractStats(): Promise<ContractStats> {
    return apiService.request("/contracts/stats");
  }

  // Creator-specific contract endpoints
  async getDeveloperContracts(
    filters: ContractFilters = {}
  ): Promise<ContractResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/contracts/creator/my-contracts${
      queryString ? `?${queryString}` : ""
    }`;

    return apiService.request(endpoint);
  }

  async getDeveloperContractStats(): Promise<ContractStats> {
    return apiService.request("/contracts/stats");
  }

  // Contract notifications and reminders
  async getContractNotifications(): Promise<any[]> {
    return apiService.request("/contracts/notifications");
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return apiService.request(
      `/contracts/notifications/${notificationId}/read`,
      {
        method: "POST",
      }
    );
  }

  // Contract export functionality
  async exportContract(
    contractId: string,
    format: "pdf" | "json" = "pdf"
  ): Promise<Blob> {
    // For blob responses, we need to use fetch directly but with apiService to handle refreshToken
    // First, try to get fresh token if needed by making a lightweight request
    try {
      // Use apiService to ensure token is refreshed if needed
      // For blob responses, we'll need to use fetch but ensure token is fresh first
      const API_BASE_URL =
        (import.meta as any).env?.VITE_API_BASE_URL ||
        "http://localhost:8080/api";

      // Ensure we have a fresh token by making a request through apiService first
      // This will trigger refresh if needed
      await apiService
        .request(`/contracts/${contractId}`, { method: "HEAD" })
        .catch(() => {
          // Ignore HEAD request errors, just ensure token is fresh
        });

      const token = apiService.getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/contracts/${contractId}/export?format=${format}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // If it's a 401/403, apiService.request would have handled refresh
        // But for blob, we need to retry manually
        if (response.status === 401 || response.status === 403) {
          // Token might have been refreshed, try again
          const newToken = apiService.getAccessToken();
          const retryResponse = await fetch(
            `${API_BASE_URL}/contracts/${contractId}/export?format=${format}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            }
          );
          if (retryResponse.ok) {
            return retryResponse.blob();
          }
        }
        throw new Error("Failed to export contract");
      }

      return response.blob();
    } catch (error) {
      console.error("Error exporting contract:", error);
      throw error;
    }
  }

  // Contract template management
  async getContractTemplates(): Promise<any[]> {
    return apiService.request("/contracts/templates");
  }

  async createContractFromTemplate(
    templateId: string,
    contractData: Partial<CreateContractRequest>
  ): Promise<Contract> {
    return apiService.request(`/contracts/templates/${templateId}/create`, {
      method: "POST",
      body: JSON.stringify(contractData),
    });
  }
}

// Create and export a singleton instance
export const contractService = new ContractService();
export default contractService;
