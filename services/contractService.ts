import { apiService } from "./api";

// Contract Management Service
export interface ContractMilestone {
  id: string;
  title: string;
  description: string;
  budget: number;
  dueDate: Date;
  deliverables: string[];
  paymentPercentage: number;
  isCompleted: boolean;
  completedAt?: Date;
  paymentStatus: "pending" | "paid" | "overdue";
}

export interface ContractSignature {
  userId: string;
  signatureData: string;
  ipAddress: string;
  userAgent: string;
  signedAt: Date;
}

export interface Contract {
  _id: string;
  collaborationId: string;
  publisherId: string;
  developerId: string;
  contractTitle: string;
  contractDescription: string;
  contractType:
    | "development"
    | "publishing"
    | "marketing"
    | "support"
    | "maintenance";
  status:
    | "draft"
    | "pending_signature"
    | "active"
    | "completed"
    | "terminated"
    | "expired";
  totalBudget: number;
  advancePayment: number;
  paymentSchedule:
    | "monthly"
    | "quarterly"
    | "milestone_based"
    | "upfront"
    | "completion";
  milestones: ContractMilestone[];
  termsAndConditions: string;
  contractStartDate: Date;
  contractEndDate: Date;
  signatures: ContractSignature[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractFilters {
  page?: number;
  limit?: number;
  status?: Contract["status"];
  contractType?: Contract["contractType"];
  collaborationId?: string;
  publisherId?: string;
  developerId?: string;
  search?: string;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "totalBudget"
    | "contractStartDate"
    | "contractEndDate";
  sortOrder?: "asc" | "desc";
}

export interface ContractResponse {
  contracts: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  pendingContracts: number;
  totalBudget: number;
  totalPaid: number;
  averageContractValue: number;
  contractsByType: Record<string, number>;
  contractsByStatus: Record<string, number>;
}

export interface CreateContractRequest {
  collaborationId: string;
  contractTitle: string;
  contractDescription: string;
  contractType: Contract["contractType"];
  totalBudget: number;
  advancePayment: number;
  paymentSchedule: Contract["paymentSchedule"];
  milestones: Omit<
    ContractMilestone,
    "id" | "isCompleted" | "completedAt" | "paymentStatus"
  >[];
  termsAndConditions: string;
  contractStartDate: string;
  contractEndDate: string;
}

export interface UpdateContractRequest {
  contractTitle?: string;
  contractDescription?: string;
  totalBudget?: number;
  advancePayment?: number;
  paymentSchedule?: Contract["paymentSchedule"];
  termsAndConditions?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

export interface SignContractRequest {
  signatureData: string;
  ipAddress: string;
  userAgent: string;
}

export interface UpdateMilestoneRequest {
  isCompleted?: boolean;
  progressPercentage?: number;
  completedAt?: string;
}

export interface MilestoneProgressResponse {
  milestones: ContractMilestone[];
  totalProgress: number;
  completedMilestones: number;
  totalMilestones: number;
  totalPaid: number;
  totalBudget: number;
}

class ContractService {
  // Contract CRUD Operations
  async createContract(contractData: CreateContractRequest): Promise<Contract> {
    return apiService["makeRequest"]("/contracts", {
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

    return apiService["makeRequest"](endpoint);
  }

  async getContractById(contractId: string): Promise<Contract> {
    return apiService["makeRequest"](`/contracts/${contractId}`);
  }

  async updateContract(
    contractId: string,
    updateData: UpdateContractRequest
  ): Promise<Contract> {
    return apiService["makeRequest"](`/contracts/${contractId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  async deleteContract(contractId: string): Promise<void> {
    return apiService["makeRequest"](`/contracts/${contractId}`, {
      method: "DELETE",
    });
  }

  // Contract Signing
  async signContract(
    contractId: string,
    signatureData: SignContractRequest
  ): Promise<Contract> {
    return apiService["makeRequest"](`/contracts/${contractId}/sign`, {
      method: "POST",
      body: JSON.stringify(signatureData),
    });
  }

  // Milestone Management
  async updateMilestone(
    contractId: string,
    milestoneId: string,
    updateData: UpdateMilestoneRequest
  ): Promise<ContractMilestone> {
    return apiService["makeRequest"](
      `/contracts/${contractId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        body: JSON.stringify(updateData),
      }
    );
  }

  async getMilestoneProgress(
    contractId: string
  ): Promise<MilestoneProgressResponse> {
    return apiService["makeRequest"](
      `/contracts/${contractId}/milestones/progress`
    );
  }

  // Contract Analytics
  async getContractStats(): Promise<ContractStats> {
    return apiService["makeRequest"]("/contracts/stats");
  }

  async getContractsByCollaboration(
    collaborationId: string
  ): Promise<Contract[]> {
    return apiService["makeRequest"](
      `/contracts/collaboration/${collaborationId}`
    );
  }

  async getContractsByUser(userId: string): Promise<Contract[]> {
    return apiService["makeRequest"](`/contracts/user/${userId}`);
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

    return apiService["makeRequest"](endpoint);
  }

  async getPublisherContractStats(): Promise<ContractStats> {
    return apiService["makeRequest"]("/contracts/publisher/stats");
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

    return apiService["makeRequest"](endpoint);
  }

  async getDeveloperContractStats(): Promise<ContractStats> {
    return apiService["makeRequest"]("/contracts/stats");
  }

  // Contract notifications and reminders
  async getContractNotifications(): Promise<any[]> {
    return apiService["makeRequest"]("/contracts/notifications");
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return apiService["makeRequest"](
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
    const API_BASE_URL =
      (window as any).__API_BASE_URL__ ||
      (import.meta as any).env?.VITE_API_BASE_URL ||
      "http://localhost:3000/api";
    const response = await fetch(
      `${API_BASE_URL}/contracts/${contractId}/export?format=${format}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiService.getAccessToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export contract");
    }

    return response.blob();
  }

  // Contract template management
  async getContractTemplates(): Promise<any[]> {
    return apiService["makeRequest"]("/contracts/templates");
  }

  async createContractFromTemplate(
    templateId: string,
    contractData: Partial<CreateContractRequest>
  ): Promise<Contract> {
    return apiService["makeRequest"](
      `/contracts/templates/${templateId}/create`,
      {
        method: "POST",
        body: JSON.stringify(contractData),
      }
    );
  }
}

// Create and export a singleton instance
export const contractService = new ContractService();
export default contractService;
