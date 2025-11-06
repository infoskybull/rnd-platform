import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import {
  InventoryItem,
  InventoryStats,
  PurchaseHistoryItem,
  PurchaseHistoryStats,
  InventoryUpdateData,
  InventoryFilters,
  PurchaseHistoryFilters,
  InventoryResponse,
  PurchaseHistoryResponse,
} from "../types";

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>(
    []
  );
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(
    null
  );
  const [purchaseHistoryStats, setPurchaseHistoryStats] =
    useState<PurchaseHistoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load inventory with filters
  const loadInventory = useCallback(async (filters: InventoryFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response: InventoryResponse = await apiService.getInventory(
        filters
      );
      setInventory(response.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load purchase history with filters
  const loadPurchaseHistory = useCallback(
    async (filters: PurchaseHistoryFilters = {}) => {
      try {
        setLoading(true);
        setError(null);
        const response: PurchaseHistoryResponse =
          await apiService.getPurchaseHistory(filters);
        // Convert InventoryItem to PurchaseHistoryItem format
        const historyItems: PurchaseHistoryItem[] = response.projects.map(
          (project) => ({
            _id: project._id,
            projectId: project._id,
            project: project as any, // Convert to GameProject format if needed
            purchaseDate: project.soldAt,
            purchasePrice:
              project.ideaSaleData?.askingPrice ||
              project.productSaleData?.askingPrice ||
              project.devCollaborationData?.budget ||
              0,
            status: "completed" as const,
            transactionId: project._id,
            notes: project.shortDescription,
          })
        );
        setPurchaseHistory(historyItems);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load purchase history"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get single inventory item
  const getInventoryItem = useCallback(async (projectId: string) => {
    try {
      const response = await apiService.getInventoryItem(projectId);
      return response.data || response;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load inventory item"
      );
      return null;
    }
  }, []);

  // Update inventory item
  const updateInventoryItem = useCallback(
    async (projectId: string, updateData: InventoryUpdateData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.updateInventoryItem(
          projectId,
          updateData
        );

        // Update local state
        setInventory((prev) =>
          prev.map((item) =>
            item._id === projectId
              ? ({ ...item, ...updateData } as InventoryItem)
              : item
          )
        );

        return response.data || response;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update inventory item"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete inventory item
  const deleteInventoryItem = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiService.deleteInventoryItem(projectId);

      // Update local state
      setInventory((prev) => prev.filter((item) => item._id !== projectId));

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete inventory item"
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search inventory
  const searchInventory = useCallback(
    async (searchQuery: string, filters: InventoryFilters = {}) => {
      try {
        setLoading(true);
        setError(null);
        const searchFilters = { ...filters, search: searchQuery };
        const response: InventoryResponse = await apiService.getInventory(
          searchFilters
        );
        setInventory(response.projects || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to search inventory"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get inventory by category
  const getInventoryByCategory = useCallback(
    async (category: string, filters: InventoryFilters = {}) => {
      try {
        setLoading(true);
        setError(null);
        const categoryFilters = { ...filters, gameGenre: category };
        const response: InventoryResponse = await apiService.getInventory(
          categoryFilters
        );
        setInventory(response.projects || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load inventory by category"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get purchase history by date range
  const getPurchaseHistoryByDateRange = useCallback(
    async (
      startDate: string,
      endDate: string,
      filters: PurchaseHistoryFilters = {}
    ) => {
      try {
        setLoading(true);
        setError(null);
        // For now, use the regular purchase history endpoint with date filters
        // The API documentation doesn't show a specific date range endpoint
        const response: PurchaseHistoryResponse =
          await apiService.getPurchaseHistory(filters);
        // Convert and filter by date range
        const historyItems: PurchaseHistoryItem[] = response.projects
          .filter((project) => {
            const soldDate = new Date(project.soldAt);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return soldDate >= start && soldDate <= end;
          })
          .map((project) => ({
            _id: project._id,
            projectId: project._id,
            project: project as any,
            purchaseDate: project.soldAt,
            purchasePrice:
              project.ideaSaleData?.askingPrice ||
              project.productSaleData?.askingPrice ||
              project.devCollaborationData?.budget ||
              0,
            status: "completed" as const,
            transactionId: project._id,
            notes: project.shortDescription,
          }));
        setPurchaseHistory(historyItems);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load purchase history by date range"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Export purchase history
  const exportPurchaseHistory = useCallback(
    async (format: "csv" | "json" = "json") => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.exportPurchaseHistory(format);
        return response;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to export purchase history"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Bulk update inventory
  const bulkUpdateInventory = useCallback(
    async (updates: Array<{ id: string; data: InventoryUpdateData }>) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.bulkUpdateInventory(updates);

        // Update local state
        setInventory((prev) =>
          prev.map((item) => {
            const update = updates.find((u) => u.id === item._id);
            return update
              ? ({ ...item, ...update.data } as InventoryItem)
              : item;
          })
        );

        return response;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to bulk update inventory"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Bulk delete inventory
  const bulkDeleteInventory = useCallback(async (projectIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      await apiService.bulkDeleteInventory(projectIds);

      // Update local state
      setInventory((prev) =>
        prev.filter((item) => !projectIds.includes(item._id))
      );

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to bulk delete inventory"
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([loadInventory(), loadPurchaseHistory()]);
  }, [loadInventory, loadPurchaseHistory]);

  return {
    // State
    inventory,
    purchaseHistory,
    inventoryStats,
    purchaseHistoryStats,
    loading,
    error,

    // Actions
    loadInventory,
    loadPurchaseHistory,
    getInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    searchInventory,
    getInventoryByCategory,
    getPurchaseHistoryByDateRange,
    exportPurchaseHistory,
    bulkUpdateInventory,
    bulkDeleteInventory,
    refreshAll,

    // Utilities
    clearError: () => setError(null),
  };
};
