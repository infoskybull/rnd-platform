import { useState, useCallback, useEffect } from "react";
import {
  adminService,
  AdminProjectsFilters,
  AdminProjectsResponse,
} from "../services/adminService";
import { GameProject } from "../types";

export const useAdminProjects = (
  initialFilters: AdminProjectsFilters = {}
) => {
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [filters, setFilters] =
    useState<AdminProjectsFilters>(initialFilters);

  const fetchProjects = useCallback(
    async (override: Partial<AdminProjectsFilters> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const merged = { ...filters, ...override };
        // For admin, we want to get all projects including drafts
        // Remove status filter to get all projects
        const adminFilters = { ...merged };
        if (!adminFilters.status) {
          // Don't filter by status, get all
        }
        const res: any = await adminService.getProjects(adminFilters);
        // Handle different response formats
        const projectsList =
          res.data?.projects || res.projects || res.data || [];
        const totalPages =
          res.data?.totalPages || res.totalPages || 1;
        const total = res.data?.total || res.total || projectsList.length;

        setProjects(projectsList);
        setPagination({
          total,
          page: merged.page || 1,
          limit: merged.limit || 20,
          totalPages,
        });
        setFilters(merged);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await adminService.deleteProject(projectId);
        setProjects((prev) =>
          prev.filter((p) => p._id !== projectId)
        );
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to delete project"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProjects(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    projects,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    fetchProjects,
    deleteProject,
    refetch: () => fetchProjects(filters),
  };
};

export default useAdminProjects;

