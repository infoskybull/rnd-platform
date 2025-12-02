import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, GameProject, GameProjectFilters } from "../types";
import { apiService } from "../services/api";
import DashboardNavbar from "../components/DashboardNavbar";
import RnDLogo from "../components/icons/RnDLogo";
import {
  getNavigationItems,
  getDefaultRightIcons,
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
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visible tags (1-2 tags) */}
      <div className="flex flex-wrap gap-1 justify-end">
        {visibleTags.map((tag, index) => (
          <span
            key={`visible-${index}`}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700"
          >
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
              }}
            >
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
  const [activeFilter, setActiveFilter] = useState("Community");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(
    new Set()
  );

  const filters = ["Community", "Trending", "Lastest", "Following"];

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
        status: "published", // Only get published projects
      };

      // Apply search query if exists
      if (searchQuery) {
        filterParams.search = searchQuery;
      }

      // Apply filter based on activeFilter (if needed in the future)
      // For now, we'll just use published status

      const response = await apiService.getProjectsForSale(filterParams);
      const projectsData = response.data?.projects || response.projects || [];
      setProjects(projectsData);
      // Reset failed thumbnails when projects change
      setFailedThumbnails(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full bg-gray-200 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
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
                  onClick={() => navigate(`/prototype-detail/${project._id}`)}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative group aspect-square flex flex-col"
                >
                  {/* Image Section - Top 60% */}
                  <div className="relative w-full flex-[0.6] bg-gray-200 overflow-hidden min-h-0 flex-shrink-0">
                    {project.thumbnail && !failedThumbnails.has(project._id) ? (
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
                    {/* View button overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/50 backdrop-blur-sm z-20">
                      <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        View
                      </button>
                    </div>
                  </div>

                  {/* Details Section - Bottom 40% */}
                  <div className="p-4 bg-white flex-[0.4] flex flex-col justify-between w-full min-h-0">
                    <div className="w-full flex-1 min-h-0 flex flex-col">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 min-h-[1.25rem] line-clamp-1 overflow-hidden text-ellipsis">
                        {project.title || "Untitled Project"}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2 overflow-hidden text-ellipsis">
                        {project.shortDescription || "No description"}
                      </p>
                    </div>

                    {/* Views, Likes and Tags */}
                    <div className="border-t border-gray-200 pt-2 mt-auto flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span className="text-sm text-gray-600">
                            {project.viewCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span className="text-sm text-gray-600">
                            {project.likeCount || 0}
                          </span>
                        </div>
                      </div>
                      {/* Tags with GSAP Animation */}
                      {project.tags && project.tags.length > 0 && (
                        <TagsList tags={project.tags} projectId={project._id} />
                      )}
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
