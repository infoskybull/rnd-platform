import React, { useState, useEffect } from "react";
import { useAnalytics } from "../../hooks/useAnalytics";
import { analyticsService } from "../../services/analyticsService";
import { AnalyticsFilters } from "../../services/analyticsService";
import {
  WarningIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from "../icons/Icons";
import {
  PublisherBudgetAnalytics,
  PublisherCollaborationPerformance,
  PublisherProjectAnalytics,
  PublisherROIAnalytics,
  PublisherPaymentAnalytics,
  DeveloperCollaborationProjects,
  DeveloperCollaborationDetails,
} from "../../types";

interface StatsTabProps {
  userRole: "publisher" | "creator";
}

const StatsTab: React.FC<StatsTabProps> = ({ userRole }) => {
  const isPublisher = userRole === "publisher";

  // State for analytics data
  const [selectedPeriod, setSelectedPeriod] = useState<
    "6months" | "12months" | "24months"
  >("12months");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analytics data state
  const [dashboard, setDashboard] = useState<any>(null);
  const [publisherBudgetAnalytics, setPublisherBudgetAnalytics] =
    useState<PublisherBudgetAnalytics | null>(null);
  const [
    publisherCollaborationPerformance,
    setPublisherCollaborationPerformance,
  ] = useState<PublisherCollaborationPerformance | null>(null);
  const [publisherProjectAnalytics, setPublisherProjectAnalytics] =
    useState<PublisherProjectAnalytics | null>(null);
  const [publisherROIAnalytics, setPublisherROIAnalytics] =
    useState<PublisherROIAnalytics | null>(null);
  const [publisherPaymentAnalytics, setPublisherPaymentAnalytics] =
    useState<PublisherPaymentAnalytics | null>(null);
  const [developerCollaborationProjects, setDeveloperCollaborationProjects] =
    useState<DeveloperCollaborationProjects | null>(null);
  const [developerCollaborationDetails, setDeveloperCollaborationDetails] =
    useState<DeveloperCollaborationDetails | null>(null);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: AnalyticsFilters = { period: selectedPeriod };

      if (isPublisher) {
        // Fetch publisher-specific analytics
        const [
          dashboardData,
          budgetData,
          collaborationData,
          projectData,
          roiData,
          paymentData,
        ] = await Promise.all([
          analyticsService.getPublisherDashboard(filters).catch(() => null),
          analyticsService
            .getPublisherBudgetAnalytics(filters)
            .catch(() => null),
          analyticsService
            .getPublisherCollaborationPerformance(filters)
            .catch(() => null),
          analyticsService
            .getPublisherProjectAnalytics(filters)
            .catch(() => null),
          analyticsService.getPublisherROIAnalytics(filters).catch(() => null),
          analyticsService
            .getPublisherPaymentAnalytics(filters)
            .catch(() => null),
        ]);

        setDashboard(dashboardData);
        setPublisherBudgetAnalytics(budgetData);
        setPublisherCollaborationPerformance(collaborationData);
        setPublisherProjectAnalytics(projectData);
        setPublisherROIAnalytics(roiData);
        setPublisherPaymentAnalytics(paymentData);
      } else {
        // Fetch creator-specific analytics
        const [
          dashboardData,
          collaborationProjectsData,
          collaborationDetailsData,
        ] = await Promise.all([
          analyticsService.getDeveloperDashboard(filters).catch(() => null),
          analyticsService
            .getDeveloperCollaborationProjects(filters)
            .catch(() => null),
          analyticsService
            .getDeveloperCollaborationDetails(filters)
            .catch(() => null),
        ]);

        setDashboard(dashboardData);
        setDeveloperCollaborationProjects(collaborationProjectsData);
        setDeveloperCollaborationDetails(collaborationDetailsData);
      }
    } catch (err) {
      // Set a user-friendly error message
      setError("Analytics API is not available yet. Using demo data for now.");
      console.warn("Analytics API not available, using fallback data:", err);

      // Set demo data for development
      if (isPublisher) {
        setDashboard({
          overview: {
            totalPurchases: 12,
            totalSpent: 15000,
            activeCollaborations: 3,
            completedContracts: 8,
            recentPurchases: [
              {
                projectTitle: "Mobile Game Development",
                purchaseDate: "2024-01-15",
                amount: 5000,
              },
              {
                projectTitle: "Web Application",
                purchaseDate: "2024-01-10",
                amount: 3000,
              },
              {
                projectTitle: "Indie Horror Game",
                purchaseDate: "2024-01-08",
                amount: 2500,
              },
              {
                projectTitle: "Racing Simulator",
                purchaseDate: "2024-01-05",
                amount: 2000,
              },
              {
                projectTitle: "Platformer Adventure",
                purchaseDate: "2024-01-03",
                amount: 2500,
              },
            ],
          },
          spendingAnalytics: {
            totalSpent: 15000,
            spendingThisMonth: 5000,
            monthlyGrowth: 15.2,
          },
          purchaseAnalytics: {
            totalPurchases: 12,
            averagePurchaseValue: 1250,
            topPurchasedCategories: ["GAME", "WEB_APP", "MOBILE_APP"],
          },
        });
      } else {
        // Creator-specific demo data
        setDashboard({
          overview: {
            totalPurchases: 0, // Developers don't purchase, they earn
            totalSpent: 0, // Developers don't spend, they earn
            activeCollaborations: 5,
            completedContracts: 12,
            recentPurchases: [], // Developers don't have purchases
          },
          // Creator-specific analytics
          earningsAnalytics: {
            totalEarnings: 25000,
            earningsThisMonth: 3500,
            monthlyGrowth: 12.5,
          },
          projectAnalytics: {
            totalProjects: 8,
            publishedProjects: 6,
            soldProjects: 3,
            averageProjectValue: 1500,
            topProjectCategories: ["GAME", "WEB_APP", "MOBILE_APP"],
          },
        });
        setDeveloperCollaborationDetails({
          totalCollaborations: 17,
          activeCollaborations: 5,
          completedCollaborations: 12,
          totalEarnings: 25000,
          averageProjectValue: 1500,
          topPublishers: [
            {
              publisherId: "pub1",
              publisherName: "GameCorp Studios",
              publisherEmail: "contact@gamecorp.com",
              collaborationCount: 3,
              totalBudget: 12000,
              completedProjects: 2,
            },
            {
              publisherId: "pub2",
              publisherName: "IndieGames Inc",
              publisherEmail: "hello@indiegames.com",
              collaborationCount: 2,
              totalBudget: 8000,
              completedProjects: 1,
            },
          ],
          successRate: 85.5,
        });
        setDeveloperCollaborationProjects({
          totalProjects: 8,
          projects: [
            {
              collaborationId: "collab1",
              projectId: "proj1",
              projectTitle: "Space Adventure RPG",
              projectType: "idea_sale",
              projectStatus: "completed",
              publisherName: "GameCorp Studios",
              publisherEmail: "contact@gamecorp.com",
              budget: 5000,
              status: "completed",
              startDate: "2024-01-01",
              endDate: "2024-03-01",
              createdAt: "2024-01-01",
            },
            {
              collaborationId: "collab2",
              projectId: "proj2",
              projectTitle: "Mobile Puzzle Game",
              projectType: "product_sale",
              projectStatus: "active",
              publisherName: "IndieGames Inc",
              publisherEmail: "hello@indiegames.com",
              budget: 3000,
              status: "active",
              startDate: "2024-02-01",
              endDate: "2024-04-01",
              createdAt: "2024-02-01",
            },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or period changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, userRole]);

  // Log calculations when dashboard data changes
  useEffect(() => {
    if (dashboard) {
      logCalculations();
    }
  }, [dashboard]);

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
    </div>
  );

  // Error component
  const ErrorMessage = ({ error }: { error: string }) => (
    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
      <div className="flex items-center">
        <div className="text-red-400 mr-2">
          <WarningIcon className="w-5 h-5" />
        </div>
        <div className="text-red-300 text-sm">{error}</div>
      </div>
    </div>
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate and validate total from recent purchases
  const calculateRecentPurchasesTotal = (purchases: any[]) => {
    if (!purchases || purchases.length === 0) return 0;
    return purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
  };

  // Debug function to log calculations
  const logCalculations = () => {
    if (dashboard?.overview?.recentPurchases) {
      const recentTotal = calculateRecentPurchasesTotal(
        dashboard.overview.recentPurchases
      );
      console.log("Recent Purchases Calculation:");
      console.log("Recent Purchases:", dashboard.overview.recentPurchases);
      console.log("Calculated Total:", recentTotal);
      console.log("Dashboard Total Spent:", dashboard.overview.totalSpent);
      console.log(
        "Match:",
        recentTotal <= dashboard.overview.totalSpent ? "Valid" : "Invalid"
      );
    }
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  // Safe toFixed function to prevent undefined errors
  const safeToFixed = (
    value: number | undefined | null,
    decimals: number = 1
  ): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0." + "0".repeat(decimals);
    }
    return value.toFixed(decimals);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Analytics & Stats
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            {isPublisher
              ? "Track your purchasing activity and marketplace engagement"
              : "Monitor your project performance and creator metrics"}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex space-x-1 sm:space-x-2">
          {(["6months", "12months", "24months"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {period === "6months"
                ? "6M"
                : period === "12months"
                ? "12M"
                : "24M"}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage error={error} />}

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Key Metrics Cards - Role-specific */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {isPublisher ? (
              // Publisher Metrics
              <>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indigo-400">
                      {dashboard?.overview
                        ? formatNumber(dashboard.overview.totalPurchases)
                        : "0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Total Purchases
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-red-400">
                      {dashboard?.overview
                        ? formatCurrency(dashboard.overview.totalSpent)
                        : "$0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Total Spent
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-400">
                      {dashboard?.overview
                        ? formatNumber(dashboard.overview.activeCollaborations)
                        : "0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Active Collaborations
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-400">
                      {dashboard?.overview
                        ? formatNumber(
                            dashboard.overview.completedContracts || 0
                          )
                        : "0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Completed Contracts
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Creator Metrics
              <>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-400">
                      {dashboard?.earningsAnalytics
                        ? formatCurrency(
                            dashboard.earningsAnalytics.totalEarnings
                          )
                        : "$0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Total Earnings
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-400">
                      {dashboard?.projectAnalytics
                        ? formatNumber(dashboard.projectAnalytics.totalProjects)
                        : "0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Total Projects
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-400">
                      {dashboard?.overview
                        ? formatNumber(dashboard.overview.activeCollaborations)
                        : "0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Active Collaborations
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-400">
                      {dashboard?.overview
                        ? formatNumber(
                            dashboard.overview.completedContracts || 0
                          )
                        : "0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Completed Projects
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Detailed Analytics Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {isPublisher ? (
              // Publisher: Recent Purchases Section
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Recent Purchases
                  </h3>
                  {dashboard?.overview?.recentPurchases?.length > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Recent Total:</div>
                      <div className="text-sm font-medium text-red-400">
                        {formatCurrency(
                          calculateRecentPurchasesTotal(
                            dashboard.overview.recentPurchases
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {dashboard?.overview?.recentPurchases?.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {dashboard.overview.recentPurchases
                      .slice(0, 5)
                      .map((purchase, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 sm:p-3 bg-gray-700/50 rounded-lg gap-2"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs sm:text-sm font-medium truncate">
                                {purchase.projectTitle}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {new Date(
                                  purchase.purchaseDate
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-red-400 text-xs sm:text-sm font-medium">
                              -{formatCurrency(purchase.amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">
                      <ShoppingCartIcon className="w-16 h-16 mx-auto text-blue-400" />
                    </div>
                    <p className="text-gray-400">No recent purchases</p>
                    <p className="text-gray-500 text-sm">
                      Your recent purchases will appear here
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Creator: Recent Earnings Section
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Recent Earnings
                  </h3>
                  {developerCollaborationProjects?.projects?.length > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Recent Total:</div>
                      <div className="text-sm font-medium text-green-400">
                        {formatCurrency(
                          developerCollaborationProjects.projects
                            .slice(0, 5)
                            .reduce((sum, project) => sum + project.budget, 0)
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {developerCollaborationProjects?.projects?.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {developerCollaborationProjects.projects
                      .slice(0, 5)
                      .map((project, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 sm:p-3 bg-gray-700/50 rounded-lg gap-2"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs sm:text-sm font-medium truncate">
                                {project.projectTitle}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {project.publisherName} • {project.status}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-green-400 text-xs sm:text-sm font-medium">
                              +{formatCurrency(project.budget)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">
                      <CurrencyDollarIcon className="w-16 h-16 mx-auto text-green-400" />
                    </div>
                    <p className="text-gray-400">No recent earnings</p>
                    <p className="text-gray-500 text-sm">
                      Your collaboration earnings will appear here
                    </p>
                  </div>
                )}
              </div>
            )}

            {isPublisher ? (
              // Publisher: Spending Overview Section
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                  Spending Overview
                </h3>

                {dashboard?.spendingAnalytics ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-red-400">
                          {formatCurrency(
                            dashboard.spendingAnalytics.totalSpent
                          )}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          Total Spent
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-orange-400">
                          {formatCurrency(
                            dashboard.spendingAnalytics.spendingThisMonth
                          )}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          This Month
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs sm:text-sm text-gray-400">
                        Monthly Growth:{" "}
                        <span className="text-red-400 font-medium">
                          {dashboard.spendingAnalytics.monthlyGrowth.toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">💸</div>
                    <p className="text-gray-400">No spending data</p>
                    <p className="text-gray-500 text-sm">
                      Purchase games to track spending
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Creator: Earnings Overview Section
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                  Earnings Overview
                </h3>

                {dashboard?.earningsAnalytics ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-green-400">
                          {formatCurrency(
                            dashboard.earningsAnalytics.totalEarnings
                          )}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          Total Earnings
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-blue-400">
                          {formatCurrency(
                            dashboard.earningsAnalytics.earningsThisMonth
                          )}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          This Month
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs sm:text-sm text-gray-400">
                        Monthly Growth:{" "}
                        <span className="text-green-400 font-medium">
                          {dashboard.earningsAnalytics.monthlyGrowth.toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">
                      <CurrencyDollarIcon className="w-16 h-16 mx-auto text-green-400" />
                    </div>
                    <p className="text-gray-400">No earnings data</p>
                    <p className="text-gray-500 text-sm">
                      Complete collaborations to track earnings
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Analytics Breakdown - Role-specific */}
          {isPublisher
            ? // Publisher: Purchase Analytics
              dashboard?.purchaseAnalytics && (
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                    Purchase Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-indigo-400">
                        {formatNumber(
                          dashboard.purchaseAnalytics.totalPurchases
                        )}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Total Purchases
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-red-400">
                        {formatCurrency(
                          dashboard.purchaseAnalytics.averagePurchaseValue
                        )}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Average Value
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-blue-400">
                        {
                          dashboard.purchaseAnalytics.topPurchasedCategories
                            .length
                        }
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Categories
                      </div>
                    </div>
                  </div>
                </div>
              )
            : // Creator: Project Analytics
              dashboard?.projectAnalytics && (
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                    Project Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-blue-400">
                        {formatNumber(dashboard.projectAnalytics.totalProjects)}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Total Projects
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-green-400">
                        {formatCurrency(
                          dashboard.projectAnalytics.averageProjectValue
                        )}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Average Value
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-yellow-400">
                        {dashboard.projectAnalytics.topProjectCategories.length}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Categories
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* Collaboration Analytics for Developers */}
          {!isPublisher && developerCollaborationDetails && (
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                Collaboration Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-indigo-400">
                    {formatNumber(
                      developerCollaborationDetails.totalCollaborations
                    )}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Total Collaborations
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-green-400">
                    {formatCurrency(
                      developerCollaborationDetails.totalEarnings
                    )}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Total Earnings
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-blue-400">
                    {developerCollaborationDetails.successRate.toFixed(1)}%
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Success Rate
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Publisher Extended Analytics Section */}
      {isPublisher && publisherBudgetAnalytics && (
        <>
          {/* Budget Analytics */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
              Budget Analytics
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-blue-400">
                  {formatCurrency(
                    publisherBudgetAnalytics.totalBudgetAllocated
                  )}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">
                  Total Allocated
                </div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-red-400">
                  {formatCurrency(publisherBudgetAnalytics.totalBudgetSpent)}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">
                  Total Spent
                </div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-green-400">
                  {formatCurrency(publisherBudgetAnalytics.remainingBudget)}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">
                  Remaining
                </div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                <div className="text-lg sm:text-xl font-bold text-yellow-400">
                  {publisherBudgetAnalytics.budgetUtilizationRate.toFixed(1)}%
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">
                  Utilization Rate
                </div>
              </div>
            </div>

            {/* Budget by Project Type */}
            {publisherBudgetAnalytics.budgetByProjectType?.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base font-medium text-white mb-3">
                  Budget by Project Type
                </h4>
                <div className="space-y-2">
                  {publisherBudgetAnalytics.budgetByProjectType.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-gray-700/30 rounded-lg gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm sm:text-base truncate">
                            {item.projectType}
                          </div>
                          <div className="text-gray-400 text-xs sm:text-sm">
                            {item.projectCount} projects
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-green-400 font-medium text-xs sm:text-sm">
                            {formatCurrency(item.spentBudget)} /{" "}
                            {formatCurrency(item.totalBudget)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {(
                              (item.spentBudget / item.totalBudget) *
                              100
                            ).toFixed(1)}
                            % used
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Collaboration Performance */}
          {publisherCollaborationPerformance && (
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                Collaboration Performance
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-indigo-400">
                    {publisherCollaborationPerformance.totalCollaborations}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Total Collaborations
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-green-400">
                    {publisherCollaborationPerformance.activeCollaborations}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">Active</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-blue-400">
                    {publisherCollaborationPerformance.collaborationSuccessRate.toFixed(
                      1
                    )}
                    %
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Success Rate
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-yellow-400">
                    {publisherCollaborationPerformance.averageProjectRating.toFixed(
                      1
                    )}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Avg Rating
                  </div>
                </div>
              </div>

              {/* Top Performing Developers */}
              {publisherCollaborationPerformance.topPerformingDevelopers
                ?.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-white mb-3">
                    Top Performing Developers
                  </h4>
                  <div className="space-y-2">
                    {publisherCollaborationPerformance.topPerformingDevelopers
                      .slice(0, 5)
                      .map((dev, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-gray-700/30 rounded-lg gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm sm:text-base truncate">
                              {dev.developerName}
                            </div>
                            <div className="text-gray-400 text-xs sm:text-sm">
                              {dev.completedProjects} completed projects
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-yellow-400 font-medium text-xs sm:text-sm">
                              ⭐ {dev.averageRating.toFixed(1)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {formatCurrency(dev.totalBudget)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Analytics */}
          {publisherProjectAnalytics && (
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                Project Analytics
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-blue-400">
                    {publisherProjectAnalytics.totalProjectsPurchased}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Total Purchased
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-yellow-400">
                    {publisherProjectAnalytics.totalProjectsInDevelopment}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    In Development
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-green-400">
                    {publisherProjectAnalytics.totalProjectsCompleted}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Completed
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-purple-400">
                    {formatCurrency(
                      publisherProjectAnalytics.averageProjectValue
                    )}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Avg Value
                  </div>
                </div>
              </div>

              {/* Projects by Type */}
              {publisherProjectAnalytics.projectsByType?.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-white mb-3">
                    Projects by Type
                  </h4>
                  <div className="space-y-2">
                    {publisherProjectAnalytics.projectsByType.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-gray-700/30 rounded-lg gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm sm:text-base truncate">
                              {item.projectType}
                            </div>
                            <div className="text-gray-400 text-xs sm:text-sm">
                              {item.count} projects
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-green-400 font-medium text-xs sm:text-sm">
                              {formatCurrency(item.totalValue)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              Avg: {formatCurrency(item.averageValue)}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROI Analytics */}
          {publisherROIAnalytics && (
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                ROI Analytics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-red-400">
                    {formatCurrency(publisherROIAnalytics.totalInvestment)}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Total Investment
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-green-400">
                    {formatCurrency(publisherROIAnalytics.totalRevenue)}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Total Revenue
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-yellow-400">
                    {publisherROIAnalytics.netROI.toFixed(1)}%
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Net ROI
                  </div>
                </div>
              </div>

              {/* ROI by Project Type */}
              {publisherROIAnalytics.roiByProjectType?.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-white mb-3">
                    ROI by Project Type
                  </h4>
                  <div className="space-y-2">
                    {publisherROIAnalytics.roiByProjectType.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-gray-700/30 rounded-lg gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm sm:text-base truncate">
                              {item.projectType}
                            </div>
                            <div className="text-gray-400 text-xs sm:text-sm">
                              Invested: {formatCurrency(item.investment)}
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-green-400 font-medium text-xs sm:text-sm">
                              {formatCurrency(item.revenue)}
                            </div>
                            <div className="text-yellow-400 text-xs">
                              ROI: {item.roi.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Analytics */}
          {publisherPaymentAnalytics && (
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                Payment Analytics
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-blue-400">
                    {publisherPaymentAnalytics.totalPaymentsMade}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Total Payments
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-green-400">
                    {formatCurrency(publisherPaymentAnalytics.totalAmountPaid)}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Total Paid
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-yellow-400">
                    {formatCurrency(
                      publisherPaymentAnalytics.averagePaymentAmount
                    )}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Avg Payment
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-red-400">
                    {publisherPaymentAnalytics.pendingPayments}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">
                    Pending
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              {publisherPaymentAnalytics.paymentMethods?.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-white mb-3">
                    Payment Methods
                  </h4>
                  <div className="space-y-2">
                    {publisherPaymentAnalytics.paymentMethods.map(
                      (method, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-gray-700/30 rounded-lg gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm sm:text-base truncate">
                              {method.method}
                            </div>
                            <div className="text-gray-400 text-xs sm:text-sm">
                              {method.count} payments
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-green-400 font-medium text-xs sm:text-sm">
                              {formatCurrency(method.totalAmount)}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatsTab;
