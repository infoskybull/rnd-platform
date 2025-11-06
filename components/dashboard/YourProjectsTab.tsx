import React, { useMemo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameProject, ProjectType, ProjectStatus } from "../../types";
import { gsap } from "gsap";
import { getProjectBanner, handleBannerError } from "../../utils/projectUtils";
import {
  DocumentTextIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  WarningIcon,
  InfoIcon,
  HeartIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LightBulbIcon,
  EyeIcon,
  GamepadIcon,
} from "../icons/Icons";

interface YourProjectsTabProps {
  projects: GameProject[];
  loading: boolean;
  error: string | null;
  stats: any;
  filters: any;
  totalPages: number;
  total: number;
  selectedProject: GameProject | null;
  setSelectedProject: (project: GameProject | null) => void;
  handleFilterChange: (filters: any) => void;
  handlePageChange: (page: number) => void;
  handlePublish: (projectId: string) => void;
  handleUnpublish: (projectId: string) => void;
  handleViewProject: (projectId: string) => void;
  handleDelete: (projectId: string) => void;
}

const YourProjectsTab: React.FC<YourProjectsTabProps> = ({
  projects,
  loading,
  error,
  stats,
  filters,
  totalPages,
  total,
  selectedProject,
  setSelectedProject,
  handleFilterChange,
  handlePageChange,
  handlePublish,
  handleUnpublish,
  handleViewProject,
  handleDelete,
}) => {
  const navigate = useNavigate();
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Memoize filtered stats to prevent unnecessary recalculations
  const fallbackStats = useMemo(() => {
    if (projects.length === 0 && total === 0) return null;

    return {
      totalProjects: total, // Use total from API response for accurate count
      publishedProjects: projects.filter((p) => p.status === "published")
        .length,
      soldProjects: projects.filter((p) => p.status === "sold").length,
      totalRevenue: 0,
    };
  }, [projects, total]);
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getProjectTypeLabel = (type: ProjectType) => {
    switch (type) {
      case "idea_sale":
        return "Idea Sale";
      case "product_sale":
        return "Product Sale";
      case "dev_collaboration":
        return "Dev Collaboration";
      default:
        return type;
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "published":
        return "bg-green-100 text-green-800";
      case "sold":
        return "bg-blue-100 text-blue-800";
      case "in_collaboration":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case "draft":
        return <DocumentTextIcon className="w-5 h-5 text-blue-400" />;
      case "published":
        return <SparklesIcon className="w-5 h-5 text-green-400" />;
      case "sold":
        return <CurrencyDollarIcon className="w-5 h-5 text-green-400" />;
      case "in_collaboration":
        return <SparklesIcon className="w-5 h-5 text-blue-400" />;
      case "completed":
        return <SparklesIcon className="w-5 h-5 text-yellow-400" />;
      case "cancelled":
        return <WarningIcon className="w-5 h-5 text-red-400" />;
      default:
        return <InfoIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  // GSAP animations for project cards
  useEffect(() => {
    if (projects.length > 0 && !loading) {
      // Animate cards entrance
      gsap.fromTo(
        cardRefs.current.filter(Boolean),
        {
          y: 50,
          opacity: 0,
          scale: 0.9,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
        }
      );

      // Add subtle pulse animation to status indicators
      gsap.to(".status-indicator", {
        scale: 1.1,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        stagger: 0.2,
        ease: "power2.inOut",
        delay: 0.8,
      });
    }
  }, [projects, loading]);

  // Hover animations for cards
  const handleCardHover = (index: number, isHovering: boolean) => {
    const card = cardRefs.current[index];
    if (!card) return;

    if (isHovering) {
      gsap.to(card, {
        y: -8,
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Project Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Projects</h2>
          <p className="text-gray-400">Manage and track your game projects</p>
        </div>
        <button
          onClick={() => navigate("/create-project")}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span className="hidden sm:inline">Create Project</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4">
          <div className="text-2xl font-bold text-indigo-400">
            {stats?.totalProjects ||
              fallbackStats?.totalProjects ||
              total ||
              projects.length}
          </div>
          <div className="text-sm text-gray-400">Total Projects</div>
        </div>
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4">
          <div className="text-2xl font-bold text-green-400">
            {stats?.publishedProjects || fallbackStats?.publishedProjects || 0}
          </div>
          <div className="text-sm text-gray-400">Published</div>
        </div>
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4">
          <div className="text-2xl font-bold text-blue-400">
            {stats?.soldProjects || fallbackStats?.soldProjects || 0}
          </div>
          <div className="text-sm text-gray-400">Sold</div>
        </div>
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4">
          <div className="text-2xl font-bold text-purple-400">
            {formatPrice(
              stats?.totalRevenue || fallbackStats?.totalRevenue || 0
            )}
          </div>
          <div className="text-sm text-gray-400">Total Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Filter Your Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Type
            </label>
            <select
              value={filters.projectType || ""}
              onChange={(e) =>
                handleFilterChange({
                  projectType: (e.target.value as ProjectType) || undefined,
                })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="idea_sale">Idea Sale</option>
              <option value="product_sale">Product Sale</option>
              <option value="dev_collaboration">Dev Collaboration</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) =>
                handleFilterChange({
                  status: (e.target.value as ProjectStatus) || undefined,
                })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="sold">Sold</option>
              <option value="in_collaboration">In Collaboration</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy || "createdAt"}
              onChange={(e) =>
                handleFilterChange({ sortBy: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="createdAt">Created Date</option>
              <option value="publishedAt">Published Date</option>
              <option value="viewCount">Views</option>
              <option value="likeCount">Likes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Order
            </label>
            <select
              value={filters.sortOrder || "desc"}
              onChange={(e) =>
                handleFilterChange({
                  sortOrder: e.target.value as "asc" | "desc",
                })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div
            ref={cardsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6"
          >
            {projects.map((project, index) => (
              <div
                key={project._id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md hover:shadow-xl cursor-pointer overflow-hidden transform-gpu transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => setSelectedProject(project)}
                onMouseEnter={() => handleCardHover(index, true)}
                onMouseLeave={() => handleCardHover(index, false)}
              >
                {project.thumbnail && (
                  <div className="w-full h-32 sm:h-40 lg:h-48 overflow-hidden">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                      onMouseEnter={(e) => {
                        gsap.to(e.target, {
                          scale: 1.1,
                          duration: 0.3,
                          ease: "power2.out",
                        });
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.target, {
                          scale: 1,
                          duration: 0.3,
                          ease: "power2.out",
                        });
                      }}
                    />
                  </div>
                )}
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 sm:mb-3 gap-2">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white truncate flex-1">
                      {project.title}
                    </h3>
                    <div className="flex items-center justify-between sm:justify-end space-x-2">
                      <span className="text-sm sm:text-lg status-indicator">
                        {getStatusIcon(project.status)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium status-indicator ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                    {project.shortDescription}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 gap-1 sm:gap-0">
                    <span className="text-xs text-indigo-400 font-medium">
                      {getProjectTypeLabel(project.projectType)}
                    </span>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-4 h-4 text-blue-400" />
                        {project.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <HeartIcon className="w-4 h-4 text-red-400" />
                        {project.likeCount}
                      </span>
                    </div>
                  </div>

                  {project.ideaSaleData && (
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-green-400 mb-1">
                      {formatPrice(project.ideaSaleData.askingPrice)}
                    </div>
                  )}

                  {project.productSaleData && (
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-blue-400 mb-1">
                      {formatPrice(project.productSaleData.askingPrice)}
                    </div>
                  )}

                  {project.devCollaborationData && (
                    <div className="text-sm sm:text-base lg:text-lg font-bold text-purple-400 mb-1">
                      Budget: {formatPrice(project.devCollaborationData.budget)}
                    </div>
                  )}

                  {(project.ideaSaleData?.gameGenre ||
                    project.productSaleData?.gameGenre ||
                    project.devCollaborationData?.gameGenre) && (
                    <div className="mt-1 sm:mt-2">
                      <span className="text-xs text-gray-500">Genre: </span>
                      <span className="text-xs text-gray-300">
                        {project.ideaSaleData?.gameGenre ||
                          project.productSaleData?.gameGenre ||
                          project.devCollaborationData?.gameGenre}
                      </span>
                    </div>
                  )}

                  <div className="mt-2 sm:mt-3 text-xs text-gray-500">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                <GamepadIcon className="w-16 h-16 mx-auto text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No Projects Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start creating your first game project to get started!
              </p>
              <button
                onClick={() => navigate("/create-project")}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 mx-auto"
              >
                <span className="text-xl">+</span>
                <span className="hidden sm:inline">
                  Create Your First Project
                </span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              {/* Pagination Info */}
              <div className="text-xs sm:text-sm text-gray-400 text-center px-4">
                Showing {((filters.page || 1) - 1) * (filters.limit || 10) + 1}{" "}
                to{" "}
                {Math.min((filters.page || 1) * (filters.limit || 10), total)}{" "}
                of {total} projects
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto max-w-full px-4">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={filters.page === 1}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="First page"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>

                {/* Page Numbers with Smart Display */}
                {(() => {
                  const currentPage = filters.page || 1;
                  const maxVisiblePages = 7;
                  const pages = [];

                  if (totalPages <= maxVisiblePages) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Smart pagination for large page counts
                    if (currentPage <= 4) {
                      // Show first pages + ellipsis + last page
                      for (let i = 1; i <= 5; i++) pages.push(i);
                      pages.push("...");
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      // Show first page + ellipsis + last pages
                      pages.push(1);
                      pages.push("...");
                      for (let i = totalPages - 4; i <= totalPages; i++)
                        pages.push(i);
                    } else {
                      // Show first + ellipsis + current range + ellipsis + last
                      pages.push(1);
                      pages.push("...");
                      for (let i = currentPage - 1; i <= currentPage + 1; i++)
                        pages.push(i);
                      pages.push("...");
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-3 py-2 text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg flex-shrink-0 ${
                          filters.page === page
                            ? "bg-indigo-600 text-white"
                            : "text-gray-300 bg-gray-700 hover:bg-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  );
                })()}

                <button
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === totalPages}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                </button>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={filters.page === totalPages}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Last page"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-gray-400">Show:</span>
                <select
                  value={filters.limit || 10}
                  onChange={(e) =>
                    handleFilterChange({ limit: parseInt(e.target.value) })
                  }
                  className="px-2 py-1 text-xs sm:text-sm bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                </select>
              </div>

              {/* Keyboard Shortcuts Hint */}
              <div className="text-xs text-gray-500 text-center px-4">
                <span className="hidden sm:inline">
                  <LightBulbIcon className="w-4 h-4 text-yellow-400 inline mr-1" />{" "}
                  Use Ctrl+←/→ for prev/next, Ctrl+Home/End for first/last page
                </span>
                <span className="sm:hidden">
                  <LightBulbIcon className="w-4 h-4 text-yellow-400 inline mr-1" />{" "}
                  Swipe or tap to navigate
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default YourProjectsTab;
