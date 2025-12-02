import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { GameProject, User } from "../types";

interface PublisherDashboardData {
  payToViewProjects: GameProject[];
  purchasedProjects: GameProject[];
  inCollaborationProjects: GameProject[];
  allProjects: GameProject[];
}

export const usePublisherDashboard = (user: User | null) => {
  const [data, setData] = useState<PublisherDashboardData>({
    payToViewProjects: [],
    purchasedProjects: [],
    inCollaborationProjects: [],
    allProjects: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch purchased projects (which already includes inCollaboration projects)
      const [purchasedResponse, inventoryResponse] = await Promise.all([
        // Get purchased projects - this already includes inCollaboration projects
        apiService.getPurchasedProjects({ limit: 100 }),
        // Get inventory (which includes purchased projects)
        apiService.getInventory({ limit: 100 }),
      ]);

      // Process all purchased projects (includes both purchased and inCollaboration)
      const allPurchasedProjects: GameProject[] =
        purchasedResponse?.projects || purchasedResponse?.data?.projects || [];

      // Process inventory projects (may include purchased)
      const inventoryProjects: GameProject[] =
        inventoryResponse?.projects || inventoryResponse?.data?.projects || [];

      // Separate purchased and inCollaboration projects from allPurchasedProjects
      const purchasedProjects: GameProject[] = [];
      const collaborationProjects: GameProject[] = [];

      allPurchasedProjects.forEach((project) => {
        // Check if project is in collaboration
        const isInCollaboration =
          project.purchasedType === "collaboration_budget" ||
          project.purchasedType === "dev_collaboration" ||
          project.status === "in_collaboration" ||
          !!project.collaborationStartDate;

        if (isInCollaboration) {
          collaborationProjects.push(project);
        } else {
          // Regular purchased projects (project_purchase, product_sale, or has soldAt)
          purchasedProjects.push(project);
        }
      });

      // To get payToView projects, we need to fetch projects where user.id is in viewerIds
      // Since there's no direct endpoint, we'll fetch projects and filter
      let payToViewProjects: GameProject[] = [];

      try {
        // Combine all projects we've fetched so far
        const allFetchedProjects = [
          ...inventoryProjects,
          ...allPurchasedProjects,
        ];

        // Filter projects where user.id is in viewerIds (but not purchased)
        const allPurchasedIds = new Set(
          allPurchasedProjects.map((p) => p._id)
        );

        payToViewProjects = allFetchedProjects.filter((project) => {
          const hasPaidToView =
            project.viewerIds &&
            Array.isArray(project.viewerIds) &&
            project.viewerIds.includes(user.id);
          
          // Exclude if already purchased (which includes inCollaboration)
          const isPurchased = allPurchasedIds.has(project._id);

          return hasPaidToView && !isPurchased;
        });

        // Also try fetching from game-projects endpoint to get more payToView projects
        // Note: This might need backend support to filter by viewerIds
        try {
          const allProjectsResponse = await apiService.getGameProjects({
            limit: 200,
            status: "published",
          });
          const allProjects: GameProject[] =
            allProjectsResponse?.projects ||
            allProjectsResponse?.data?.projects ||
            [];

          // Filter for payToView projects that we haven't already found
          const existingIds = new Set([
            ...payToViewProjects.map((p) => p._id),
            ...allPurchasedProjects.map((p) => p._id),
          ]);

          const payToViewFromAll = allProjects.filter((project) => {
            if (existingIds.has(project._id)) return false;

            return (
              project.viewerIds &&
              Array.isArray(project.viewerIds) &&
              project.viewerIds.includes(user.id)
            );
          });

          payToViewProjects = [...payToViewProjects, ...payToViewFromAll];
        } catch (err) {
          console.warn("Could not fetch all projects for payToView:", err);
        }
      } catch (err) {
        console.warn("Error fetching payToView projects:", err);
      }

      // Remove duplicates
      const uniquePurchased = Array.from(
        new Map(purchasedProjects.map((p) => [p._id, p])).values()
      );
      const uniqueCollaboration = Array.from(
        new Map(collaborationProjects.map((p) => [p._id, p])).values()
      );
      const uniquePayToView = Array.from(
        new Map(payToViewProjects.map((p) => [p._id, p])).values()
      );

      // Combine all projects
      const allProjects = [
        ...uniquePayToView,
        ...uniquePurchased,
        ...uniqueCollaboration,
      ];

      // Remove duplicates from allProjects
      const uniqueAllProjects = Array.from(
        new Map(allProjects.map((p) => [p._id, p])).values()
      );

      setData({
        payToViewProjects: uniquePayToView,
        purchasedProjects: uniquePurchased,
        inCollaborationProjects: uniqueCollaboration,
        allProjects: uniqueAllProjects,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
      console.error("Error loading publisher dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...data,
    loading,
    error,
    refresh: loadDashboardData,
  };
};

