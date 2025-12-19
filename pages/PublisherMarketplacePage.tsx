import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, GameProject, GameProjectFilters } from "../types";
import { apiService } from "../services/api";
import DashboardNavbar from "../components/DashboardNavbar";
import RnDLogo from "../components/icons/RnDLogo";
import {
  getNavigationItems,
  getDefaultRightIcons,
  getMessagesPathForRole,
} from "../utils/navbarConfig";
import { gsap } from "gsap";

interface PublisherMarketplacePageProps {
  user: User;
  onLogout: () => void;
}

interface TagsListProps {
  tags: string[];
  projectId: string;
}

const TagsList: React.FC<TagsListProps> = ({ tags, projectId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const visibleTagsCount = Math.min(2, tags.length);
  const visibleTags = tags.slice(0, visibleTagsCount);
  const hiddenTags = tags.slice(visibleTagsCount);

  useEffect(() => {
    if (!containerRef.current) return;

    const hiddenElements = containerRef.current.querySelectorAll(".tag-hidden");

    if (isHovered && hiddenElements.length > 0) {
      // Set initial state
      gsap.set(hiddenElements, {
        y: 30,
        opacity: 0,
        display: "inline-flex",
      });

      // Animate tags from bottom to top
      gsap.to(hiddenElements, {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.08,
        ease: "back.out(1.2)",
      });
    } else if (!isHovered && hiddenElements.length > 0) {
      // Animate tags back down
      gsap.to(hiddenElements, {
        y: 30,
        opacity: 0,
        duration: 0.25,
        stagger: 0.04,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(hiddenElements, { display: "none" });
        },
      });
    }
  }, [isHovered]);

  if (tags.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-end gap-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/* Visible tags (1-2 tags) */}
      <div className="flex flex-wrap gap-1 justify-end">
        {visibleTags.map((tag, index) => (
          <span
            key={`visible-${index}`}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
            {tag}
          </span>
        ))}
        {/* Indicator for additional tags - hidden when hovering */}
        {hiddenTags.length > 0 && !isHovered && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 cursor-pointer">
            +{hiddenTags.length}
          </span>
        )}
      </div>
      {/* Hidden tags that appear on hover - displayed from bottom to top */}
      {hiddenTags.length > 0 && (
        <div className="flex flex-col gap-1 items-end">
          {hiddenTags.map((tag, index) => (
            <span
              key={`hidden-${index}`}
              className="tag-hidden inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700"
              style={{
                display: "none",
                transform: "translateY(30px)",
                opacity: 0,
              }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const PublisherMarketplacePage: React.FC<PublisherMarketplacePageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState("Featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(
    new Set()
  );
  const [failedAppIcons, setFailedAppIcons] = useState<Set<string>>(new Set());

  const filters = ["Featured", "Free to view", "Liked", "Following"];

  // Get navigation items with active state based on current path
  const navigationItems = getNavigationItems(user?.role, location.pathname);
  const rightIcons = getDefaultRightIcons({
    onMessagesClick: () => navigate(getMessagesPathForRole(user?.role)),
  });

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams: GameProjectFilters = {
        page: 1,
        limit: 100,
        status: "published", // Only get published projects
      };

      // Apply search query if exists
      if (searchQuery) {
        filterParams.search = searchQuery;
      }

      // Apply filter based on activeFilter
      let projectsData: GameProject[] = [];

      if (activeFilter === "Following") {
        // Use dedicated following endpoint
        try {
          const followingResponse = await apiService.getFollowingProjects({
            page: 1,
            limit: 100,
            status: "published",
            ...(searchQuery && { search: searchQuery }),
          });
          projectsData =
            followingResponse.projects ||
            followingResponse.data?.projects ||
            [];
        } catch (err) {
          console.error("Failed to load following projects:", err);
          projectsData = [];
        }
      } else {
        // For other filters, use regular getProjectsForSale
        const response = await apiService.getProjectsForSale(filterParams);
        projectsData = response.data?.projects || response.projects || [];

        // Apply client-side filters
        // "Featured" means "All" - show all projects without filtering
        if (activeFilter === "Free to view") {
          projectsData = projectsData.filter(
            (p: GameProject) => p.payToViewAmount === 0
          );
        } else if (activeFilter === "Liked") {
          projectsData = projectsData.filter(
            (p: GameProject) => p.likedBy && p.likedBy.includes(user.id)
          );
        }
      }

      setProjects(projectsData);
      // Reset failed thumbnails and app icons when projects change
      setFailedThumbnails(new Set());
      setFailedAppIcons(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter, user]);

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

  const handleProjectClick = (project: GameProject) => {
    navigate(`/prototype-detail/${project._id}`);
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
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
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
                  }`}>
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
              }>
              {viewMode === "list" ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
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
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 1.36364C0 1.00198 0.143668 0.655132 0.3994 0.3994C0.655131 0.143669 1.00198 0 1.36364 0H23.1818C23.5435 0 23.8903 0.143669 24.1461 0.3994C24.4018 0.655132 24.5455 1.00198 24.5455 1.36364C24.5455 1.7253 24.4018 2.07214 24.1461 2.32787C23.8903 2.5836 23.5435 2.72727 23.1818 2.72727H1.36364C1.00198 2.72727 0.655131 2.5836 0.3994 2.32787C0.143668 2.07214 0 1.7253 0 1.36364ZM2.72727 7.5C2.72727 7.13834 2.87094 6.7915 3.12667 6.53576C3.3824 6.28003 3.72925 6.13636 4.09091 6.13636H20.4545C20.8162 6.13636 21.1631 6.28003 21.4188 6.53576C21.6745 6.7915 21.8182 7.13834 21.8182 7.5C21.8182 7.86166 21.6745 8.2085 21.4188 8.46424C21.1631 8.71997 20.8162 8.86364 20.4545 8.86364H4.09091C3.72925 8.86364 3.3824 8.71997 3.12667 8.46424C2.87094 8.2085 2.72727 7.86166 2.72727 7.5ZM6.81818 13.6364C6.81818 13.2747 6.96185 12.9279 7.21758 12.6721C7.47331 12.4164 7.82016 12.2727 8.18182 12.2727H16.3636C16.7253 12.2727 17.0721 12.4164 17.3279 12.6721C17.5836 12.9279 17.7273 13.2747 17.7273 13.6364C17.7273 13.998 17.5836 14.3449 17.3279 14.6006C17.0721 14.8563 16.7253 15 16.3636 15H8.18182C7.82016 15 7.47331 14.8563 7.21758 14.6006C6.96185 14.3449 6.81818 13.998 6.81818 13.6364Z"
                    fill="#757575"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
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
                      Genre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Platform
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
                  {projects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-500">
                        No projects found
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => {
                      return (
                        <tr
                          key={project._id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleProjectClick(project)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                                {project.thumbnail &&
                                !failedThumbnails.has(project._id) ? (
                                  <img
                                    src={project.thumbnail}
                                    alt={project.title}
                                    className="w-full h-full object-cover rounded"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                      setFailedThumbnails((prev) => {
                                        const newSet = new Set(prev);
                                        newSet.add(project._id);
                                        return newSet;
                                      });
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
                              {project.gameGenre || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {project.targetPlatform || "N/A"}
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
          /* Content Grid - Responsive grid like Creator dashboard */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-gray-500">No projects found</div>
              </div>
            ) : (
              projects.map((project, index) => (
                <div
                  key={project._id}
                  onClick={() => handleProjectClick(project)}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 group relative aspect-square">
                  {/* Thumbnail Section - Takes 100% initially, 50% on hover */}
                  <div className="relative w-full h-full bg-gray-200 overflow-hidden transition-all duration-300 group-hover:h-1/2">
                    {project.thumbnail && !failedThumbnails.has(project._id) ? (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover block transition-all duration-300"
                        style={{
                          objectPosition: "center",
                          minWidth: 0,
                          minHeight: 0,
                        }}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          setFailedThumbnails((prev) => {
                            const newSet = new Set(prev);
                            newSet.add(project._id);
                            return newSet;
                          });
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300" />
                    )}
                    {/* Genre and Platform - Top Right Corner */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                      {project.gameGenre && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 shadow-sm">
                          {project.gameGenre}
                        </span>
                      )}
                      {project.targetPlatform && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 shadow-sm">
                          {project.targetPlatform}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Content Section - Slides up from bottom on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 h-1/2 flex flex-col justify-between">
                    <div className="w-full flex-1 min-h-0">
                      {/* Title and Avatar - Horizontal Layout */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate flex-1 min-h-[1.25rem]">
                          {project.title || "Untitled Project"}
                        </h3>
                        {/* User Profile Icon - Next to title */}
                        <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden bg-blue-500 flex-shrink-0">
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
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      {/* Categories/Tags */}
                      <p className="text-xs text-gray-500 mb-2">
                        {[project.gameGenre, project.targetPlatform]
                          .filter(Boolean)
                          .join(", ") || "N/A"}
                      </p>
                      {/* Package Sale Features */}
                      <div className="space-y-1">
                        {/* Free to view */}
                        {(project.payToViewAmount === 0 ||
                          !project.payToViewAmount) && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-2.5 h-2.5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <span className="text-xs text-gray-600">
                              Free to view
                            </span>
                          </div>
                        )}
                        {/* You can buy it */}
                        {(project.productSalePrice ||
                          project.productSaleData?.askingPrice) && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-2.5 h-2.5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <span className="text-xs text-gray-600">
                              You can buy it
                            </span>
                          </div>
                        )}
                        {/* Open to collab */}
                        {(project.creatorCollaborationBudget ||
                          project.creatorCollaborationData?.budget) && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-2.5 h-2.5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <span className="text-xs text-gray-600">
                              Open to collab
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublisherMarketplacePage;
