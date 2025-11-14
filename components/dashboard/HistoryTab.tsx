import React, { useState, useEffect } from "react";
import { analyticsService } from "../../services/analyticsService";
import apiService from "../../services/api";
import {
  AnalyticsFilters,
  PurchaseActivity,
} from "../../services/analyticsService";
import { DeveloperCollaborationProjects, Collaboration } from "../../types";
import {
  WarningIcon,
  ShoppingCartIcon,
  TargetIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from "../icons/Icons";

interface HistoryTabProps {
  userRole: "publisher" | "creator";
}

const HistoryTab: React.FC<HistoryTabProps> = ({ userRole }) => {
  const isPublisher = userRole === "publisher";

  // State for analytics data
  const [selectedPeriod, setSelectedPeriod] = useState<
    "6months" | "12months" | "24months"
  >("12months");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analytics data state
  const [purchaseActivity, setPurchaseActivity] =
    useState<PurchaseActivity | null>(null);
  const [developerCollaborationProjects, setDeveloperCollaborationProjects] =
    useState<DeveloperCollaborationProjects | null>(null);
  const [ideaSaleProjects, setIdeaSaleProjects] = useState<any[]>([]);
  const [productSaleProjects, setProductSaleProjects] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch analytics data
  const fetchHistoryData = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: AnalyticsFilters = {
        period: selectedPeriod,
        page: currentPage,
        limit: 10,
      };

      if (isPublisher) {
        // Fetch purchase history for publishers using real API
        try {
          // Calculate date range based on selected period
          const now = new Date();
          const monthsAgo =
            selectedPeriod === "6months" ? 6 : selectedPeriod === "12months" ? 12 : 24;
          const dateFrom = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

          // Use real API to get purchase history
          const purchaseHistoryResponse = await apiService.getPurchaseHistory({
            page: currentPage,
            limit: 10,
            sortBy: "soldAt",
            sortOrder: "desc",
            // Filter by date if needed
            // dateFrom: dateFrom.toISOString(),
            // dateTo: now.toISOString(),
          });

          // Map purchase history to PurchaseActivity format
          const mappedActivities: PurchaseActivity = {
            total: purchaseHistoryResponse.total || 0,
            page: purchaseHistoryResponse.page || currentPage,
            limit: purchaseHistoryResponse.limit || 10,
            totalPages: purchaseHistoryResponse.totalPages || 1,
            lastUpdated: new Date().toISOString(),
            activities: (purchaseHistoryResponse.projects || []).map((project: any) => {
              // Get price from project data
              const purchasePrice =
                project.ideaSaleData?.askingPrice ||
                project.productSaleData?.askingPrice ||
                project.creatorCollaborationData?.budget ||
                0;

              // Get seller/developer info
              const seller = project.originalDeveloper || project.owner || project.developer || {};
              
              // Get project type
              const projectType = project.projectType?.toUpperCase() || "UNKNOWN";

              return {
                id: project._id || project.id || "",
                projectTitle: project.title || "Unknown Project",
                projectType: projectType,
                amount: purchasePrice,
                purchaseDate: project.soldAt || project.createdAt || new Date().toISOString(),
                status: project.status === "sold" ? "completed" : (project.status || "completed"),
                seller: {
                  _id: seller._id || seller.id || "",
                  firstName: seller.firstName || "",
                  lastName: seller.lastName || "",
                  email: seller.email || "",
                  avatar: seller.avatar,
                },
                buyer: {
                  _id: "", // Will be filled by backend if available
                  firstName: "",
                  lastName: "",
                  email: "",
                  avatar: undefined,
                },
                thumbnail: project.thumbnail,
              };
            }),
          };

          setPurchaseActivity(mappedActivities);
          setTotalPages(mappedActivities.totalPages);
        } catch (apiError) {
          console.error("Failed to fetch purchase history from API:", apiError);
          // Try fallback analytics API
          try {
            const activityData = await analyticsService
              .getPurchaseActivity(filters)
              .catch(() => null);

            if (activityData) {
              setPurchaseActivity(activityData);
              setTotalPages(activityData.totalPages || 1);
            } else {
              // Set empty data if both APIs fail
              setPurchaseActivity({
                activities: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 1,
                lastUpdated: new Date().toISOString(),
              });
            }
          } catch (fallbackError) {
            console.error("Fallback API also failed:", fallbackError);
            setPurchaseActivity({
              activities: [],
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 1,
              lastUpdated: new Date().toISOString(),
            });
          }
        }
      } else {
        // Fetch collaboration projects, idea sale, and product sale projects for creators
        try {
          // Calculate date range based on selected period
          const now = new Date();
          const monthsAgo =
            selectedPeriod === "6months" ? 6 : selectedPeriod === "12months" ? 12 : 24;
          const dateFrom = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

          // Fetch all three types of projects in parallel
          const [collaborationResponse, myProjectsResponse] = await Promise.all([
            apiService.getDeveloperCollaborations({
              page: currentPage,
              limit: 10,
              sortBy: "createdAt",
              sortOrder: "desc",
            }).catch(() => ({ collaborations: [], total: 0, totalPages: 1 })),
            apiService.getMyProjects({
              page: currentPage,
              limit: 100, // Get more to filter by type
              sortBy: "createdAt",
              sortOrder: "desc",
            }).catch(() => ({ projects: [], total: 0, totalPages: 1 })),
          ]);

          // Map Collaboration[] to DeveloperCollaborationProjects format
          const mappedCollaborations: DeveloperCollaborationProjects = {
            totalProjects: collaborationResponse.total || 0,
            projects: (collaborationResponse.collaborations || []).map(
              (collab: Collaboration) => ({
                collaborationId: collab._id || collab.id || "",
                projectId: collab.projectId || "",
                projectTitle: collab.project?.title || "Unknown Project",
                projectType:
                  collab.project?.projectType?.toUpperCase() ||
                  "DEV_COLLABORATION",
                projectStatus: collab.project?.status || "unknown",
                publisherName: collab.publisher
                  ? `${collab.publisher.firstName || ""} ${collab.publisher.lastName || ""}`.trim() || collab.publisher.email || "Unknown Publisher"
                  : "Unknown Publisher",
                publisherEmail: collab.publisher?.email || "",
                budget: collab.budget || 0,
                status: collab.status || "pending",
                startDate: collab.startDate || collab.createdAt || "",
                endDate: collab.endDate || "",
                createdAt: collab.createdAt || "",
              })
            ),
          };

          // Filter idea sale and product sale projects
          const allProjects = myProjectsResponse.projects || [];
          const ideaSales = allProjects.filter(
            (p: any) => p.projectType === "idea_sale" && p.status === "sold"
          );
          const productSales = allProjects.filter(
            (p: any) => p.projectType === "product_sale" && p.status === "sold"
          );

          setDeveloperCollaborationProjects(mappedCollaborations);
          setIdeaSaleProjects(ideaSales);
          setProductSaleProjects(productSales);
          
          // Note: totalPages will be calculated in the render function based on combined projects
          setTotalPages(1);
        } catch (apiError) {
          console.error("Failed to fetch projects from API:", apiError);
          // Try fallback analytics API
          try {
            const collaborationData = await analyticsService
              .getDeveloperCollaborationProjects(filters)
              .catch(() => null);

            if (collaborationData) {
              setDeveloperCollaborationProjects(collaborationData);
            } else {
              // Set empty data if both APIs fail
              setDeveloperCollaborationProjects({
                totalProjects: 0,
                projects: [],
              });
            }
            setIdeaSaleProjects([]);
            setProductSaleProjects([]);
          } catch (fallbackError) {
            console.error("Fallback API also failed:", fallbackError);
            setDeveloperCollaborationProjects({
              totalProjects: 0,
              projects: [],
            });
            setIdeaSaleProjects([]);
            setProductSaleProjects([]);
          }
        }
      }
    } catch (err) {
      // Set a user-friendly error message
      setError("Failed to load history data. Please try again later.");
      console.warn("History API error:", err);

      // Set empty data if error occurs
      if (isPublisher) {
        setPurchaseActivity({
          activities: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          lastUpdated: new Date().toISOString(),
        });
        setTotalPages(1);
      } else {
        // Set empty data if error occurs
        setDeveloperCollaborationProjects({
          totalProjects: 0,
          projects: [],
        });
        setIdeaSaleProjects([]);
        setProductSaleProjects([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchHistoryData();
  }, [selectedPeriod, userRole, currentPage]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Activity History
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            {isPublisher
              ? "View your purchase history and transaction details"
              : "View your collaboration projects and development history"}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {isPublisher ? (
              <>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indigo-400">
                      {purchaseActivity?.total || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Total Purchases
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-400">
                      {purchaseActivity?.activities?.length || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      This Period
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-400">
                      {formatCurrency(
                        purchaseActivity?.activities?.reduce(
                          (sum, activity) => sum + activity.amount,
                          0
                        ) || 0
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Total Spent
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indigo-400">
                      {(developerCollaborationProjects?.totalProjects || 0) + 
                       (ideaSaleProjects?.length || 0) + 
                       (productSaleProjects?.length || 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Total Projects
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-400">
                      {(developerCollaborationProjects?.projects?.filter(
                        (p) => p.status === "active"
                      ).length || 0) + 
                       (ideaSaleProjects?.filter((p: any) => p.status === "active").length || 0) +
                       (productSaleProjects?.filter((p: any) => p.status === "active").length || 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Active
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-400">
                      {(developerCollaborationProjects?.projects?.filter(
                        (p) => p.status === "completed"
                      ).length || 0) + 
                       (ideaSaleProjects?.filter((p: any) => p.status === "sold" || p.status === "completed").length || 0) +
                       (productSaleProjects?.filter((p: any) => p.status === "sold" || p.status === "completed").length || 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Completed/Sold
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Activity History Section */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6 max-w-full overflow-hidden">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
              {isPublisher ? "Purchase History" : "All Projects"}
            </h3>

            {isPublisher ? (
              // Publisher Purchase History
              purchaseActivity?.activities?.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {purchaseActivity.activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors gap-3 max-w-full overflow-hidden"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="text-indigo-400 text-lg sm:text-xl">
                            <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm sm:text-base truncate">
                            {activity.projectTitle}
                          </div>
                          <div className="text-gray-400 text-xs sm:text-sm">
                            {activity.projectType} • {activity.status}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Seller: {activity.seller?.firstName || ""}{" "}
                            {activity.seller?.lastName || ""}
                            {(!activity.seller?.firstName && !activity.seller?.lastName) && 
                              (activity.seller?.email || "Unknown")}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-green-400 font-medium text-base sm:text-lg">
                          {formatCurrency(activity.amount)}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          {formatDate(activity.purchaseDate)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-2 mt-4 sm:mt-6">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-gray-400 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">
                    <ShoppingCartIcon className="w-16 h-16 mx-auto text-blue-400" />
                  </div>
                  <p className="text-gray-400">No purchase history</p>
                  <p className="text-gray-500 text-sm">
                    Your purchases will appear here
                  </p>
                </div>
              )
            ) : // Creator All Projects (Collaboration + Idea Sale + Product Sale)
            (() => {
              // Combine all projects into a unified format
              const allProjects: Array<{
                id: string;
                projectTitle: string;
                projectType: string;
                projectStatus: string;
                amount: number;
                date: string;
                status: string;
                type: 'collaboration' | 'idea_sale' | 'product_sale';
                buyerName?: string;
                buyerEmail?: string;
              }> = [];

              // Add collaboration projects
              developerCollaborationProjects?.projects?.forEach((project) => {
                allProjects.push({
                  id: project.collaborationId || project.projectId || '',
                  projectTitle: project.projectTitle,
                  projectType: project.projectType,
                  projectStatus: project.projectStatus,
                  amount: project.budget || 0,
                  date: project.createdAt,
                  status: project.status,
                  type: 'collaboration',
                  buyerName: project.publisherName,
                  buyerEmail: project.publisherEmail,
                });
              });

              // Add idea sale projects
              ideaSaleProjects.forEach((project: any) => {
                const buyer = project.buyer || project.purchaser || {};
                allProjects.push({
                  id: project._id || project.id || '',
                  projectTitle: project.title || 'Unknown Project',
                  projectType: 'IDEA_SALE',
                  projectStatus: project.status || 'sold',
                  amount: project.ideaSaleData?.askingPrice || project.soldPrice || 0,
                  date: project.soldAt || project.createdAt || '',
                  status: project.status === 'sold' ? 'completed' : project.status,
                  type: 'idea_sale',
                  buyerName: buyer.firstName && buyer.lastName 
                    ? `${buyer.firstName} ${buyer.lastName}`.trim()
                    : buyer.email || 'Unknown Buyer',
                  buyerEmail: buyer.email,
                });
              });

              // Add product sale projects
              productSaleProjects.forEach((project: any) => {
                const buyer = project.buyer || project.purchaser || {};
                allProjects.push({
                  id: project._id || project.id || '',
                  projectTitle: project.title || 'Unknown Project',
                  projectType: 'PRODUCT_SALE',
                  projectStatus: project.status || 'sold',
                  amount: project.productSaleData?.askingPrice || project.soldPrice || 0,
                  date: project.soldAt || project.createdAt || '',
                  status: project.status === 'sold' ? 'completed' : project.status,
                  type: 'product_sale',
                  buyerName: buyer.firstName && buyer.lastName 
                    ? `${buyer.firstName} ${buyer.lastName}`.trim()
                    : buyer.email || 'Unknown Buyer',
                  buyerEmail: buyer.email,
                });
              });

              // Sort by date (newest first)
              allProjects.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );

              // Paginate
              const itemsPerPage = 10;
              const startIndex = (currentPage - 1) * itemsPerPage;
              const paginatedProjects = allProjects.slice(startIndex, startIndex + itemsPerPage);
              const totalPagesForAll = Math.max(1, Math.ceil(allProjects.length / itemsPerPage));

              return paginatedProjects.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {paginatedProjects.map((project, index) => {
                    // Get icon and color based on project type
                    const getProjectIcon = () => {
                      switch (project.type) {
                        case 'collaboration':
                          return '🤝';
                        case 'idea_sale':
                          return '💡';
                        case 'product_sale':
                          return '📦';
                        default:
                          return '📁';
                      }
                    };

                    const getProjectBgColor = () => {
                      switch (project.type) {
                        case 'collaboration':
                          return 'bg-green-500/20';
                        case 'idea_sale':
                          return 'bg-yellow-500/20';
                        case 'product_sale':
                          return 'bg-blue-500/20';
                        default:
                          return 'bg-gray-500/20';
                      }
                    };

                    return (
                      <div
                        key={project.id || index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors gap-3 max-w-full overflow-hidden"
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${getProjectBgColor()} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <div className="text-lg sm:text-xl">
                              {getProjectIcon()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm sm:text-base truncate">
                              {project.projectTitle}
                            </div>
                            <div className="text-gray-400 text-xs sm:text-sm">
                              {project.projectType} • {project.projectStatus}
                            </div>
                            {project.type === 'collaboration' ? (
                              <div className="text-gray-500 text-xs">
                                Publisher: {project.buyerName}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-xs">
                                Buyer: {project.buyerName}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-green-400 font-medium text-base sm:text-lg">
                            {formatCurrency(project.amount)}
                          </div>
                          <div className="text-gray-400 text-xs sm:text-sm">
                            {formatDate(project.date)}
                          </div>
                          <div
                            className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                              project.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : project.status === "completed" || project.status === "sold"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {project.status === 'sold' ? 'sold' : project.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {totalPagesForAll > 1 && (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-2 mt-4 sm:mt-6">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-gray-400 text-sm">
                        Page {currentPage} of {totalPagesForAll}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPagesForAll, currentPage + 1))
                        }
                        disabled={currentPage === totalPagesForAll}
                        className="px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-gray-400">No projects found</p>
                  <p className="text-gray-500 text-sm">
                    Your projects will appear here
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Milestones Section */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6 max-w-full overflow-hidden">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
              Milestones
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {isPublisher ? (
                // Publisher milestones
                <>
                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg max-w-full overflow-hidden">
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      <TargetIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm sm:text-base">
                        First Purchase
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Make your first game project purchase
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          (purchaseActivity?.total || 0) > 0
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg max-w-full overflow-hidden">
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      <RocketLaunchIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm sm:text-base">
                        First Collaboration
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Start your first development collaboration
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          (purchaseActivity?.activities?.filter(
                            (a) => a.projectType === "DEV_COLLABORATION"
                          ).length || 0) > 0
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg max-w-full overflow-hidden">
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      <SparklesIcon className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm sm:text-base">
                        Big Spender
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Spend over $10,000 on projects
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          (purchaseActivity?.activities?.reduce(
                            (sum, activity) => sum + activity.amount,
                            0
                          ) || 0) > 10000
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                // Creator milestones
                <>
                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg max-w-full overflow-hidden">
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      <TargetIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm sm:text-base">
                        First Collaboration
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Complete your first collaboration project
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          (developerCollaborationProjects?.totalProjects || 0) >
                          0
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg max-w-full overflow-hidden">
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      <RocketLaunchIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm sm:text-base">
                        Active Creator
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Have 3 or more active collaborations
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          (developerCollaborationProjects?.projects?.filter(
                            (p) => p.status === "active"
                          ).length || 0) >= 3
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-700/50 rounded-lg max-w-full overflow-hidden">
                    <div className="text-xl sm:text-2xl flex-shrink-0">
                      <SparklesIcon className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm sm:text-base">
                        Top Performer
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        Complete 5 or more projects
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          (developerCollaborationProjects?.projects?.filter(
                            (p) => p.status === "completed"
                          ).length || 0) >= 5
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                      ></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryTab;
