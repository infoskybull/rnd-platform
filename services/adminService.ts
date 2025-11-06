import { apiService } from "./api";

const API_BASE_URL =
  (window as any).__API_BASE_URL__ ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "http://localhost:3000/api";

// Admin API Types
export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "creator" | "publisher" | "admin";
  isActive: boolean;
  isKYCVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersFilters {
  role?: "creator" | "publisher";
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminUserStats {
  totalUsers: number;
  totalCreators: number;
  totalPublishers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByProvider: Array<{
    provider: string;
    count: number;
  }>;
  recentRegistrations: Array<{
    date: string;
    count: number;
  }>;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: "creator" | "publisher";
  isActive?: boolean;
}

export interface AdminAnalyticsFilters {
  dateFrom?: string; // ISO 8601 format
  dateTo?: string; // ISO 8601 format
  period?: "6months" | "12months" | "24months";
  projectType?: "IDEA_SALE" | "PRODUCT_SALE" | "DEV_COLLABORATION";
}

export interface SystemOverview {
  totalProjects: number;
  totalUsers: number;
  totalCollaborations: number;
  totalRevenue: number;
  activeProjects: number;
  activeCollaborations: number;
  activeUsers: number;
  lastUpdated: string;
}

export interface ProjectsStats {
  totalProjects: number;
  projectsByStatus: Array<{
    status: string;
    count: number;
  }>;
  projectsByType: Array<{
    projectType: string;
    count: number;
  }>;
  averageProjectValue: number;
  totalViews: number;
  totalLikes: number;
  averageRating: number;
  projectsTrends: Array<{
    period: string;
    count: number;
  }>;
  lastUpdated: string;
}

export interface CollaborationsStats {
  totalCollaborations: number;
  collaborationsByStatus: Array<{
    status: string;
    count: number;
    totalValue: number;
  }>;
  totalCollaborationValue: number;
  averageCollaborationValue: number;
  averageCollaborationDuration: number;
  collaborationSuccessRate: number;
  collaborationsTrends: Array<{
    period: string;
    count: number;
    totalValue: number;
  }>;
  lastUpdated: string;
}

export interface AdminUsersStats {
  totalUsers: number;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  activeUsers: number;
  inactiveUsers: number;
  usersByProvider: Array<{
    provider: string;
    count: number;
  }>;
  newUsersTrends: Array<{
    period: string;
    count: number;
  }>;
  lastUpdated: string;
}

export interface RevenueStats {
  totalRevenue: number;
  revenueByType: Array<{
    projectType: string;
    totalRevenue: number;
    count: number;
  }>;
  averageTransactionValue: number;
  revenueTrends: Array<{
    period: string;
    revenue: number;
    count: number;
  }>;
  topEarningCreators: Array<{
    creatorId: string;
    creatorName: string;
    creatorEmail: string;
    totalEarnings: number;
    projectCount: number;
  }>;
  topSpendingPublishers: Array<{
    publisherId: string;
    publisherName: string;
    publisherEmail: string;
    totalSpent: number;
    projectCount: number;
  }>;
  lastUpdated: string;
}

export interface AdminDashboardData {
  systemOverview: SystemOverview;
  projectsStats: ProjectsStats;
  collaborationsStats: CollaborationsStats;
  usersStats: AdminUsersStats;
  revenueStats: RevenueStats;
  lastUpdated: string;
}

class AdminService {
  private buildQueryParams(filters: Record<string, any> = {}): string {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = apiService.getAccessToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          // Ignore JSON parse errors
        }

        throw new Error(errorMessage);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  // ========== USER MANAGEMENT ==========

  /**
   * Lấy danh sách users với filter và pagination
   */
  async getUsers(filters: AdminUsersFilters = {}): Promise<AdminUsersResponse> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/admin/users${queryParams ? `?${queryParams}` : ""}`;
    return this.makeRequest<AdminUsersResponse>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Lấy thống kê users
   */
  async getUserStats(): Promise<{ success: boolean; data: AdminUserStats }> {
    return this.makeRequest<{ success: boolean; data: AdminUserStats }>(
      "/admin/users/stats",
      {
        method: "GET",
      }
    );
  }

  /**
   * Lấy thông tin user theo ID
   */
  async getUserById(
    userId: string
  ): Promise<{ success: boolean; data: AdminUser }> {
    return this.makeRequest<{ success: boolean; data: AdminUser }>(
      `/admin/users/${userId}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Cập nhật user
   */
  async updateUser(
    userId: string,
    data: UpdateUserData
  ): Promise<{ success: boolean; message: string; data: AdminUser }> {
    return this.makeRequest<{
      success: boolean;
      message: string;
      data: AdminUser;
    }>(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Xóa user
   */
  async deleteUser(userId: string): Promise<void> {
    await this.makeRequest<void>(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  }

  // ========== ANALYTICS ==========

  /**
   * Lấy admin dashboard với tất cả thống kê
   */
  async getAdminDashboard(
    filters: AdminAnalyticsFilters = {}
  ): Promise<{ success: boolean; data?: AdminDashboardData }> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/analytics/admin/dashboard${
      queryParams ? `?${queryParams}` : ""
    }`;
    return this.makeRequest<{ success: boolean; data?: AdminDashboardData }>(
      endpoint,
      {
        method: "GET",
      }
    );
  }

  /**
   * Lấy system overview
   */
  async getSystemOverview(
    filters: AdminAnalyticsFilters = {}
  ): Promise<{ success: boolean; data?: SystemOverview }> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/analytics/admin/system-overview${
      queryParams ? `?${queryParams}` : ""
    }`;
    return this.makeRequest<{ success: boolean; data?: SystemOverview }>(
      endpoint,
      {
        method: "GET",
      }
    );
  }

  /**
   * Lấy thống kê projects
   */
  async getProjectsStats(
    filters: AdminAnalyticsFilters = {}
  ): Promise<{ success: boolean; data?: ProjectsStats }> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/analytics/admin/projects-stats${
      queryParams ? `?${queryParams}` : ""
    }`;
    return this.makeRequest<{ success: boolean; data?: ProjectsStats }>(
      endpoint,
      {
        method: "GET",
      }
    );
  }

  /**
   * Lấy thống kê collaborations
   */
  async getCollaborationsStats(
    filters: AdminAnalyticsFilters = {}
  ): Promise<{ success: boolean; data?: CollaborationsStats }> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/analytics/admin/collaborations-stats${
      queryParams ? `?${queryParams}` : ""
    }`;
    return this.makeRequest<{ success: boolean; data?: CollaborationsStats }>(
      endpoint,
      {
        method: "GET",
      }
    );
  }

  /**
   * Lấy thống kê users
   */
  async getUsersStats(
    filters: AdminAnalyticsFilters = {}
  ): Promise<{ success: boolean; data?: AdminUsersStats }> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/analytics/admin/users-stats${
      queryParams ? `?${queryParams}` : ""
    }`;
    return this.makeRequest<{ success: boolean; data?: AdminUsersStats }>(
      endpoint,
      {
        method: "GET",
      }
    );
  }

  /**
   * Lấy thống kê revenue
   */
  async getRevenueStats(
    filters: AdminAnalyticsFilters = {}
  ): Promise<{ success: boolean; data?: RevenueStats }> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/analytics/admin/revenue-stats${
      queryParams ? `?${queryParams}` : ""
    }`;
    return this.makeRequest<{ success: boolean; data?: RevenueStats }>(
      endpoint,
      {
        method: "GET",
      }
    );
  }
}

// Create and export a singleton instance
export const adminService = new AdminService();
export default adminService;
