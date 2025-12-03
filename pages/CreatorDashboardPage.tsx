import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, GameProject, GameProjectFilters } from "../types";
import { apiService } from "../services/api";
import DashboardNavbar from "../components/DashboardNavbar";
import {
  getNavigationItems,
  getDefaultRightIcons,
} from "../utils/navbarConfig";

interface CreatorDashboardPageProps {
  user: User;
  onLogout: () => void;
}

const CreatorDashboardPage: React.FC<CreatorDashboardPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [failedAppIcons, setFailedAppIcons] = useState<Set<string>>(new Set());

  const filters = ["All", "Published", "Draft", "Collaboration"];

  // Get navigation items with active state based on current path
  const navigationItems = getNavigationItems(user?.role, location.pathname);
  const rightIcons = getDefaultRightIcons();

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams: GameProjectFilters = {
        page: 1,
        limit: 100,
      };

      // Apply filter based on activeFilter
      if (activeFilter === "Published") {
        filterParams.status = "published";
      } else if (activeFilter === "Draft") {
        filterParams.status = "draft";
      } else if (activeFilter === "Collaboration") {
        filterParams.status = "in_collaboration";
      }

      // Apply search query if exists
      if (searchQuery) {
        filterParams.search = searchQuery;
      }

      const response = await apiService.getMyProjects(filterParams);
      setProjects(response.projects || []);
      // Reset failed app icons when projects change
      setFailedAppIcons(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    const formatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    // Format: "Apr 8,2025" (no space after comma)
    return formatted.replace(", ", ",");
  };

  const getVisibility = (status: string): string => {
    return status === "published" ? "Public" : "Unpublished";
  };

  const getMonetizationStatus = (
    project: GameProject
  ): { text: string; isOn: boolean } => {
    // Check if productSalePrice or creatorCollaborationBudget > 0
    const hasMonetization =
      (project.productSalePrice !== undefined &&
        project.productSalePrice > 0) ||
      (project.creatorCollaborationBudget !== undefined &&
        project.creatorCollaborationBudget > 0);
    return {
      text: hasMonetization ? "$ On" : "$ Off",
      isOn: hasMonetization,
    };
  };

  const getSoldCount = (project: GameProject): number => {
    // If project is sold, return 1, otherwise 0
    // You might want to track actual sales count differently
    return project.status === "sold" ? 1 : 0;
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        navigationItems={navigationItems}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        rightIcons={rightIcons}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
        {/* Title and Filters */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center bg-gray-200 rounded-full p-1">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full ${
                    activeFilter === filter
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-full bg-gray-200 transition-colors"
              title={
                viewMode === "list"
                  ? "Switch to Grid View"
                  : "Switch to List View"
              }
            >
              {viewMode === "list" ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                    stroke="#757575"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 9H21M9 21V9"
                    stroke="#757575"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 25 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clip-rule="evenodd"
                    d="M0 1.36364C0 1.00198 0.143668 0.655132 0.3994 0.3994C0.655131 0.143669 1.00198 0 1.36364 0H23.1818C23.5435 0 23.8903 0.143669 24.1461 0.3994C24.4018 0.655132 24.5455 1.00198 24.5455 1.36364C24.5455 1.7253 24.4018 2.07214 24.1461 2.32787C23.8903 2.5836 23.5435 2.72727 23.1818 2.72727H1.36364C1.00198 2.72727 0.655131 2.5836 0.3994 2.32787C0.143668 2.07214 0 1.7253 0 1.36364ZM2.72727 7.5C2.72727 7.13834 2.87094 6.7915 3.12667 6.53576C3.3824 6.28003 3.72925 6.13636 4.09091 6.13636H20.4545C20.8162 6.13636 21.1631 6.28003 21.4188 6.53576C21.6745 6.7915 21.8182 7.13834 21.8182 7.5C21.8182 7.86166 21.6745 8.2085 21.4188 8.46424C21.1631 8.71997 20.8162 8.86364 20.4545 8.86364H4.09091C3.72925 8.86364 3.3824 8.71997 3.12667 8.46424C2.87094 8.2085 2.72727 7.86166 2.72727 7.5ZM6.81818 13.6364C6.81818 13.2747 6.96185 12.9279 7.21758 12.6721C7.47331 12.4164 7.82016 12.2727 8.18182 12.2727H16.3636C16.7253 12.2727 17.0721 12.4164 17.3279 12.6721C17.5836 12.9279 17.7273 13.2747 17.7273 13.6364C17.7273 13.998 17.5836 14.3449 17.3279 14.6006C17.0721 14.8563 16.7253 15 16.3636 15H8.18182C7.82016 15 7.47331 14.8563 7.21758 14.6006C6.96185 14.3449 6.81818 13.998 6.81818 13.6364Z"
                    fill="#757575"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Projects Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading projects...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-500">Error: {error}</div>
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Monetization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Comments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Likes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Sold
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No projects found
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => {
                      const monetization = getMonetizationStatus(project);
                      return (
                        <tr key={project._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                                {project.thumbnail ? (
                                  <img
                                    src={project.thumbnail}
                                    alt={project.title}
                                    className="w-full h-full object-cover rounded"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-300 rounded" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {project.title}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {project.shortDescription || "No description"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {getVisibility(project.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-sm font-medium ${
                                monetization.isOn
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {monetization.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {formatDate(
                                project.publishedAt || project.createdAt
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {project.viewCount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {project.reviewCount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {project.likeCount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {getSoldCount(project)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-gray-500">No projects found</div>
              </div>
            ) : (
              projects.map((project) => {
                console.log(project);
                return (
                  <div
                    key={project._id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative aspect-square flex flex-col"
                  >
                    {/* Thumbnail Section */}
                    <div className="relative w-full flex-[0.6] bg-gray-200 overflow-hidden min-h-0 flex-shrink-0">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-cover block"
                          style={{
                            objectPosition: "center",
                            minWidth: 0,
                            minHeight: 0,
                          }}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300" />
                      )}
                      {/* Edit Icon */}
                      <button
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add edit functionality here
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 18C0.716667 18 0.479333 17.904 0.288 17.712C0.0966668 17.52 0.000666667 17.2827 0 17V14.575C0 14.3083 0.0500001 14.054 0.15 13.812C0.25 13.57 0.391667 13.3577 0.575 13.175L13.2 0.575C13.4 0.391667 13.621 0.25 13.863 0.15C14.105 0.0500001 14.359 0 14.625 0C14.891 0 15.1493 0.0500001 15.4 0.15C15.6507 0.25 15.8673 0.4 16.05 0.6L17.425 2C17.625 2.18333 17.7707 2.4 17.862 2.65C17.9533 2.9 17.9993 3.15 18 3.4C18 3.66667 17.954 3.921 17.862 4.163C17.77 4.405 17.6243 4.62567 17.425 4.825L4.825 17.425C4.64167 17.6083 4.429 17.75 4.187 17.85C3.945 17.95 3.691 18 3.425 18H1ZM14.6 4.8L16 3.4L14.6 2L13.2 3.4L14.6 4.8Z"
                            fill="black"
                          />
                        </svg>
                      </button>
                    </div>
                    {/* Content Section */}
                    <div className="p-4 bg-white flex-[0.4] flex justify-between  w-full">
                      <div className="w-full">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate min-h-[1.25rem]">
                          {project.title || "Untitled Project"}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem]">
                          {project.shortDescription || "No description"}
                        </p>
                      </div>
                      {/* User Profile Icon */}
                      <div className="w-full" style={{ display: "contents" }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center mt-1 overflow-hidden">
                          {project.appIcon &&
                          !failedAppIcons.has(project._id) ? (
                            <img
                              src={project.appIcon}
                              alt={project.title}
                              className="w-full h-full object-cover rounded-full"
                              onError={() => {
                                // If image fails to load, mark it as failed
                                setFailedAppIcons((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.add(project._id);
                                  return newSet;
                                });
                              }}
                            />
                          ) : (
                            <svg
                              width="33"
                              height="33"
                              viewBox="0 0 33 33"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ transform: "scale(1.25)" }}
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M32.5 16.25C32.5 25.2249 25.2249 32.5 16.25 32.5C7.27513 32.5 0 25.2249 0 16.25C0 7.27513 7.27513 0 16.25 0C25.2249 0 32.5 7.27513 32.5 16.25ZM21.125 11.375C21.125 12.6679 20.6114 13.9079 19.6971 14.8221C18.7829 15.7364 17.5429 16.25 16.25 16.25C14.9571 16.25 13.7171 15.7364 12.8029 14.8221C11.8886 13.9079 11.375 12.6679 11.375 11.375C11.375 10.0821 11.8886 8.8421 12.8029 7.92786C13.7171 7.01362 14.9571 6.5 16.25 6.5C17.5429 6.5 18.7829 7.01362 19.6971 7.92786C20.6114 8.8421 21.125 10.0821 21.125 11.375ZM16.25 30.0625C19.0389 30.067 21.7633 29.2231 24.0614 27.6429C25.0429 26.9685 25.4621 25.6848 24.8901 24.6399C23.7088 22.4738 21.2713 21.125 16.25 21.125C11.2288 21.125 8.79125 22.4738 7.60825 24.6399C7.03788 25.6848 7.45713 26.9685 8.43863 27.6429C10.7367 29.2231 13.4611 30.067 16.25 30.0625Z"
                                fill="#1C8EF9"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboardPage;
