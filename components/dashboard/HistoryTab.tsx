import React, { useState, useEffect } from "react";
import { analyticsService } from "../../services/analyticsService";
import {
  AnalyticsFilters,
  PurchaseActivity,
} from "../../services/analyticsService";
import { DeveloperCollaborationProjects } from "../../types";
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
        // Fetch purchase activity for publishers
        const activityData = await analyticsService
          .getPurchaseActivity(filters)
          .catch(() => null);

        if (activityData) {
          setPurchaseActivity(activityData);
          setTotalPages(activityData.totalPages);
        } else {
          // Set demo data for publishers
          setPurchaseActivity({
            activities: [
              {
                id: "1",
                projectTitle: "Mobile Game Development",
                amount: 5000,
                purchaseDate: "2024-01-15",
                projectType: "GAME",
                status: "completed",
                seller: {
                  firstName: "John",
                  lastName: "Doe",
                  email: "john@example.com",
                },
              },
              {
                id: "2",
                projectTitle: "Web Application",
                amount: 3000,
                purchaseDate: "2024-01-10",
                projectType: "WEB_APP",
                status: "completed",
                seller: {
                  firstName: "Jane",
                  lastName: "Smith",
                  email: "jane@example.com",
                },
              },
            ],
            total: 2,
            totalPages: 1,
            currentPage: 1,
          });
          setTotalPages(1);
        }
      } else {
        // Fetch collaboration projects for developers
        const collaborationData = await analyticsService
          .getDeveloperCollaborationProjects(filters)
          .catch(() => null);

        if (collaborationData) {
          setDeveloperCollaborationProjects(collaborationData);
        } else {
          // Set demo data for developers
          setDeveloperCollaborationProjects({
            projects: [
              {
                id: "1",
                projectTitle: "E-commerce Platform",
                status: "active",
                createdAt: "2024-01-15",
                budget: 5000,
                projectType: "WEB_APP",
                projectStatus: "in_progress",
                publisherName: "Alice Johnson",
                publisher: {
                  firstName: "Alice",
                  lastName: "Johnson",
                  email: "alice@example.com",
                },
              },
              {
                id: "2",
                projectTitle: "Mobile App Development",
                status: "completed",
                createdAt: "2024-01-10",
                budget: 3000,
                projectType: "MOBILE_APP",
                projectStatus: "completed",
                publisherName: "Bob Wilson",
                publisher: {
                  firstName: "Bob",
                  lastName: "Wilson",
                  email: "bob@example.com",
                },
              },
            ],
            totalProjects: 2,
            activeProjects: 1,
            completedProjects: 1,
          });
        }
      }
    } catch (err) {
      // Set a user-friendly error message
      setError("History API is not available yet. Using demo data for now.");
      console.warn("History API not available, using fallback data:", err);

      // Set demo data for development
      if (isPublisher) {
        setPurchaseActivity({
          activities: [
            {
              id: "1",
              projectTitle: "Mobile Game Development",
              amount: 5000,
              purchaseDate: "2024-01-15",
              projectType: "GAME",
              status: "completed",
              seller: {
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
              },
            },
            {
              id: "2",
              projectTitle: "Web Application",
              amount: 3000,
              purchaseDate: "2024-01-10",
              projectType: "WEB_APP",
              status: "completed",
              seller: {
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
              },
            },
          ],
          total: 2,
          totalPages: 1,
          currentPage: 1,
        });
        setTotalPages(1);
      } else {
        setDeveloperCollaborationProjects({
          projects: [
            {
              id: "1",
              projectTitle: "E-commerce Platform",
              status: "active",
              createdAt: "2024-01-15",
              budget: 5000,
              projectType: "WEB_APP",
              projectStatus: "in_progress",
              publisherName: "Alice Johnson",
              publisher: {
                firstName: "Alice",
                lastName: "Johnson",
                email: "alice@example.com",
              },
            },
            {
              id: "2",
              projectTitle: "Mobile App Development",
              status: "completed",
              createdAt: "2024-01-10",
              budget: 3000,
              projectType: "MOBILE_APP",
              projectStatus: "completed",
              publisherName: "Bob Wilson",
              publisher: {
                firstName: "Bob",
                lastName: "Wilson",
                email: "bob@example.com",
              },
            },
          ],
          totalProjects: 2,
          activeProjects: 1,
          completedProjects: 1,
        });
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
                      {developerCollaborationProjects?.totalProjects || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Total Projects
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-400">
                      {developerCollaborationProjects?.projects?.filter(
                        (p) => p.status === "active"
                      ).length || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Active
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-400">
                      {developerCollaborationProjects?.projects?.filter(
                        (p) => p.status === "completed"
                      ).length || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Completed
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Activity History Section */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6 max-w-full overflow-hidden">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
              {isPublisher ? "Purchase History" : "Collaboration Projects"}
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
                            Seller: {activity.seller.firstName}{" "}
                            {activity.seller.lastName}
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
            ) : // Creator Collaboration Projects
            developerCollaborationProjects?.projects?.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {developerCollaborationProjects.projects.map(
                  (project, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors gap-3 max-w-full overflow-hidden"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="text-green-400 text-lg sm:text-xl">
                            🤝
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm sm:text-base truncate">
                            {project.projectTitle}
                          </div>
                          <div className="text-gray-400 text-xs sm:text-sm">
                            {project.projectType} • {project.projectStatus}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Publisher: {project.publisherName}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-green-400 font-medium text-base sm:text-lg">
                          {formatCurrency(project.budget)}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          {formatDate(project.createdAt)}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full mt-1 ${
                            project.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : project.status === "completed"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {project.status}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🤝</div>
                <p className="text-gray-400">No collaboration projects</p>
                <p className="text-gray-500 text-sm">
                  Your collaboration projects will appear here
                </p>
              </div>
            )}
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
