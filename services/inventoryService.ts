import { apiService } from "./api";
import {
  InventoryItem,
  InventoryStats,
  PurchaseHistoryItem,
  PurchaseHistoryStats,
  InventoryUpdateData,
  InventorySearchFilters,
  PurchaseHistoryFilters,
  BulkInventoryUpdate,
} from "../types";

class InventoryService {
  // Inventory Management
  async getInventory(filters: InventorySearchFilters = {}): Promise<{
    items: InventoryItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const response = await apiService.getInventory(filters);
      return {
        items: response.data?.items || response.items || [],
        total: response.data?.total || response.total || 0,
        page: response.data?.page || response.page || 1,
        limit: response.data?.limit || response.limit || 20,
        totalPages: response.data?.totalPages || response.totalPages || 1,
      };
    } catch (error) {
      console.error("Failed to get inventory:", error);
      throw error;
    }
  }

  async getInventoryItem(projectId: string): Promise<InventoryItem | null> {
    try {
      const response = await apiService.getInventoryItem(projectId);
      return response.data || response;
    } catch (error) {
      console.error("Failed to get inventory item:", error);
      return null;
    }
  }

  async updateInventoryItem(
    projectId: string,
    updateData: InventoryUpdateData
  ): Promise<InventoryItem | null> {
    try {
      const response = await apiService.updateInventoryItem(
        projectId,
        updateData
      );
      return response.data || response;
    } catch (error) {
      console.error("Failed to update inventory item:", error);
      throw error;
    }
  }

  async deleteInventoryItem(projectId: string): Promise<boolean> {
    try {
      await apiService.deleteInventoryItem(projectId);
      return true;
    } catch (error) {
      console.error("Failed to delete inventory item:", error);
      return false;
    }
  }

  async searchInventory(
    searchQuery: string,
    filters: InventorySearchFilters = {}
  ): Promise<{
    items: InventoryItem[];
    total: number;
  }> {
    try {
      const response = await apiService.searchInventory(searchQuery, filters);
      return {
        items: response.data?.items || response.items || [],
        total: response.data?.total || response.total || 0,
      };
    } catch (error) {
      console.error("Failed to search inventory:", error);
      throw error;
    }
  }

  async getInventoryByCategory(
    category: string,
    filters: InventorySearchFilters = {}
  ): Promise<{
    items: InventoryItem[];
    total: number;
  }> {
    try {
      const response = await apiService.getInventoryByCategory(
        category,
        filters
      );
      return {
        items: response.data?.items || response.items || [],
        total: response.data?.total || response.total || 0,
      };
    } catch (error) {
      console.error("Failed to get inventory by category:", error);
      throw error;
    }
  }

  // Purchase History Management
  async getPurchaseHistory(filters: PurchaseHistoryFilters = {}): Promise<{
    items: PurchaseHistoryItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const response = await apiService.getPurchaseHistory(filters);
      return {
        items: response.data?.items || response.items || [],
        total: response.data?.total || response.total || 0,
        page: response.data?.page || response.page || 1,
        limit: response.data?.limit || response.limit || 20,
        totalPages: response.data?.totalPages || response.totalPages || 1,
      };
    } catch (error) {
      console.error("Failed to get purchase history:", error);
      throw error;
    }
  }

  async getPurchaseHistoryItem(
    transactionId: string
  ): Promise<PurchaseHistoryItem | null> {
    try {
      const response = await apiService.getPurchaseHistoryItem(transactionId);
      return response.data || response;
    } catch (error) {
      console.error("Failed to get purchase history item:", error);
      return null;
    }
  }

  async getPurchaseHistoryByDateRange(
    startDate: string,
    endDate: string,
    filters: PurchaseHistoryFilters = {}
  ): Promise<{
    items: PurchaseHistoryItem[];
    total: number;
  }> {
    try {
      const response = await apiService.getPurchaseHistoryByDateRange(
        startDate,
        endDate,
        filters
      );
      return {
        items: response.data?.items || response.items || [],
        total: response.data?.total || response.total || 0,
      };
    } catch (error) {
      console.error("Failed to get purchase history by date range:", error);
      throw error;
    }
  }

  async exportPurchaseHistory(
    format: "csv" | "json" = "json"
  ): Promise<Blob | null> {
    try {
      const response = await apiService.exportPurchaseHistory(format);
      return response;
    } catch (error) {
      console.error("Failed to export purchase history:", error);
      return null;
    }
  }

  // Bulk Operations
  async bulkUpdateInventory(updates: BulkInventoryUpdate[]): Promise<boolean> {
    try {
      await apiService.bulkUpdateInventory(updates);
      return true;
    } catch (error) {
      console.error("Failed to bulk update inventory:", error);
      return false;
    }
  }

  async bulkDeleteInventory(projectIds: string[]): Promise<boolean> {
    try {
      await apiService.bulkDeleteInventory(projectIds);
      return true;
    } catch (error) {
      console.error("Failed to bulk delete inventory:", error);
      return false;
    }
  }

  // Utility Methods
  async refreshInventoryData(): Promise<{
    inventory: InventoryItem[];
    stats: InventoryStats | null;
  }> {
    try {
      const inventoryResponse = await this.getInventory();

      return {
        inventory: inventoryResponse.items,
        stats: null, // Stats will be calculated from inventory data
      };
    } catch (error) {
      console.error("Failed to refresh inventory data:", error);
      throw error;
    }
  }

  async refreshPurchaseHistoryData(): Promise<{
    history: PurchaseHistoryItem[];
    stats: PurchaseHistoryStats | null;
  }> {
    try {
      const historyResponse = await this.getPurchaseHistory();

      return {
        history: historyResponse.items,
        stats: null, // Stats will be calculated from inventory data
      };
    } catch (error) {
      console.error("Failed to refresh purchase history data:", error);
      throw error;
    }
  }

  // Data Processing Utilities
  processInventoryData(items: InventoryItem[]): {
    byStatus: Record<string, InventoryItem[]>;
    byProjectType: Record<string, InventoryItem[]>;
    byPriceRange: Record<string, InventoryItem[]>;
    totalValue: number;
    averagePrice: number;
  } {
    const byStatus: Record<string, InventoryItem[]> = {};
    const byProjectType: Record<string, InventoryItem[]> = {};
    const byPriceRange: Record<string, InventoryItem[]> = {
      "0-50": [],
      "50-100": [],
      "100-500": [],
      "500+": [],
    };

    let totalValue = 0;

    items.forEach((item) => {
      // Group by status
      if (!byStatus[item.status]) {
        byStatus[item.status] = [];
      }
      byStatus[item.status].push(item);

      // Group by project type
      if (!byProjectType[item.projectType]) {
        byProjectType[item.projectType] = [];
      }
      byProjectType[item.projectType].push(item);

      // Group by price range based on asking price
      const askingPrice =
        item.ideaSaleData?.askingPrice ||
        item.productSaleData?.askingPrice ||
        item.creatorCollaborationData?.budget ||
        0;

      if (askingPrice <= 50) {
        byPriceRange["0-50"].push(item);
      } else if (askingPrice <= 100) {
        byPriceRange["50-100"].push(item);
      } else if (askingPrice <= 500) {
        byPriceRange["100-500"].push(item);
      } else {
        byPriceRange["500+"].push(item);
      }

      totalValue += askingPrice;
    });

    const averagePrice = items.length > 0 ? totalValue / items.length : 0;

    return {
      byStatus,
      byProjectType,
      byPriceRange,
      totalValue,
      averagePrice,
    };
  }

  processPurchaseHistoryData(items: PurchaseHistoryItem[]): {
    byMonth: Record<string, PurchaseHistoryItem[]>;
    byProjectType: Record<string, PurchaseHistoryItem[]>;
    byStatus: Record<string, PurchaseHistoryItem[]>;
    totalSpent: number;
    averagePurchase: number;
  } {
    const byMonth: Record<string, PurchaseHistoryItem[]> = {};
    const byProjectType: Record<string, PurchaseHistoryItem[]> = {};
    const byStatus: Record<string, PurchaseHistoryItem[]> = {};

    let totalSpent = 0;

    items.forEach((item) => {
      // Group by month
      const month = new Date(item.purchaseDate).toISOString().slice(0, 7); // YYYY-MM
      if (!byMonth[month]) {
        byMonth[month] = [];
      }
      byMonth[month].push(item);

      // Group by project type
      if (!byProjectType[item.project.projectType]) {
        byProjectType[item.project.projectType] = [];
      }
      byProjectType[item.project.projectType].push(item);

      // Group by status
      if (!byStatus[item.status]) {
        byStatus[item.status] = [];
      }
      byStatus[item.status].push(item);

      totalSpent += item.purchasePrice;
    });

    const averagePurchase = items.length > 0 ? totalSpent / items.length : 0;

    return {
      byMonth,
      byProjectType,
      byStatus,
      totalSpent,
      averagePurchase,
    };
  }
}

// Create and export a singleton instance
export const inventoryService = new InventoryService();
export default inventoryService;
