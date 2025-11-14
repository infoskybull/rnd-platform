import { apiService } from "./api";

// Analytics API Types - Updated to match API documentation
export interface AnalyticsFilters {
  dateFrom?: string; // ISO 8601 format
  dateTo?: string; // ISO 8601 format
  projectType?: "IDEA_SALE" | "PRODUCT_SALE" | "DEV_COLLABORATION";
  period?: "6months" | "12months" | "24months";
  page?: number;
  limit?: number;
}

export interface AnalyticsOverview {
  totalPurchases: number;
  totalSpent: number;
  activeCollaborations: number;
  completedContracts: number;
  recentPurchases: Array<{
    id: string;
    projectTitle: string;
    amount: number;
    purchaseDate: string;
  }>;
  spendingThisMonth: number;
  lastUpdated: string;
}

export interface PurchaseAnalytics {
  totalPurchases: number;
  totalSpent: number;
  averagePurchaseValue: number;
  topPurchasedCategories: Array<{
    category: string;
    count: number;
    totalSpent: number;
  }>;
  purchaseTrends: Array<{
    period: string;
    count: number;
    totalSpent: number;
  }>;
  lastUpdated: string;
}

export interface SpendingAnalytics {
  totalSpent: number;
  spendingThisMonth: number;
  spendingLastMonth: number;
  monthlyGrowth: number;
  averageMonthlySpending: number;
  spendingByCategory: Array<{
    category: string;
    totalSpent: number;
    count: number;
  }>;
  spendingTrends: Array<{
    period: string;
    count: number;
    totalSpent: number;
  }>;
  lastUpdated: string;
}

export interface CollaborationAnalytics {
  activeCollaborations: number;
  completedContracts: number;
  totalCollaborationValue: number;
  averageCollaborationDuration: number;
  collaborationSuccessRate: number;
  collaborationTrends: Array<{
    period: string;
    count: number;
    totalValue: number;
  }>;
  lastUpdated: string;
}

export interface PurchaseActivity {
  activities: Array<{
    id: string;
    projectTitle: string;
    projectType: string;
    amount: number;
    seller: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
    buyer: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
    purchaseDate: string;
    status: string;
    thumbnail?: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  lastUpdated: string;
}

export interface SpendingTrends {
  period: string;
  trends: Array<{
    period: string;
    spending: number;
    growth: number; // Phần trăm tăng trưởng
  }>;
  lastUpdated: Date | string;
}

// Publisher-specific analytics interfaces
export interface PublisherBudgetAnalytics {
  totalBudgetAllocated: number;
  totalBudgetSpent: number;
  remainingBudget: number;
  budgetUtilizationRate: number;
  averageProjectBudget: number;
  budgetByProjectType: Array<{
    projectType: string;
    totalBudget: number;
    spentBudget: number;
    projectCount: number;
  }>;
  monthlyBudgetTrends: Array<{
    period: string;
    allocated: number;
    spent: number;
    remaining: number;
  }>;
  lastUpdated: string;
}

export interface PublisherCollaborationPerformance {
  totalCollaborations: number;
  activeCollaborations: number;
  completedCollaborations: number;
  cancelledCollaborations: number;
  averageCollaborationDuration: number;
  collaborationSuccessRate: number;
  averageProjectRating: number;
  topPerformingDevelopers: Array<{
    creatorId: string;
    developerName: string;
    completedProjects: number;
    averageRating: number;
    totalBudget: number;
  }>;
  collaborationTimeline: Array<{
    period: string;
    started: number;
    completed: number;
    cancelled: number;
  }>;
  lastUpdated: string;
}

export interface PublisherProjectAnalytics {
  totalProjectsPurchased: number;
  totalProjectsInDevelopment: number;
  totalProjectsCompleted: number;
  averageProjectValue: number;
  totalProjectInvestment: number;
  projectsByStatus: Array<{
    status: string;
    count: number;
    totalValue: number;
  }>;
  projectsByType: Array<{
    projectType: string;
    count: number;
    totalValue: number;
    averageValue: number;
  }>;
  projectCompletionRates: Array<{
    projectType: string;
    completionRate: number;
    averageDuration: number;
  }>;
  lastUpdated: string;
}

export interface PublisherROIAnalytics {
  totalInvestment: number;
  totalRevenue: number;
  netROI: number;
  averageROI: number;
  roiByProjectType: Array<{
    projectType: string;
    investment: number;
    revenue: number;
    roi: number;
  }>;
  roiTrends: Array<{
    period: string;
    investment: number;
    revenue: number;
    roi: number;
  }>;
  lastUpdated: string;
}

export interface PublisherPaymentAnalytics {
  totalPaymentsMade: number;
  totalAmountPaid: number;
  averagePaymentAmount: number;
  paymentsByStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    totalAmount: number;
  }>;
  paymentTimeline: Array<{
    period: string;
    count: number;
    totalAmount: number;
  }>;
  pendingPayments: number;
  overduePayments: number;
  lastUpdated: string;
}

export interface PublisherDashboard {
  overview: AnalyticsOverview;
  purchaseAnalytics: PurchaseAnalytics;
  spendingAnalytics: SpendingAnalytics;
  collaborationAnalytics: CollaborationAnalytics;
}

// Creator-specific analytics interfaces
export interface DeveloperCollaborationProjects {
  totalProjects: number;
  projects: Array<{
    collaborationId: string;
    projectId: string;
    projectTitle: string;
    projectType: string;
    projectStatus: string;
    publisherName: string;
    publisherEmail: string;
    budget: number;
    status: string;
    startDate: string;
    endDate: string;
    createdAt: string;
  }>;
}

