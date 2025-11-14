import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import {
  GameProject,
  GameProjectFilters,
  ProjectType,
  ProjectStatus,
} from "../types";
import { apiService } from "../services/api";
import { User } from "../types";
import RnDLogo from "./icons/RnDLogo";
import RoleBadge from "./RoleBadge";
import Sidebar, { TabType } from "./Sidebar";
import InventoryTab from "./dashboard/InventoryTab";
import EnhancedInventoryTab from "./dashboard/EnhancedInventoryTab";
import CollaborationsTab from "./dashboard/CollaborationsTab";
import ContractsTab from "./dashboard/ContractsTab";
import StatsTab from "./dashboard/StatsTab";
import HistoryTab from "./dashboard/HistoryTab";
import SettingsTab from "./dashboard/SettingsTab";
import MessagesTab from "./dashboard/MessagesTab";
import PurchaseButton from "./PurchaseButton";
import { Menu, X, User as UserIcon } from "lucide-react";
import { getProjectBanner, handleBannerError } from "../utils/projectUtils";
import {
  HeartIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LightBulbIcon,
  GamepadIcon,
} from "./icons/Icons";

interface PublisherDashboardProps {
  user: User;
  onLogout: () => void;
}

// Helper functions - moved outside component to prevent recreation on each render
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

const getOwnerName = (project: GameProject) => {
  const owner = project.owner;
  if (owner) {
    // Use email if firstName/lastName are not available
    return owner.firstName && owner.lastName
      ? `${owner.firstName} ${owner.lastName}`
      : owner.email || "Unknown Creator";
  }
  return "Unknown Creator";
};

