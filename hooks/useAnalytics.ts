import { useState, useEffect, useCallback } from "react";
import {
  analyticsService,
  AnalyticsFilters,
  AnalyticsOverview,
  PublisherDashboard,
  DeveloperDashboard,
} from "../services/analyticsService";

export interface UseAnalyticsOptions {
  filters?: AnalyticsFilters;
  autoFetch?: boolean;
  refetchInterval?: number; // in milliseconds
}

export interface UseAnalyticsReturn {
  // Data
  overview: AnalyticsOverview | null;
  publisherDashboard: PublisherDashboard | null;
  developerDashboard: DeveloperDashboard | null;

  // Loading states
  loading: boolean;
  overviewLoading: boolean;
  dashboardLoading: boolean;

  // Error states
  error: string | null;
  overviewError: string | null;
  dashboardError: string | null;

  // Actions
  fetchOverview: (filters?: AnalyticsFilters) => Promise<void>;
  fetchDashboard: (
    userRole: "publisher" | "creator",
    filters?: AnalyticsFilters
  ) => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useAnalytics = (
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn => {
  const { filters = {}, autoFetch = true, refetchInterval } = options;

  // Data states
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [publisherDashboard, setPublisherDashboard] =
    useState<PublisherDashboard | null>(null);
  const [developerDashboard, setDeveloperDashboard] =
    useState<DeveloperDashboard | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Fetch overview data
  const fetchOverview = useCallback(
    async (customFilters?: AnalyticsFilters) => {
      try {
        setOverviewLoading(true);
        setOverviewError(null);

        const filtersToUse = customFilters || filters;
        const data = await analyticsService.getOverview(filtersToUse);
        setOverview(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch analytics overview";
        setOverviewError(errorMessage);
        console.error("Analytics overview fetch error:", err);
      } finally {
        setOverviewLoading(false);
      }
    },
    [filters]
  );

  // Fetch role-specific dashboard
  const fetchDashboard = useCallback(
    async (
      userRole: "publisher" | "creator",
      customFilters?: AnalyticsFilters
    ) => {
      try {
        setDashboardLoading(true);
        setDashboardError(null);

        const filtersToUse = customFilters || filters;
        const data = await analyticsService.getRoleDashboard(
          userRole,
          filtersToUse
        );

        if (userRole === "publisher") {
          setPublisherDashboard(data as PublisherDashboard);
        } else {
          setDeveloperDashboard(data as DeveloperDashboard);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch dashboard data";
        setDashboardError(errorMessage);
        console.error("Dashboard fetch error:", err);
      } finally {
        setDashboardLoading(false);
      }
    },
    [filters]
  );

  // Refetch all data
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchOverview(),
        // Note: We don't know the user role here, so we can't fetch dashboard
        // This should be called from the component with the appropriate role
      ]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refetch analytics data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchOverview]);

  // Clear error states
  const clearError = useCallback(() => {
    setError(null);
    setOverviewError(null);
    setDashboardError(null);
  }, []);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchOverview();
    }
  }, [autoFetch, fetchOverview]);

  // Set up refetch interval if specified
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(() => {
        if (autoFetch) {
          fetchOverview();
        }
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [refetchInterval, autoFetch, fetchOverview]);

  return {
    // Data
    overview,
    publisherDashboard,
    developerDashboard,

    // Loading states
    loading,
    overviewLoading,
    dashboardLoading,

    // Error states
    error,
    overviewError,
    dashboardError,

    // Actions
    fetchOverview,
    fetchDashboard,
    refetch,
    clearError,
  };
};

// Specialized hooks for specific use cases
export const useOverviewAnalytics = (filters?: AnalyticsFilters) => {
  return useAnalytics({ filters, autoFetch: true });
};

export const usePublisherAnalytics = (filters?: AnalyticsFilters) => {
  const analytics = useAnalytics({ filters, autoFetch: false });

  const fetchPublisherData = useCallback(async () => {
    await analytics.fetchDashboard("publisher");
  }, [analytics.fetchDashboard]);

  useEffect(() => {
    fetchPublisherData();
  }, [fetchPublisherData]);

  return {
    ...analytics,
    dashboard: analytics.publisherDashboard,
    fetchDashboard: fetchPublisherData,
  };
};

export const useDeveloperAnalytics = (filters?: AnalyticsFilters) => {
  const analytics = useAnalytics({ filters, autoFetch: false });

  const fetchDeveloperData = useCallback(async () => {
    await analytics.fetchDashboard("creator");
  }, [analytics.fetchDashboard]);

  useEffect(() => {
    fetchDeveloperData();
  }, [fetchDeveloperData]);

  return {
    ...analytics,
    dashboard: analytics.developerDashboard,
    fetchDashboard: fetchDeveloperData,
  };
};

// Hook for real-time analytics with auto-refresh
export const useRealtimeAnalytics = (
  filters?: AnalyticsFilters,
  refreshInterval: number = 30000
) => {
  return useAnalytics({
    filters,
    autoFetch: true,
    refetchInterval: refreshInterval,
  });
};

export default useAnalytics;
