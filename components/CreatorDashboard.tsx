import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import YourProjectsTab from "./dashboard/YourProjectsTab";
import CollaborationsTab from "./dashboard/CollaborationsTab";
import MessagesTab from "./dashboard/MessagesTab";
import ContractsTab from "./dashboard/ContractsTab";
import StatsTab from "./dashboard/StatsTab";
import HistoryTab from "./dashboard/HistoryTab";
import SettingsTab from "./dashboard/SettingsTab";
import { Menu, X } from "lucide-react";
import {
  DocumentTextIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  WarningIcon,
  InfoIcon,
  GamepadIcon,
  EyeIcon,
} from "./icons/Icons";

interface CreatorDashboardProps {
  user: User;
  onLogout: () => void;
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("your-projects");
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<GameProjectFilters>(() => {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const projectType =
      (searchParams.get("projectType") as ProjectType) || undefined;
    const status = (searchParams.get("status") as ProjectStatus) || undefined;
    const sortBy =
      (searchParams.get("sortBy") as
        | "createdAt"
        | "publishedAt"
        | "viewCount"
        | "likeCount"
        | "askingPrice"
        | "budget") || "createdAt";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    return {
      page,
      limit,
      projectType,
      status,
      sortBy,
      sortOrder,
    };
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedProject, setSelectedProject] = useState<GameProject | null>(
    null
  );
  const [stats, setStats] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadMyProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getMyProjects(filters);
      setProjects(response.projects || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your projects"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Memoize stats calculation to prevent unnecessary recalculations
  const calculatedStats = useMemo(() => {
    if (projects.length === 0 && total === 0) return null;

    return {
      totalProjects: total, // Use total from API response for accurate count
      publishedProjects: projects.filter((p) => p.status === "published")
        .length,
      soldProjects: projects.filter((p) => p.status === "sold").length,
      totalRevenue: 0, // This would need to be calculated from actual sales data
      draftProjects: projects.filter((p) => p.status === "draft").length,
      inCollaborationProjects: projects.filter(
        (p) => p.status === "in_collaboration"
      ).length,
      completedProjects: projects.filter((p) => p.status === "completed")
        .length,
      totalViews: projects.reduce((sum, p) => sum + p.viewCount, 0),
      totalLikes: projects.reduce((sum, p) => sum + p.likeCount, 0),
      averageRating:
        projects.length > 0
          ? projects.reduce((sum, p) => sum + p.averageRating, 0) /
            projects.length
          : 0,
    };
  }, [projects, total]);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiService.getMyDeveloperStats();
      setStats(response);
    } catch (err) {
      console.error("Failed to load stats:", err);
      // Set stats to null, will be calculated from projects in separate effect
      setStats(null);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadMyProjects();
    loadStats();
  }, [loadMyProjects, loadStats]);

  // Use calculated stats as fallback when API stats are not available
  useEffect(() => {
    if (stats === null && calculatedStats) {
      // Using calculated stats as fallback
      setStats(calculatedStats);
    }
  }, [stats, calculatedStats]);