export interface DeveloperCollaborationDetails {
  totalCollaborations: number;
  activeCollaborations: number;
  completedCollaborations: number;
  totalEarnings: number;
  averageProjectValue: number;
  topPublishers: Array<{
    publisherId: string;
    publisherName: string;
    publisherEmail: string;
    collaborationCount: number;
    totalBudget: number;
    completedProjects: number;
  }>;
  successRate: number;
}

export interface DeveloperDashboard {
  overview: AnalyticsOverview;
  purchaseAnalytics: PurchaseAnalytics;
  spendingAnalytics: SpendingAnalytics;
  collaborationAnalytics: CollaborationAnalytics;
}

class AnalyticsService {
  private baseUrl = "/api/analytics";

  private buildQueryParams(filters: AnalyticsFilters = {}): string {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  }

  // Get complete analytics overview
  async getOverview(
    filters: AnalyticsFilters = {}
  ): Promise<AnalyticsOverview> {
    return apiService.getAnalyticsOverview(filters);
  }

  // Get purchase analytics
  async getPurchaseAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<PurchaseAnalytics> {
    return apiService.getPurchaseAnalytics(filters);
  }

  // Get spending analytics
  async getSpendingAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<SpendingAnalytics> {
    return apiService.getSpendingAnalytics(filters);
  }

  // Get collaboration analytics
  async getCollaborationAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<CollaborationAnalytics> {
    return apiService.getCollaborationAnalytics(filters);
  }

  // Get recent purchase activity
  async getPurchaseActivity(
    filters: AnalyticsFilters = {}
  ): Promise<PurchaseActivity> {
    return apiService.getPurchaseActivity(filters);
  }

  // Get spending trends over time
  async getSpendingTrends(
    filters: AnalyticsFilters = {}
  ): Promise<SpendingTrends> {
    return apiService.getSpendingTrends(filters);
  }

  // Get publisher-specific dashboard
  async getPublisherDashboard(
    filters: AnalyticsFilters = {}
  ): Promise<PublisherDashboard> {
    return apiService.getPublisherDashboard(filters);
  }

  // Get creator-specific dashboard
  async getDeveloperDashboard(
    filters: AnalyticsFilters = {}
  ): Promise<DeveloperDashboard> {
    return apiService.getDeveloperDashboard(filters);
  }

  // Publisher-specific analytics methods
  async getPublisherBudgetAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<PublisherBudgetAnalytics> {
    return apiService.getPublisherBudgetAnalytics(
      filters
    ) as Promise<PublisherBudgetAnalytics>;
  }

  async getPublisherCollaborationPerformance(
    filters: AnalyticsFilters = {}
  ): Promise<PublisherCollaborationPerformance> {
    return apiService.getPublisherCollaborationPerformance(
      filters
    ) as Promise<PublisherCollaborationPerformance>;
  }

  async getPublisherProjectAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<PublisherProjectAnalytics> {
    return apiService.getPublisherProjectAnalytics(
      filters
    ) as Promise<PublisherProjectAnalytics>;
  }

  async getPublisherROIAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<PublisherROIAnalytics> {
    return apiService.getPublisherROIAnalytics(
      filters
    ) as Promise<PublisherROIAnalytics>;
  }

  async getPublisherPaymentAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<PublisherPaymentAnalytics> {
    return apiService.getPublisherPaymentAnalytics(
      filters
    ) as Promise<PublisherPaymentAnalytics>;
  }

  async getPublisherExtendedDashboard(filters: AnalyticsFilters = {}): Promise<{
    overview: AnalyticsOverview;
    budgetAnalytics: PublisherBudgetAnalytics;
    collaborationPerformance: PublisherCollaborationPerformance;
    projectAnalytics: PublisherProjectAnalytics;
    roiAnalytics: PublisherROIAnalytics;
    paymentAnalytics: PublisherPaymentAnalytics;
  }> {
    return apiService.getPublisherExtendedDashboard(filters) as Promise<{
      overview: AnalyticsOverview;
      budgetAnalytics: PublisherBudgetAnalytics;
      collaborationPerformance: PublisherCollaborationPerformance;
      projectAnalytics: PublisherProjectAnalytics;
      roiAnalytics: PublisherROIAnalytics;
      paymentAnalytics: PublisherPaymentAnalytics;
    }>;
  }

  // Creator-specific analytics methods
  async getDeveloperCollaborationProjects(
    filters: AnalyticsFilters = {}
  ): Promise<DeveloperCollaborationProjects> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/analytics/creator/collaboration-projects${
      queryParams ? `?${queryParams}` : ""
    }`;
    return this.makeRequest<DeveloperCollaborationProjects>(endpoint);
  }

  async getDeveloperCollaborationDetails(
    filters: AnalyticsFilters = {}
  ): Promise<DeveloperCollaborationDetails> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = `/analytics/creator/collaboration-details${
      queryParams ? `?${queryParams}` : ""
    }`;
    return this.makeRequest<DeveloperCollaborationDetails>(endpoint);
  }

  // Private method to make requests
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Helper method to get role-specific dashboard
  async getRoleDashboard(
    userRole: "publisher" | "creator",
    filters: AnalyticsFilters = {}
  ): Promise<PublisherDashboard | DeveloperDashboard> {
    if (userRole === "publisher") {
      return this.getPublisherDashboard(filters);
    } else {
      return this.getDeveloperDashboard(filters);
    }
  }

  // Helper method to get default filters for common periods
  getDefaultFilters(
    period: "6months" | "12months" | "24months" = "12months"
  ): AnalyticsFilters {
    const now = new Date();
    const monthsAgo =
      period === "6months" ? 6 : period === "12months" ? 12 : 24;
    const dateFrom = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

    return {
      period,
      dateFrom: dateFrom.toISOString().split("T")[0],
      dateTo: now.toISOString().split("T")[0],
    };
  }
}

// Create and export a singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
