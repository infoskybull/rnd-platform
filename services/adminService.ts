import { apiService } from "./api";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3000/api";

// Admin API Types
export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "creator" | "publisher" | "admin";
  isActive: boolean;
  // Optional fields depending on backend response
  isKYCVerified?: boolean;
  is2FAEnabled?: boolean;
  authProviders?: string[];
  lastLoginAt?: string;
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

// ===== Reports Types =====
export type ReportType = "user" | "message" | "project";
export type ReportStatus = "open" | "in_review" | "resolved" | "dismissed";
export type ReportPriority = "low" | "medium" | "high";

export interface AdminReport {
  _id: string;
  type: ReportType;
  status: ReportStatus;
  reportedByUserId: string;
  reportedByRole: "creator" | "publisher";
  targetUserId?: string | null;
  collaborationId?: string | null;
  messageId?: string | null;
  projectId?: string | null;
  reason: string;
  attachments: string[];
  adminNotes?: string | null;
  priority?: ReportPriority | null;
  assignedAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReportsFilters {
  status?: ReportStatus;
  type?: ReportType;
  reportedByRole?: "creator" | "publisher";
  reportedByUserId?: string;
  collaborationId?: string;
  projectId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminReportsResponse {
  success: boolean;
  data: AdminReport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ========== ADMIN SUPPORT CHAT TYPES ==========
export interface AdminChat {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    role: string;
  };
  admin: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  status: "pending" | "active" | "resolved" | "closed";
  lastMessage: {
    content: string;
    messageType: string;
    senderRole: string;
    senderId: string;
    createdAt: string;
  } | null;
  lastMessageAt: string | null;
  unreadCountByAdmin: number;
  unreadCountByUser: number;
  resolvedAt: string | null;
  resolvedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminChatsFilters {
  status?: "pending" | "active" | "resolved" | "closed";
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "lastMessageAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface AdminChatsResponse {
  success: boolean;
  data: {
    chats: AdminChat[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
    // Use apiService.request instead of fetch to ensure refreshToken is handled automatically
    return apiService.request<T>(endpoint, options);
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

  // ========== REPORTS (ADMIN) ==========

  async getReports(
    filters: AdminReportsFilters = {}
  ): Promise<AdminReportsResponse> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/admin/reports${queryParams ? `?${queryParams}` : ""}`;
    return this.makeRequest<AdminReportsResponse>(endpoint, { method: "GET" });
  }

  async getReportById(
    reportId: string
  ): Promise<{ success: boolean; data: AdminReport }> {
    return this.makeRequest<{ success: boolean; data: AdminReport }>(
      `/admin/reports/${reportId}`,
      { method: "GET" }
    );
  }

  async updateReport(
    reportId: string,
    data: Partial<
      Pick<
        AdminReport,
        "status" | "adminNotes" | "assignedAdminId" | "priority"
      >
    >
  ): Promise<{ success: boolean; message: string; data: AdminReport }> {
    return this.makeRequest<{
      success: boolean;
      message: string;
      data: AdminReport;
    }>(`/admin/reports/${reportId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteReport(reportId: string): Promise<void> {
    await this.makeRequest<void>(`/admin/reports/${reportId}`, {
      method: "DELETE",
    });
  }

  // ========== ADMIN SUPPORT CHAT ==========

  /**
   * Get list of all admin support chats (for Admin)
   * GET /api/admin/support/chats
   * Supports filtering, searching, pagination, and sorting
   */
  async getAllAdminSupportChats(
    filters: AdminChatsFilters = {}
  ): Promise<AdminChatsResponse> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/admin/support/chats${
      queryParams ? `?${queryParams}` : ""
    }`;
    return this.makeRequest<AdminChatsResponse>(endpoint, {
      method: "GET",
    });
  }

  /**
   * Get list of admin support chats (for Admin) - Legacy method
   * @deprecated Use getAllAdminSupportChats instead
   */
  async getAdminSupportChats(
    publisherId?: string
  ): Promise<{ success: boolean; data: any[] }> {
    const queryParams = publisherId ? `?publisherId=${publisherId}` : "";
    return this.makeRequest<{ success: boolean; data: any[] }>(
      `/admin/support/chats${queryParams}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get messages for a specific admin support chat
   * GET /api/admin/support/chats/:adminChatId/messages
   */
  async getAdminSupportMessages(
    adminChatId: string
  ): Promise<{ success: boolean; data: any[] }> {
    return this.makeRequest<{ success: boolean; data: any[] }>(
      `/admin/support/chats/${adminChatId}/messages`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Send message via REST API
   * POST /api/admin/support/chats/:adminChatId/messages
   */
  async sendAdminSupportMessage(
    adminChatId: string,
    payload: {
      content: string;
      type?: "text" | "file" | "system";
      attachments?: string[];
      replyTo?: string;
    }
  ): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>(
      `/admin/support/chats/${adminChatId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }
}

// Create and export a singleton instance
export const adminService = new AdminService();
export default adminService;