  const handleFilterChange = (newFilters: Partial<GameProjectFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);

    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        newSearchParams.set(key, value.toString());
      }
    });
    setSearchParams(newSearchParams);
  };

  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);

    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        newSearchParams.set(key, value.toString());
      }
    });
    setSearchParams(newSearchParams);
  };

  // Add keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "ArrowLeft":
            if (filters.page && filters.page > 1) {
              event.preventDefault();
              handlePageChange(filters.page - 1);
            }
            break;
          case "ArrowRight":
            if (filters.page && filters.page < totalPages) {
              event.preventDefault();
              handlePageChange(filters.page + 1);
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
  }, [filters.page, totalPages]);

  const handlePublish = async (projectId: string) => {
    try {
      setActionLoading(`publish-${projectId}`);
      await apiService.publishGameProject(projectId);
      // Only refresh projects, stats will be recalculated automatically
      loadMyProjects();
      setSelectedProject(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish project"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (projectId: string) => {
    if (window.confirm("Are you sure you want to unpublish this project?")) {
      try {
        setActionLoading(`unpublish-${projectId}`);
        await apiService.unpublishGameProject(projectId);
        // Only refresh projects, stats will be recalculated automatically
        loadMyProjects();
        setSelectedProject(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to unpublish project"
        );
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/project-detail/${projectId}`);
  };

  const handleDelete = async (projectId: string) => {
    // Find the project to check its status
    const project = projects.find((p) => p._id === projectId);

    // Prevent deletion of sold projects
    if (project && project.status === "sold") {
      setError(
        "Cannot delete sold projects. This project has been purchased by a publisher."
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        setActionLoading(`delete-${projectId}`);
        await apiService.deleteGameProject(projectId);
        // Only refresh projects, stats will be recalculated automatically
        loadMyProjects();
        setSelectedProject(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete project"
        );
      } finally {
        setActionLoading(null);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getProjectTypeLabel = (type: ProjectType | ProjectType[]) => {
    const types = Array.isArray(type) ? type : [type];
    return types
      .map((t) => {
        switch (t) {
          case "product_sale":
            return "Product Sale";
          case "dev_collaboration":
            return "Dev Collaboration";
          default:
            return String(t);
        }
      })
      .join(", ");
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "your-projects":
        return (
          <YourProjectsTab
            projects={projects}
            loading={loading}
            error={error}
            stats={stats}
            filters={filters}
            totalPages={totalPages}
            total={total}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            handleFilterChange={handleFilterChange}
            handlePageChange={handlePageChange}
            handlePublish={handlePublish}
            handleUnpublish={handleUnpublish}
            handleViewProject={handleViewProject}
            handleDelete={handleDelete}
          />
        );
      case "collaborations":
        return <CollaborationsTab userRole="creator" userId={user.id} />;
      case "chat":
        return <MessagesTab />;
      case "contracts":
        return <ContractsTab user={user} />;
      case "stats":
        return <StatsTab userRole="creator" />;
      case "history":
        return <HistoryTab userRole="creator" />;
      case "settings":
        return <SettingsTab user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        userRole="creator"
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
                  Creator <span className="text-indigo-400">Dashboard</span>
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
          <main className="p-4 sm:p-6">{renderTabContent()}</main>
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
                    {(selectedProject.productSaleData?.gameGenre ||
                      selectedProject.creatorCollaborationData?.gameGenre) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Genre:</span>
                        <span className="text-white">
                          {selectedProject.productSaleData?.gameGenre ||
                            selectedProject.creatorCollaborationData?.gameGenre}
                        </span>
                      </div>
                    )}
                    {(selectedProject.productSaleData?.targetPlatform ||
                      selectedProject.creatorCollaborationData
                        ?.targetPlatform) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform:</span>
                        <span className="text-white">
                          {selectedProject.productSaleData?.targetPlatform ||
                            selectedProject.creatorCollaborationData
                              ?.targetPlatform}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">
                        {new Date(
                          selectedProject.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedProject.publishedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Published:</span>
                        <span className="text-white">
                          {new Date(
                            selectedProject.publishedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

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

                  {(selectedProject.productSaleData?.tags ||
                    selectedProject.creatorCollaborationData?.tags) &&
                    (
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

                    {selectedProject.status === "draft" && (
                      <button
                        onClick={() => handlePublish(selectedProject._id)}
                        disabled={
                          actionLoading === `publish-${selectedProject._id}`
                        }
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                      >
                        {actionLoading === `publish-${selectedProject._id}` ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Publishing...
                          </>
                        ) : (
                          "Publish Project"
                        )}
                      </button>
                    )}

                    {selectedProject.status === "published" && (
                      <button
                        onClick={() => handleUnpublish(selectedProject._id)}
                        disabled={
                          actionLoading === `unpublish-${selectedProject._id}`
                        }
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                      >
                        {actionLoading ===
                        `unpublish-${selectedProject._id}` ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Unpublishing...
                          </>
                        ) : (
                          "Unpublish Project"
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(selectedProject._id)}
                      disabled={
                        actionLoading === `delete-${selectedProject._id}` ||
                        selectedProject.status === "sold"
                      }
                      title={
                        selectedProject.status === "sold"
                          ? "Cannot delete sold projects"
                          : "Delete this project"
                      }
                      className={`w-full px-4 py-2 font-medium rounded-lg transition-colors flex items-center justify-center ${
                        selectedProject.status === "sold"
                          ? "bg-gray-500 cursor-not-allowed text-gray-300"
                          : actionLoading === `delete-${selectedProject._id}`
                          ? "bg-gray-600 cursor-not-allowed text-white"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                    >
                      {actionLoading === `delete-${selectedProject._id}` ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : selectedProject.status === "sold" ? (
                        "Cannot Delete (Sold)"
                      ) : (
                        "Delete Project"
                      )}
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

export default CreatorDashboard;