const PublisherDashboard: React.FC<PublisherDashboardProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("browse-games");
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<GameProjectFilters>(() => {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = (searchParams.get("status") as ProjectStatus) || "published";
    const projectType =
      (searchParams.get("projectType") as ProjectType) || undefined;
    const gameGenre = searchParams.get("gameGenre") || undefined;
    const targetPlatform = searchParams.get("targetPlatform") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy =
      (searchParams.get("sortBy") as
        | "createdAt"
        | "publishedAt"
        | "viewCount"
        | "likeCount"
        | "askingPrice"
        | "budget") || "publishedAt";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    return {
      page,
      limit,
      status,
      projectType,
      gameGenre,
      targetPlatform,
      search,
      sortBy,
      sortOrder,
    };
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedProject, setSelectedProject] = useState<GameProject | null>(
    null
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<GameProject[]>([]);
  const [ownerData, setOwnerData] = useState<Record<string, any>>({});

  // Use refs to prevent duplicate API calls
  const isLoadingProjectsRef = useRef(false);
  const isLoadingAllProjectsRef = useRef(false);
  const hasLoadedInitialDataRef = useRef(false);

  // Memoize filters object to prevent unnecessary recreations
  const memoizedFilters = useMemo(
    () => filters,
    [
      filters.page,
      filters.limit,
      filters.status,
      filters.projectType,
      filters.gameGenre,
      filters.targetPlatform,
      filters.search,
      filters.sortBy,
      filters.sortOrder,
    ]
  );

  // Memoize calculated stats to prevent unnecessary recalculations
  const calculatedStats = useMemo(() => {
    if (allProjects.length === 0) return null;

    return {
      totalProjects: allProjects.length,
      ideaSales: allProjects.filter((p) => p.projectType === "idea_sale")
        .length,
      productSales: allProjects.filter((p) => p.projectType === "product_sale")
        .length,
      collaborations: allProjects.filter(
        (p) => p.projectType === "dev_collaboration"
      ).length,
    };
  }, [allProjects]);

  const loadOwnerData = useCallback(async (projects: GameProject[]) => {
    try {
      const uniqueDeveloperIds = [...new Set(projects.map((p) => p.creatorId))];
      const ownerPromises = uniqueDeveloperIds.map(async (creatorId) => {
        try {
          const ownerInfo = await apiService.getUserById(creatorId);
          return { creatorId, ownerInfo };
        } catch (err) {
          console.error(`Failed to load owner data for ${creatorId}:`, err);
          return { creatorId, ownerInfo: null };
        }
      });

      const ownerResults = await Promise.all(ownerPromises);
      const ownerDataMap: Record<string, any> = {};

      ownerResults.forEach(({ creatorId, ownerInfo }) => {
        if (ownerInfo) {
          ownerDataMap[creatorId] = ownerInfo;
        }
      });

      setOwnerData(ownerDataMap);
    } catch (err) {
      console.error("Failed to load owner data:", err);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoadingProjectsRef.current) {
      console.log("Already loading projects, skipping duplicate call");
      return;
    }

    try {
      isLoadingProjectsRef.current = true;
      setLoading(true);
      setError(null);
      console.log("Loading projects with filters:", memoizedFilters);

      // Use the new getProjectsForSale API for publishers
      const response = await apiService.getProjectsForSale(memoizedFilters);
      console.log("API response:", response);

      const projects = response.data?.projects || response.projects || [];
      const totalPages = response.data?.totalPages || response.totalPages || 1;
      const total = response.data?.total || response.total || 0;

      console.log(
        "Setting projects:",
        projects.length,
        "totalPages:",
        totalPages,
        "total:",
        total
      );

      setProjects(projects);
      setTotalPages(totalPages);
      setTotal(total);

      // Load owner data for the projects
      if (projects.length > 0) {
        await loadOwnerData(projects);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
      isLoadingProjectsRef.current = false;
    }
  }, [memoizedFilters, loadOwnerData]);

  const loadAllProjects = useCallback(async () => {
    // Prevent duplicate calls and only load once for stats
    if (isLoadingAllProjectsRef.current || allProjects.length > 0) {
      console.log("Skipping loadAllProjects - already loaded or loading");
      return;
    }

    try {
      isLoadingAllProjectsRef.current = true;
      // Load all projects without filters for stats calculation
      const response = await apiService.getProjectsForSale({
        page: 1,
        limit: 1000, // Load a large number to get all projects
        status: "published", // Only published projects
      });
      const allProjectsData =
        response.data?.projects || response.projects || [];
      setAllProjects(allProjectsData);
      // Stats will be calculated automatically via useMemo when allProjects changes
    } catch (err) {
      console.error("Failed to load all projects for stats:", err);
    } finally {
      isLoadingAllProjectsRef.current = false;
    }
  }, [allProjects.length]);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiService.getPublisherStats();
      setStats(response);
    } catch (err) {
      console.error("Failed to load stats:", err);
      // Stats will be calculated in loadAllProjects if API fails
    }
  }, []);

  // Update stats when calculated stats change
  useEffect(() => {
    if (calculatedStats && !stats) {
      setStats(calculatedStats);
    }
  }, [calculatedStats, stats]);

  // Load initial data on mount - only once
  useEffect(() => {
    if (hasLoadedInitialDataRef.current) return;
    hasLoadedInitialDataRef.current = true;

    // Load projects with current filters
    loadProjects();
    // Load all projects for stats (only once)
    loadAllProjects();
    // Load stats from API
    loadStats();
  }, []); // Empty dependency array - only run on mount

  // Reload projects when filters change (but not on initial mount)
  useEffect(() => {
    // Only reload if initial data has been loaded
    if (hasLoadedInitialDataRef.current) {
      loadProjects();
    }
  }, [memoizedFilters, loadProjects]);

  const handleFilterChange = useCallback(
    (newFilters: Partial<GameProjectFilters>) => {
      setFilters((prevFilters) => {
        const updatedFilters = { ...prevFilters, ...newFilters, page: 1 };

        // Update URL params
        const newSearchParams = new URLSearchParams();
        Object.entries(updatedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            newSearchParams.set(key, value.toString());
          }
        });
        setSearchParams(newSearchParams);

        return updatedFilters;
      });
    },
    [setSearchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      console.log("handlePageChange called with page:", page);

      setFilters((prevFilters) => {
        // Validate page number
        const validPage = Math.max(1, Math.min(page, totalPages || 1));
        console.log("Valid page:", validPage);

        const updatedFilters = { ...prevFilters, page: validPage };
        console.log("Updated filters:", updatedFilters);

        // Update URL params
        const newSearchParams = new URLSearchParams();
        Object.entries(updatedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            newSearchParams.set(key, value.toString());
          }
        });
        setSearchParams(newSearchParams);

        return updatedFilters;
      });
    },
    [totalPages, setSearchParams]
  );

  // Add keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const currentPage = filters.page || 1;
        switch (event.key) {
          case "ArrowLeft":
            if (currentPage > 1) {
              event.preventDefault();
              handlePageChange(currentPage - 1);
            }
            break;
          case "ArrowRight":
            if (currentPage < totalPages) {
              event.preventDefault();
              handlePageChange(currentPage + 1);
            }
            break;
          case "Home":
            event.preventDefault();
            handlePageChange(1);
            break;
          case "End":
            event.preventDefault();
            handlePageChange(totalPages);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages, handlePageChange]);

  // Memoize purchase success/error handlers to prevent recreation
  const handlePurchaseSuccess = useCallback(
    (result: any) => {
      console.log("Purchase successful:", result);
      // Refresh projects and stats
      loadProjects();
      loadAllProjects();
    },
    [loadProjects, loadAllProjects]
  );

  const handlePurchaseError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleStartCollaboration = useCallback(
    async (projectId: string) => {
      try {
        setActionLoading(`collaborate-${projectId}`);
        await apiService.startCollaboration(projectId);
        // Refresh projects and stats to update status
        loadProjects();
        loadAllProjects();
        setSelectedProject(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start collaboration"
        );
      } finally {
        setActionLoading(null);
      }
    },
    [loadProjects, loadAllProjects]
  );

  const handleViewProject = useCallback(
    (projectId: string) => {
      navigate(`/project-detail/${projectId}`);
    },
    [navigate]
  );

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

  // Hover animations for cards - memoized to prevent recreation
  const handleCardHover = useCallback((index: number, isHovering: boolean) => {
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
  }, []);

  // Memoize tab content to prevent unnecessary re-renders
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "browse-games":
        return (
          <>
            {/* Marketplace Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                Browse Games
              </h2>
              <p className="text-gray-400">
                Discover and purchase games from talented developers
              </p>
            </div>

            {/* Filters */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Type
                  </label>
                  <select
                    value={filters.projectType || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        projectType:
                          (e.target.value as ProjectType) || undefined,
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
                    Genre
                  </label>
                  <input
                    type="text"
                    value={filters.gameGenre || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        gameGenre: e.target.value || undefined,
                      })
                    }
                    placeholder="e.g., Puzzle, Action"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Platform
                  </label>
                  <input
                    type="text"
                    value={filters.targetPlatform || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        targetPlatform: e.target.value || undefined,
                      })
                    }
                    placeholder="e.g., Mobile, PC"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        search: e.target.value || undefined,
                      })
                    }
                    placeholder="Search projects..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4">
                <div className="text-2xl font-bold text-indigo-400">
                  {stats?.totalProjects ||
                    calculatedStats?.totalProjects ||
                    total}
                </div>
                <div className="text-sm text-gray-400">Total Projects</div>
              </div>
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4">
                <div className="text-2xl font-bold text-green-400">
                  {stats?.ideaSales || calculatedStats?.ideaSales || 0}
                </div>
                <div className="text-sm text-gray-400">Idea Sales</div>
              </div>
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {stats?.productSales || calculatedStats?.productSales || 0}
                </div>
                <div className="text-sm text-gray-400">Product Sales</div>
              </div>
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {stats?.collaborations ||
                    calculatedStats?.collaborations ||
                    0}
                </div>
                <div className="text-sm text-gray-400">Collaborations</div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-6">
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
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 mb-6"
                >
                  {projects.map((project, index) => (
                    <div
                      key={project._id}
                      ref={(el) => {
                        cardRefs.current[index] = el;
                      }}
                      className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md hover:shadow-xl cursor-pointer overflow-hidden transform-gpu"
                      onClick={() => setSelectedProject(project)}
                      onMouseEnter={() => handleCardHover(index, true)}
                      onMouseLeave={() => handleCardHover(index, false)}
                    >
                      {project.thumbnail && (
                        <div className="w-full h-48 overflow-hidden">
                          <img
                            src={project.thumbnail}
                            alt={project.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
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
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                          <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                            {project.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium status-indicator ${getStatusColor(
                              project.status
                            )} self-start sm:self-auto`}
                          >
                            {project.status}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {project.shortDescription}
                        </p>

                        {/* Owner Information - Only show for publisher dashboard */}
                        <div className="flex items-center space-x-2 mb-3">
                          <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-400 truncate">
                            Owner:{" "}
                            <span className="text-gray-300 font-medium">
                              {getOwnerName(project)}
                            </span>
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                          <span className="text-xs text-indigo-400 font-medium">
                            {getProjectTypeLabel(project.projectType)}
                          </span>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
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
                          <div className="text-base sm:text-lg font-bold text-green-400">
                            {formatPrice(project.ideaSaleData.askingPrice)}
                          </div>
                        )}

                        {project.productSaleData && (
                          <div className="text-base sm:text-lg font-bold text-blue-400">
                            {formatPrice(project.productSaleData.askingPrice)}
                          </div>
                        )}

                        {project.creatorCollaborationData && (
                          <div className="text-base sm:text-lg font-bold text-purple-400">
                            Budget:{" "}
                            {formatPrice(
                              project.creatorCollaborationData.budget
                            )}
                          </div>
                        )}

                        {/* Purchase Button */}
                        <div className="mt-3">
                          <PurchaseButton
                            project={project}
                            size="sm"
                            onPurchaseSuccess={handlePurchaseSuccess}
                            onPurchaseError={handlePurchaseError}
                          />
                        </div>

                        {(project.ideaSaleData?.gameGenre ||
                          project.productSaleData?.gameGenre ||
                          project.creatorCollaborationData?.gameGenre) && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              Genre:{" "}
                            </span>
                            <span className="text-xs text-gray-300 truncate block sm:inline">
                              {project.ideaSaleData?.gameGenre ||
                                project.productSaleData?.gameGenre ||
                                project.creatorCollaborationData?.gameGenre}
                            </span>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                          Created:{" "}
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center space-y-4">
                    {/* Debug Info */}
                    <div className="text-xs text-gray-500 text-center">
                      Debug: Current Page: {filters.page || 1} | Total Pages:{" "}
                      {totalPages} | Total Items: {total}
                    </div>

                    {/* Pagination Info */}
                    <div className="text-sm text-gray-400 text-center">
                      Showing{" "}
                      {((filters.page || 1) - 1) * (filters.limit || 10) + 1} to{" "}
                      {Math.min(
                        (filters.page || 1) * (filters.limit || 10),
                        total
                      )}{" "}
                      of {total} projects
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap justify-center">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={(filters.page || 1) === 1}
                        className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="First page"
                      >
                        <ArrowLeftIcon className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() =>
                          handlePageChange(Math.max(1, (filters.page || 1) - 1))
                        }
                        disabled={(filters.page || 1) === 1}
                        className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {/* Page Numbers with Smart Display */}
                      {(() => {
                        const currentPage = Math.max(1, filters.page || 1);
                        const maxVisiblePages = 7;
                        const pages = [];

                        // Ensure totalPages is valid
                        if (totalPages <= 0) return null;

                        if (totalPages <= maxVisiblePages) {
                          // Show all pages if total is small
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Smart pagination for large page counts
                          if (currentPage <= 4) {
                            // Show first pages + ellipsis + last page
                            for (let i = 1; i <= Math.min(5, totalPages); i++) {
                              pages.push(i);
                            }
                            if (totalPages > 5) {
                              pages.push("...");
                              pages.push(totalPages);
                            }
                          } else if (currentPage >= totalPages - 3) {
                            // Show first page + ellipsis + last pages
                            pages.push(1);
                            pages.push("...");
                            for (
                              let i = Math.max(1, totalPages - 4);
                              i <= totalPages;
                              i++
                            ) {
                              pages.push(i);
                            }
                          } else {
                            // Show first + ellipsis + current range + ellipsis + last
                            pages.push(1);
                            pages.push("...");
                            for (
                              let i = currentPage - 1;
                              i <= currentPage + 1;
                              i++
                            ) {
                              pages.push(i);
                            }
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
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                currentPage === page
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
                        onClick={() =>
                          handlePageChange(
                            Math.min(totalPages, (filters.page || 1) + 1)
                          )
                        }
                        disabled={(filters.page || 1) === totalPages}
                        className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>

                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={(filters.page || 1) === totalPages}
                        className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Last page"
                      >
                        <ArrowRightIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Page Size Selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm text-gray-400">
                        Show:
                      </span>
                      <select
                        value={filters.limit || 10}
                        onChange={(e) =>
                          handleFilterChange({
                            limit: parseInt(e.target.value),
                          })
                        }
                        className="px-2 py-1 text-xs sm:text-sm bg-gray-700 border border-gray-600 rounded text-white"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                      </select>
                    </div>

                    {/* Keyboard Shortcuts Hint */}
                    <div className="text-xs text-gray-500 text-center">
                      <LightBulbIcon className="w-4 h-4 text-yellow-400 inline mr-1" />{" "}
                      Use Ctrl+←/→ for prev/next, Ctrl+Home/End for first/last
                      page
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        );
      case "inventory":
        return <EnhancedInventoryTab />;
      case "collaborations":
        return <CollaborationsTab userRole="publisher" userId={user.id} />;
      case "messages":
        return <MessagesTab />;
      case "contracts":
        return <ContractsTab user={user} />;
      case "stats":
        return <StatsTab userRole="publisher" />;
      case "history":
        return <HistoryTab userRole="publisher" />;
      case "settings":
        return <SettingsTab user={user} />;
      default:
        return null;
    }
  }, [
    activeTab,
    projects,
    loading,
    error,
    stats,
    calculatedStats,
    total,
    filters,
    totalPages,
    handleFilterChange,
    handlePageChange,
    handleCardHover,
    handlePurchaseSuccess,
    handlePurchaseError,
    user,
    handleViewProject,
    handleStartCollaboration,
    actionLoading,
    selectedProject,
    setSelectedProject,
    ownerData,
  ]);

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        userRole="publisher"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <RnDLogo size={32} className="sm:w-10 sm:h-10" />
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                  Game <span className="text-indigo-400">Marketplace</span>
                </h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-300">
                    Welcome,{" "}
                    <span className="font-medium text-white">{user.name}</span>
                  </p>
                  <div className="flex items-center justify-end space-x-2 text-xs text-gray-400">
                    <span>{user.email}</span>
                    <RoleBadge role={user.role} size="sm" />
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                >
                  Log Out
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="sm:hidden mt-4 pt-4 border-t border-gray-700">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-300">
                      Welcome,{" "}
                      <span className="font-medium text-white">
                        {user.name}
                      </span>
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 mt-1">
                      <span>{user.email.split("@")[0]}</span>
                      <RoleBadge role={user.role} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        onLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto dark-scrollbar">
          <main className="p-4 sm:p-6">{renderTabContent}</main>
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto dark-scrollbar">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {selectedProject.title}
                </h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-300 mb-4">
                    {selectedProject.shortDescription}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">
                        {getProjectTypeLabel(selectedProject.projectType)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          selectedProject.status
                        )}`}
                      >
                        {selectedProject.status}
                      </span>
                    </div>
                    {(selectedProject.ideaSaleData?.gameGenre ||
                      selectedProject.productSaleData?.gameGenre ||
                      selectedProject.creatorCollaborationData?.gameGenre) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Genre:</span>
                        <span className="text-white">
                          {selectedProject.ideaSaleData?.gameGenre ||
                            selectedProject.productSaleData?.gameGenre ||
                            selectedProject.creatorCollaborationData?.gameGenre}
                        </span>
                      </div>
                    )}
                    {(selectedProject.ideaSaleData?.targetPlatform ||
                      selectedProject.productSaleData?.targetPlatform ||
                      selectedProject.creatorCollaborationData
                        ?.targetPlatform) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform:</span>
                        <span className="text-white">
                          {selectedProject.ideaSaleData?.targetPlatform ||
                            selectedProject.productSaleData?.targetPlatform ||
                            selectedProject.creatorCollaborationData
                              ?.targetPlatform}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedProject.ideaSaleData && (
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Idea Sale Details
                      </h3>
                      <p className="text-gray-300 mb-2">
                        {selectedProject.ideaSaleData.description}
                      </p>
                      <div className="text-xl font-bold text-green-400 mb-2">
                        {formatPrice(selectedProject.ideaSaleData.askingPrice)}
                      </div>
                      {selectedProject.ideaSaleData.videoUrl && (
                        <div className="mt-3">
                          <video
                            controls
                            className="w-full h-48 rounded-lg"
                            poster={
                              getProjectBanner(selectedProject) || undefined
                            }
                          >
                            <source
                              src={selectedProject.ideaSaleData.videoUrl}
                              type="video/mp4"
                            />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProject.productSaleData && (
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Product Sale Details
                      </h3>
                      <p className="text-gray-300 mb-2">
                        {selectedProject.productSaleData.description}
                      </p>
                      <div className="text-xl font-bold text-blue-400 mb-2">
                        {formatPrice(
                          selectedProject.productSaleData.askingPrice
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        Playable:{" "}
                        {selectedProject.productSaleData.isPlayable
                          ? "Yes"
                          : "No"}
                      </div>
                      {selectedProject.productSaleData.demoUrl && (
                        <div className="mt-3">
                          <a
                            href={selectedProject.productSaleData.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                          >
                            <GamepadIcon className="w-4 h-4 inline mr-1" /> Try
                            Demo
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProject.creatorCollaborationData && (
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Collaboration Details
                      </h3>
                      <p className="text-gray-300 mb-2">
                        {selectedProject.creatorCollaborationData.description}
                      </p>
                      <div className="text-xl font-bold text-purple-400 mb-2">
                        Budget:{" "}
                        {formatPrice(
                          selectedProject.creatorCollaborationData.budget
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        Timeline:{" "}
                        {selectedProject.creatorCollaborationData.timeline}
                      </div>
                      <p className="text-gray-300 text-sm">
                        {selectedProject.creatorCollaborationData.proposal}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Project Stats
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Views:</span>
                        <span className="text-white">
                          {selectedProject.viewCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Likes:</span>
                        <span className="text-white">
                          {selectedProject.likeCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rating:</span>
                        <span className="text-white">
                          {selectedProject.averageRating > 0
                            ? selectedProject.averageRating.toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reviews:</span>
                        <span className="text-white">
                          {selectedProject.reviewCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(selectedProject.ideaSaleData?.tags ||
                    selectedProject.productSaleData?.tags ||
                    selectedProject.creatorCollaborationData?.tags) &&
                    (
                      selectedProject.ideaSaleData?.tags ||
                      selectedProject.productSaleData?.tags ||
                      selectedProject.creatorCollaborationData?.tags ||
                      []
                    ).length > 0 && (
                      <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(
                            selectedProject.ideaSaleData?.tags ||
                            selectedProject.productSaleData?.tags ||
                            selectedProject.creatorCollaborationData?.tags ||
                            []
                          ).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="space-y-3">
                    <button
                      onClick={() => handleViewProject(selectedProject._id)}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                    >
                      <EyeIcon className="w-4 h-4 inline mr-1" /> View Project
                      Details
                    </button>

                    {selectedProject.status === "published" && (
                      <>
                        {(selectedProject.projectType === "idea_sale" ||
                          selectedProject.projectType === "product_sale") && (
                          <PurchaseButton
                            project={selectedProject}
                            size="lg"
                            className="w-full"
                            onPurchaseSuccess={(result) => {
                              handlePurchaseSuccess(result);
                              setSelectedProject(null);
                            }}
                            onPurchaseError={handlePurchaseError}
                          />
                        )}

                        {selectedProject.projectType ===
                          "dev_collaboration" && (
                          <button
                            onClick={() =>
                              handleStartCollaboration(selectedProject._id)
                            }
                            disabled={
                              actionLoading ===
                              `collaborate-${selectedProject._id}`
                            }
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                          >
                            {actionLoading ===
                            `collaborate-${selectedProject._id}` ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Starting...
                              </>
                            ) : (
                              "Start Collaboration"
                            )}
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() =>
                        apiService.likeGameProject(selectedProject._id)
                      }
                      className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <HeartIcon className="w-4 h-4 inline mr-1" /> Like Project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublisherDashboard;
