import React, { useState, useEffect } from "react";
import { useAnalytics } from "../../hooks/useAnalytics";
import { analyticsService } from "../../services/analyticsService";
import apiService from "../../services/api";
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
  SpendingTrends,
  EarningsChartData,
} from "../../types";

interface StatsTabProps {
  userRole: "publisher" | "creator";
}

// Earnings Chart Component
interface EarningsChartProps {
  data: Array<{
    month: string;
    monthLabel: string;
    projectCount: number;
    totalEarnings: number;
    averageEarningsPerProject?: number;
    growth?: number;
  }>;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  totalEarnings?: number; // Total earnings from dashboard for comparison
}

const EarningsChart: React.FC<EarningsChartProps> = ({
  data,
  formatCurrency,
  formatNumber,
  totalEarnings,
}) => {
  if (!data || data.length === 0) return null;

  // Group data by quarter
  const groupByQuarter = (monthData: typeof data) => {
    const quarters: Record<string, typeof data> = {};

    monthData.forEach((item) => {
      const [year, month] = item.month.split("-");
      const monthNum = parseInt(month);
      const quarter = Math.floor((monthNum - 1) / 3) + 1;
      const quarterKey = `${year}-Q${quarter}`;

      if (!quarters[quarterKey]) {
        quarters[quarterKey] = [];
      }
      quarters[quarterKey].push(item);
    });

    return Object.entries(quarters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarterKey, items]) => {
        const totalEarnings = items.reduce(
          (sum, item) => sum + (item.totalEarnings || 0),
          0
        );
        const totalProjects = items.reduce(
          (sum, item) => sum + (item.projectCount || 0),
          0
        );
        const [year, quarter] = quarterKey.split("-Q");
        const yearShort = year.slice(-2); // Lấy 2 chữ số cuối của năm
        const quarterLabel = `Q${quarter} ${yearShort}`;

        // Calculate growth vs previous quarter
        let growth: number | undefined = undefined;
        const quarterIndex = Object.keys(quarters).sort().indexOf(quarterKey);
        if (quarterIndex > 0) {
          const prevQuarterKey = Object.keys(quarters).sort()[quarterIndex - 1];
          const prevQuarterItems = quarters[prevQuarterKey];
          const prevTotalEarnings = prevQuarterItems.reduce(
            (sum, item) => sum + (item.totalEarnings || 0),
            0
          );
          if (prevTotalEarnings > 0) {
            growth =
              ((totalEarnings - prevTotalEarnings) / prevTotalEarnings) * 100;
          }
        }

        return {
          quarterKey,
          quarterLabel,
          totalEarnings,
          projectCount: totalProjects,
          growth,
          averageEarningsPerProject:
            totalProjects > 0 ? totalEarnings / totalProjects : 0,
          months: items.map((item) => item.monthLabel).join(", "),
        };
      });
  };

  const quarterlyData = groupByQuarter(data);

  // Calculate max value for scaling (use totalEarnings for bar height)
  const maxEarnings = Math.max(
    ...quarterlyData.map((d) => d.totalEarnings || 0)
  );
  const maxProjects = Math.max(
    ...quarterlyData.map((d) => d.projectCount || 0)
  );
  const minValue = 0; // Start from 0 for better visualization

  // Chart dimensions
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 100;
  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  // Tính toán barWidth và spacing để có khoảng cách rộng hơn
  const minBarWidth = 3; // Minimum width cho mỗi bar
  const totalSpacing =
    quarterlyData.length > 1 ? (quarterlyData.length - 1) * 2 : 0; // Khoảng cách giữa các bars (2 units mỗi khoảng)
  const availableWidth = usableWidth - totalSpacing;
  const barWidth = Math.max(minBarWidth, availableWidth / quarterlyData.length);
  const barSpacing = 2; // Fixed spacing giữa các bars

  // Calculate bar heights for earnings (primary bars)
  const bars = quarterlyData.map((item, index) => {
    const earningsValue = item.totalEarnings || 0;
    const earningsHeight =
      maxEarnings > 0 ? (earningsValue / maxEarnings) * usableHeight : 0;
    // Tính x position với spacing đã được tính toán
    const x = padding.left + index * (barWidth + barSpacing);
    const y = padding.top + usableHeight - earningsHeight;

    return {
      x,
      y,
      earningsHeight: earningsHeight || 0,
      earningsValue,
      projectCount: item.projectCount || 0,
      quarterLabel: item.quarterLabel,
      growth: item.growth,
      averageEarningsPerProject: item.averageEarningsPerProject,
      months: item.months,
    };
  });

  // Generate line path for trend (connecting midpoints of bars)
  const linePoints = bars
    .map((bar) => `${bar.x + barWidth / 2},${bar.y}`)
    .join(" ");

  return (
    <div className="w-full">
      {/* Chart SVG */}
      <div
        className="relative w-full"
        style={{ height: `${chartHeight + 60}px` }}
      >
        <svg
          width="100%"
          height={chartHeight + 60}
          className="overflow-visible"
          viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + usableHeight - ratio * usableHeight;
            return (
              <line
                key={ratio}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="rgba(156, 163, 175, 0.2)"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Bars for Earnings */}
          {bars.map((bar, index) => (
            <g key={index}>
              <rect
                x={bar.x}
                y={bar.y}
                width={barWidth}
                height={bar.earningsHeight}
                fill="url(#earningsGradient)"
                rx="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
              {/* Value label on hover */}
              <title>
                {bar.quarterLabel}
                {"\n"}Earnings: {formatCurrency(bar.earningsValue)}
                {"\n"}Projects: {formatNumber(bar.projectCount)}
                {"\n"}Months: {bar.months}
                {bar.growth !== undefined &&
                  bar.growth !== null &&
                  `\nGrowth: ${bar.growth >= 0 ? "+" : ""}${bar.growth.toFixed(
                    1
                  )}%`}
              </title>
            </g>
          ))}

          {/* Trend line */}
          {bars.length > 1 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          )}

          {/* Gradient definition */}
          <defs>
            <linearGradient
              id="earningsGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>

        {/* X-axis labels */}
        <div
          className="flex mt-2"
          style={{
            paddingLeft: `${padding.left}%`,
            paddingRight: `${padding.right}%`,
            gap: `${
              (barSpacing / (chartWidth - padding.left - padding.right)) * 100
            }%`,
          }}
        >
          {bars.map((bar, index) => (
            <div
              key={index}
              className="text-xs text-gray-400 text-center flex-1"
              style={{
                minWidth: `${
                  (barWidth / (chartWidth - padding.left - padding.right)) * 100
                }%`,
              }}
              title={`${bar.quarterLabel} (${bar.months})`}
            >
              {bar.quarterLabel}
            </div>
          ))}
        </div>

        {/* Y-axis labels */}
        <div
          className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-400"
          style={{ width: `${padding.left}%`, paddingLeft: "4px" }}
        >
          {[
            maxEarnings,
            maxEarnings * 0.75,
            maxEarnings * 0.5,
            maxEarnings * 0.25,
            0,
          ].map((value, index) => (
            <div key={index}>{formatCurrency(Math.round(value))}</div>
          ))}
        </div>
      </div>

      {/* Legend and Stats */}
      <div className="mt-4 space-y-3">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Earnings</span>
          </div>
          {bars.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-green-400 opacity-60"></div>
              <span>Trend</span>
            </div>
          )}
        </div>

        {/* Quarterly Stats Grid - Last 3 quarters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
          {bars.slice(-3).map((bar, index) => (
            <div key={index} className="bg-gray-700/30 rounded-lg p-2 text-xs">
              <div className="text-gray-400 mb-1">{bar.quarterLabel}</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Projects:</span>
                  <span className="text-blue-400 font-medium">
                    {formatNumber(bar.projectCount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Earnings:</span>
                  <span className="text-green-400 font-medium">
                    {formatCurrency(bar.earningsValue)}
                  </span>
                </div>
                {bar.growth !== undefined && bar.growth !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Growth:</span>
                    <span
                      className={`font-medium ${
                        bar.growth >= 0 ? "text-green-400" : "text-gray-400"
                      }`}
                    >
                      {bar.growth >= 0 ? "+" : ""}
                      {bar.growth.toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-600">
                  {bar.months}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrends | null>(
    null
  );
  const [earningsChartData, setEarningsChartData] =
    useState<EarningsChartData | null>(null);

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
          trendsData,
        ] = await Promise.all([
          apiService.getPublisherDashboard(filters).catch(() => null),
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
          apiService.getSpendingTrends(filters).catch(() => null),
        ]);

        setDashboard(dashboardData);
        setPublisherBudgetAnalytics(budgetData);
        setPublisherCollaborationPerformance(collaborationData);
        setPublisherProjectAnalytics(projectData);
        setPublisherROIAnalytics(roiData);
        setPublisherPaymentAnalytics(paymentData);
        setSpendingTrends(trendsData);
      } else {
        // Fetch creator-specific analytics using real API
        const [
          dashboardData,
          trendsData,
          earningsChartDataResponse,
          collaborationProjectsData,
          collaborationDetailsData,
        ] = await Promise.all([
          apiService.getDeveloperDashboard(filters).catch(() => null),
          apiService.getSpendingTrends(filters).catch(() => null),
          apiService.getCreatorEarningsChart(filters).catch(() => null),
          analyticsService
            .getDeveloperCollaborationProjects(filters)
            .catch(() => null),
          analyticsService
            .getDeveloperCollaborationDetails(filters)
            .catch(() => null),
        ]);

        setDashboard(dashboardData);
        setSpendingTrends(trendsData);
        setEarningsChartData(
          earningsChartDataResponse?.data || earningsChartDataResponse
        );
        setDeveloperCollaborationProjects(collaborationProjectsData);
        setDeveloperCollaborationDetails(collaborationDetailsData);
      }
    } catch (err) {
      // Set a user-friendly error message
      setError("Failed to load analytics data. Please try again later.");
      console.warn("Analytics API error:", err);

      // Set empty/null data instead of demo data
      if (isPublisher) {
        setDashboard(null);
        setPublisherBudgetAnalytics(null);
        setPublisherCollaborationPerformance(null);
        setPublisherProjectAnalytics(null);
        setPublisherROIAnalytics(null);
        setPublisherPaymentAnalytics(null);
        setSpendingTrends(null);
      } else {
        setDashboard(null);
        setSpendingTrends(null);
        setEarningsChartData(null);
        setDeveloperCollaborationProjects(null);
        setDeveloperCollaborationDetails(null);
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
              // Creator Metrics - Using API response format
              <>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-400">
                      {dashboard?.collaborationAnalytics
                        ? formatCurrency(
                            dashboard.collaborationAnalytics
                              .totalCollaborationValue || 0
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
                      {dashboard?.purchaseAnalytics
                        ? formatNumber(
                            dashboard.purchaseAnalytics.totalPurchases || 0
                          )
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
                      {dashboard?.collaborationAnalytics
                        ? formatNumber(
                            dashboard.collaborationAnalytics
                              .activeCollaborations || 0
                          )
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
                      {dashboard?.collaborationAnalytics
                        ? formatNumber(
                            dashboard.collaborationAnalytics
                              .completedContracts || 0
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
              // Creator: Earnings Chart Section
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Earnings Chart
                  </h3>
                  {dashboard?.collaborationAnalytics
                    ?.totalCollaborationValue !== undefined && (
                    <div className="text-right">
                      <div className="text-xs text-gray-400">
                        Total Earnings:
                      </div>
                      <div className="text-sm font-medium text-green-400">
                        {formatCurrency(
                          dashboard.collaborationAnalytics
                            .totalCollaborationValue || 0
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {earningsChartData &&
                earningsChartData.data &&
                earningsChartData.data.length > 0 ? (
                  <EarningsChart
                    data={earningsChartData.data}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                    totalEarnings={
                      dashboard?.collaborationAnalytics?.totalCollaborationValue
                    }
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">
                      <CurrencyDollarIcon className="w-16 h-16 mx-auto text-green-400" />
                    </div>
                    <p className="text-gray-400">No earnings data</p>
                    <p className="text-gray-500 text-sm">
                      Your earnings chart will appear here
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
              // Creator: Earnings Overview Section - Using API response format
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                  Earnings Overview
                </h3>

                {dashboard?.spendingAnalytics ||
                dashboard?.collaborationAnalytics ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-green-400">
                          {dashboard?.collaborationAnalytics
                            ? formatCurrency(
                                dashboard.collaborationAnalytics
                                  .totalCollaborationValue || 0
                              )
                            : "$0"}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          Total Earnings
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-blue-400">
                          {dashboard?.spendingAnalytics
                            ? formatCurrency(
                                dashboard.spendingAnalytics.spendingThisMonth ||
                                  0
                              )
                            : "$0"}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          This Month
                        </div>
                      </div>
                    </div>
                    {dashboard?.spendingAnalytics?.monthlyGrowth !==
                      undefined && (
                      <div className="text-center">
                        <div className="text-xs sm:text-sm text-gray-400">
                          Monthly Growth:{" "}
                          <span className="text-green-400 font-medium">
                            {dashboard.spendingAnalytics.monthlyGrowth.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    )}
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
            : // Creator: Project Analytics - Using API response format
              dashboard?.purchaseAnalytics && (
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                    Project Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-blue-400">
                        {formatNumber(
                          dashboard.purchaseAnalytics.totalPurchases || 0
                        )}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Total Projects
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-green-400">
                        {formatCurrency(
                          dashboard.purchaseAnalytics.averagePurchaseValue || 0
                        )}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Average Value
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gray-700/50 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-yellow-400">
                        {dashboard.purchaseAnalytics.topPurchasedCategories
                          ?.length || 0}
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
      {isPublisher && (
        <>
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
