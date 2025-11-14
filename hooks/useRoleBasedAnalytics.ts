import { useState, useEffect, useCallback } from "react";
import { usePublisherAnalytics } from "./usePublisherAnalytics";
import { useDeveloperAnalytics } from "./useAnalytics";
import { AnalyticsFilters } from "../services/analyticsService";

interface RoleBasedAnalyticsProps {
  userRole: "publisher" | "creator";
  filters?: AnalyticsFilters;
}

export const useRoleBasedAnalytics = ({
  userRole,
  filters,
}: RoleBasedAnalyticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "6months" | "12months" | "24months"
  >("6months");
  const [currentFilters, setCurrentFilters] = useState<AnalyticsFilters>({
    period: selectedPeriod,
    ...filters,
  });

  // Update filters when period changes
  useEffect(() => {
    setCurrentFilters((prev: AnalyticsFilters) => ({
      ...prev,
      period: selectedPeriod,
    }));
  }, [selectedPeriod]);

  // Only call the appropriate analytics hook based on role
  const publisherAnalytics =
    userRole === "publisher" ? usePublisherAnalytics(currentFilters) : null;

  const developerAnalytics =
    userRole === "creator" ? useDeveloperAnalytics(currentFilters) : null;

  // Get the active analytics based on role
  const activeAnalytics =
    userRole === "publisher" ? publisherAnalytics : developerAnalytics;

  const refetchAll = useCallback(() => {
    if (userRole === "publisher" && publisherAnalytics) {
      publisherAnalytics.refetchAll();
    } else if (userRole === "creator" && developerAnalytics) {
      developerAnalytics.refetch();
    }
  }, [userRole, publisherAnalytics, developerAnalytics]);

  return {
    // Data
    analytics: activeAnalytics,
    publisherAnalytics: publisherAnalytics,
    developerAnalytics: developerAnalytics,

    // State
    loading: activeAnalytics?.loading || false,
    error: activeAnalytics?.error || null,
    selectedPeriod,
    userRole,

    // Actions
    setSelectedPeriod,
    refetchAll,
  };
};
