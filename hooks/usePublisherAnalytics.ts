import { useState, useEffect, useCallback } from "react";
import {
  publisherAnalyticsService,
  PublisherBudgetAnalytics,
  PublisherCollaborationPerformance,
  PublisherProjectAnalytics,
  PublisherROIAnalytics,
  PublisherPaymentAnalytics,
  PublisherExtendedDashboard,
  AnalyticsFilters,
} from "../services/publisherAnalyticsService";

// Hook for Budget Analytics
export const usePublisherBudgetAnalytics = (filters?: AnalyticsFilters) => {
  const [data, setData] = useState<PublisherBudgetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await publisherAnalyticsService.getBudgetAnalytics(
        filters
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch budget analytics"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for Collaboration Performance
export const usePublisherCollaborationPerformance = (
  filters?: AnalyticsFilters
) => {
  const [data, setData] = useState<PublisherCollaborationPerformance | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result =
        await publisherAnalyticsService.getCollaborationPerformance(filters);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch collaboration performance"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for Project Analytics
export const usePublisherProjectAnalytics = (filters?: AnalyticsFilters) => {
  const [data, setData] = useState<PublisherProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await publisherAnalyticsService.getProjectAnalytics(
        filters
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch project analytics"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for ROI Analytics
export const usePublisherROIAnalytics = (filters?: AnalyticsFilters) => {
  const [data, setData] = useState<PublisherROIAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await publisherAnalyticsService.getROIAnalytics(filters);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch ROI analytics"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for Payment Analytics
export const usePublisherPaymentAnalytics = (filters?: AnalyticsFilters) => {
  const [data, setData] = useState<PublisherPaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await publisherAnalyticsService.getPaymentAnalytics(
        filters
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch payment analytics"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for Extended Dashboard (all analytics in one call)
export const usePublisherExtendedDashboard = (filters?: AnalyticsFilters) => {
  const [data, setData] = useState<PublisherExtendedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await publisherAnalyticsService.getExtendedDashboard(
        filters
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch extended dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Combined hook for all Publisher Analytics
export const usePublisherAnalytics = (filters?: AnalyticsFilters) => {
  const [selectedPeriod, setSelectedPeriod] = useState("12months");
  const [currentFilters, setCurrentFilters] = useState<AnalyticsFilters>({
    period: selectedPeriod,
    ...filters,
  });

  // Update filters when period changes
  useEffect(() => {
    setCurrentFilters((prev) => ({
      ...prev,
      period: selectedPeriod,
    }));
  }, [selectedPeriod]);

  const budgetAnalytics = usePublisherBudgetAnalytics(currentFilters);
  const collaborationPerformance =
    usePublisherCollaborationPerformance(currentFilters);
  const projectAnalytics = usePublisherProjectAnalytics(currentFilters);
  const roiAnalytics = usePublisherROIAnalytics(currentFilters);
  const paymentAnalytics = usePublisherPaymentAnalytics(currentFilters);

  const isLoading =
    budgetAnalytics.loading ||
    collaborationPerformance.loading ||
    projectAnalytics.loading ||
    roiAnalytics.loading ||
    paymentAnalytics.loading;

  const hasError =
    budgetAnalytics.error ||
    collaborationPerformance.error ||
    projectAnalytics.error ||
    roiAnalytics.error ||
    paymentAnalytics.error;

  const refetchAll = useCallback(() => {
    budgetAnalytics.refetch();
    collaborationPerformance.refetch();
    projectAnalytics.refetch();
    roiAnalytics.refetch();
    paymentAnalytics.refetch();
  }, [
    budgetAnalytics.refetch,
    collaborationPerformance.refetch,
    projectAnalytics.refetch,
    roiAnalytics.refetch,
    paymentAnalytics.refetch,
  ]);

  return {
    // Data
    budgetAnalytics: budgetAnalytics.data,
    collaborationPerformance: collaborationPerformance.data,
    projectAnalytics: projectAnalytics.data,
    roiAnalytics: roiAnalytics.data,
    paymentAnalytics: paymentAnalytics.data,

    // State
    loading: isLoading,
    error: hasError,
    selectedPeriod,

    // Actions
    setSelectedPeriod,
    refetchAll,

    // Individual refetch functions
    refetchBudget: budgetAnalytics.refetch,
    refetchCollaboration: collaborationPerformance.refetch,
    refetchProjects: projectAnalytics.refetch,
    refetchROI: roiAnalytics.refetch,
    refetchPayments: paymentAnalytics.refetch,
  };
};

// Real-time analytics hook with polling
export const usePublisherRealtimeAnalytics = (
  filters?: AnalyticsFilters,
  interval = 30000
) => {
  const [data, setData] = useState<PublisherExtendedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await publisherAnalyticsService.getExtendedDashboard(
        filters
      );
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch real-time analytics"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, interval);
    return () => clearInterval(intervalId);
  }, [fetchData, interval]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
};
