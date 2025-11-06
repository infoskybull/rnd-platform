import { apiService } from "./api";

// Publisher Analytics Interfaces
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
  lastUpdated: Date;
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
    developerId: string;
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
  lastUpdated: Date;
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
  lastUpdated: Date;
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
  lastUpdated: Date;
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
  lastUpdated: Date;
}

export interface PublisherExtendedDashboard {
  overview: any; // Will use existing AnalyticsOverview interface
  budgetAnalytics: PublisherBudgetAnalytics;
  collaborationPerformance: PublisherCollaborationPerformance;
  projectAnalytics: PublisherProjectAnalytics;
  roiAnalytics: PublisherROIAnalytics;
  paymentAnalytics: PublisherPaymentAnalytics;
}

export interface AnalyticsFilters {
  period?: string;
  dateFrom?: string;
  dateTo?: string;
  projectType?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// Publisher Analytics Service
export class PublisherAnalyticsService {
  async getBudgetAnalytics(
    filters?: AnalyticsFilters
  ): Promise<PublisherBudgetAnalytics> {
    return apiService.getPublisherBudgetAnalytics(
      filters
    ) as unknown as PublisherBudgetAnalytics;
  }

  async getCollaborationPerformance(
    filters?: AnalyticsFilters
  ): Promise<PublisherCollaborationPerformance> {
    return apiService.getPublisherCollaborationPerformance(
      filters
    ) as unknown as PublisherCollaborationPerformance;
  }

  async getProjectAnalytics(
    filters?: AnalyticsFilters
  ): Promise<PublisherProjectAnalytics> {
    return apiService.getPublisherProjectAnalytics(
      filters
    ) as unknown as PublisherProjectAnalytics;
  }

  async getROIAnalytics(
    filters?: AnalyticsFilters
  ): Promise<PublisherROIAnalytics> {
    return apiService.getPublisherROIAnalytics(
      filters
    ) as unknown as PublisherROIAnalytics;
  }

  async getPaymentAnalytics(
    filters?: AnalyticsFilters
  ): Promise<PublisherPaymentAnalytics> {
    return apiService.getPublisherPaymentAnalytics(
      filters
    ) as unknown as PublisherPaymentAnalytics;
  }

  async getExtendedDashboard(
    filters?: AnalyticsFilters
  ): Promise<PublisherExtendedDashboard> {
    return apiService.getPublisherExtendedDashboard(
      filters
    ) as unknown as PublisherExtendedDashboard;
  }
}

// Export singleton instance
export const publisherAnalyticsService = new PublisherAnalyticsService();
