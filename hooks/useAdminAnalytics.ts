import { useState, useEffect, useCallback } from "react";
import {
  adminService,
  AdminDashboardData,
  SystemOverview,
  ProjectsStats,
  CollaborationsStats,
  AdminUsersStats,
  RevenueStats,
  AdminAnalyticsFilters,
} from "../services/adminService";

export const useAdminAnalytics = (
  initialFilters: AdminAnalyticsFilters = {}
) => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(
    null
  );
  const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(
    null
  );
  const [projectsStats, setProjectsStats] = useState<ProjectsStats | null>(
    null
  );
  const [collaborationsStats, setCollaborationsStats] =
    useState<CollaborationsStats | null>(null);
  const [usersStats, setUsersStats] = useState<AdminUsersStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load full dashboard data
  const fetchDashboard = useCallback(
    async (filters: AdminAnalyticsFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const data = await adminService.getAdminDashboard(filters);
        if (data.success && data.data) {
          setDashboardData(data.data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch dashboard data"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load system overview
  const fetchSystemOverview = useCallback(
    async (filters: AdminAnalyticsFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const data = await adminService.getSystemOverview(filters);
        if (data.success && data.data) {
          setSystemOverview(data.data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch system overview"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load projects stats
  const fetchProjectsStats = useCallback(
    async (filters: AdminAnalyticsFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const data = await adminService.getProjectsStats(filters);
        if (data.success && data.data) {
          setProjectsStats(data.data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch projects stats"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load collaborations stats
  const fetchCollaborationsStats = useCallback(
    async (filters: AdminAnalyticsFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const data = await adminService.getCollaborationsStats(filters);
        if (data.success && data.data) {
          setCollaborationsStats(data.data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch collaborations stats"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load users stats
  const fetchUsersStats = useCallback(
    async (filters: AdminAnalyticsFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const data = await adminService.getUsersStats(filters);
        if (data.success && data.data) {
          setUsersStats(data.data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch users stats"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load revenue stats
  const fetchRevenueStats = useCallback(
    async (filters: AdminAnalyticsFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const data = await adminService.getRevenueStats(filters);
        if (data.success && data.data) {
          setRevenueStats(data.data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch revenue stats"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load all analytics
  const fetchAll = useCallback(
    async (filters: AdminAnalyticsFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchDashboard(filters),
          fetchSystemOverview(filters),
          fetchProjectsStats(filters),
          fetchCollaborationsStats(filters),
          fetchUsersStats(filters),
          fetchRevenueStats(filters),
        ]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch analytics"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      fetchDashboard,
      fetchSystemOverview,
      fetchProjectsStats,
      fetchCollaborationsStats,
      fetchUsersStats,
      fetchRevenueStats,
    ]
  );

  // Load initial data
  useEffect(() => {
    fetchDashboard(initialFilters);
  }, []);

  return {
    dashboardData,
    systemOverview,
    projectsStats,
    collaborationsStats,
    usersStats,
    revenueStats,
    loading,
    error,
    fetchDashboard,
    fetchSystemOverview,
    fetchProjectsStats,
    fetchCollaborationsStats,
    fetchUsersStats,
    fetchRevenueStats,
    fetchAll,
    refetch: () => fetchDashboard(initialFilters),
  };
};
