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
import RnDLogo from "../components/icons/RnDLogo";
import RoleBadge from "../components/RoleBadge";
import Sidebar from "../components/Sidebar";
import YourProjectsTab from "../components/dashboard/YourProjectsTab";
import { Menu, X } from "lucide-react";
import { useSidebar } from "../contexts/SidebarContext";

interface CreatorYourProjectsPageProps {
  user: User;
  onLogout: () => void;
}

const CreatorYourProjectsPage: React.FC<CreatorYourProjectsPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        userRole="creator"
        activeTab="your-projects"
        onTabChange={() => {}}
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
          <main className="p-4 sm:p-6">
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
          </main>
        </div>
      </div>
    </div>
  );
};

export default CreatorYourProjectsPage;
