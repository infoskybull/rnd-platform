import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, GameProject } from "../types";
import DashboardNavbar from "../components/DashboardNavbar";
import RnDLogo from "../components/icons/RnDLogo";
import {
  getNavigationItems,
  getDefaultRightIcons,
} from "../utils/navbarConfig";
import { usePublisherDashboard } from "../hooks/usePublisherDashboard";

interface PublisherDashboardPageProps {
  user: User;
  onLogout: () => void;
}

const PublisherDashboardPage: React.FC<PublisherDashboardPageProps> = ({
  user,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [failedAppIcons, setFailedAppIcons] = useState<Set<string>>(new Set());

  const filters = ["All", "Viewed", "Offering", "Completed", "Collaboration"];

  // Get navigation items with active state based on current path
  const navigationItems = getNavigationItems(user?.role, location.pathname);
  const rightIcons = getDefaultRightIcons();

  // Fetch dashboard data
  const {
    payToViewProjects,
    purchasedProjects,
    inCollaborationProjects,
    allProjects,
    loading,
    error,
    refresh,
  } = usePublisherDashboard(user);

  // Filter projects based on active filter and search query
  const filteredProjects = useMemo(() => {
    let projects: GameProject[] = [];

    // Filter by category
    switch (activeFilter) {
      case "Viewed":
        projects = payToViewProjects;
        break;
      case "Offering":
        // Projects that are purchased but not yet completed
        // This could mean projects that are in progress or available for collaboration
        projects = purchasedProjects.filter(
          (p) =>
            p.status !== "completed" &&
            !inCollaborationProjects.some((collab) => collab._id === p._id)
        );
        break;
      case "Completed":
        // Completed purchased projects
        projects = purchasedProjects.filter(
          (p) => p.status === "completed" || p.soldAt
        );
        break;
      case "Collaboration":
        projects = inCollaborationProjects;
        break;
      case "All":
      default:
        projects = allProjects;
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      projects = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.shortDescription?.toLowerCase().includes(query)
      );
    }

    return projects;
  }, [
    activeFilter,
    searchQuery,
    payToViewProjects,
    purchasedProjects,
    inCollaborationProjects,
    allProjects,
  ]);

  // Handle project click
  const handleProjectClick = (project: GameProject) => {
    navigate(`/prototype-detail/${project._id}`);
  };

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

  const getProjectStatus = (project: GameProject): string => {
    if (inCollaborationProjects.some((p) => p._id === project._id)) {
      return "Collaboration";
    }
    if (payToViewProjects.some((p) => p._id === project._id)) {
      return "Viewed";
    }
    if (purchasedProjects.some((p) => p._id === project._id)) {
      if (project.status === "completed" || project.soldAt) {
        return "Completed";
      }
      return "Offering";
    }
    return "Unknown";
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
        logo={<RnDLogo size={40} />}
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
                      ? "bg-blue-600 text-white shadow-sm"
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
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01"
                    stroke="#757575"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
            <button
              onClick={refresh}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Try again
            </button>
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
                      Status
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No projects found
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => {
                      const status = getProjectStatus(project);
                      return (
                        <tr
                          key={project._id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleProjectClick(project)}
                        >
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
                              {status}
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
            {filteredProjects.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-gray-500">No projects found</div>
              </div>
            ) : (
              filteredProjects.map((project) => {
                const status = getProjectStatus(project);
                return (
                  <div
                    key={project._id}
                    onClick={() => handleProjectClick(project)}
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
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            status === "Collaboration"
                              ? "bg-green-500 text-white"
                              : status === "Viewed"
                              ? "bg-blue-500 text-white"
                              : status === "Completed"
                              ? "bg-purple-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                    {/* Content Section */}
                    <div className="p-4 bg-white flex-[0.4] flex justify-between w-full">
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

export default PublisherDashboardPage;
