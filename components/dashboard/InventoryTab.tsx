import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../../services/api";
import {
  GameProject,
  InventoryFilters,
  PurchaseHistoryFilters,
} from "../../types";
import { User, Download, Eye, Calendar, DollarSign } from "lucide-react";
import { getProjectBanner, handleBannerError } from "../../utils/projectUtils";
import {
  GamepadIcon,
  LightBulbIcon,
  ShoppingCartIcon,
  PackageIcon,
  ClipboardDocumentListIcon,
} from "../icons/Icons";

const InventoryTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"inventory" | "history">(
    "inventory"
  );
  const [inventory, setInventory] = useState<GameProject[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryFilters, setInventoryFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 10,
  });
  const [historyFilters, setHistoryFilters] = useState<PurchaseHistoryFilters>({
    page: 1,
    limit: 10,
  });
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getInventory(inventoryFilters);
      setInventory(response.data?.projects || []);
      setInventoryTotal(response.data?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [inventoryFilters]);

  const loadPurchaseHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPurchaseHistory(historyFilters);
      setPurchaseHistory(response.data?.projects || []);
      setHistoryTotal(response.data?.total || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load purchase history"
      );
    } finally {
      setLoading(false);
    }
  }, [historyFilters]);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiService.getPublisherStats();
      setStats(response);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "inventory") {
      loadInventory();
    } else {
      loadPurchaseHistory();
    }
    loadStats();
  }, [activeTab, loadInventory, loadPurchaseHistory, loadStats]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case "idea_sale":
        return "Idea Sale";
      case "product_sale":
        return "Product Sale";
      case "dev_collaboration":
        return "Dev Collaboration";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sold":
        return "bg-blue-100 text-blue-800";
      case "in_collaboration":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const handleInventoryFilterChange = (
    newFilters: Partial<InventoryFilters>
  ) => {
    setInventoryFilters({ ...inventoryFilters, ...newFilters, page: 1 });
  };

  const handleHistoryFilterChange = (
    newFilters: Partial<PurchaseHistoryFilters>
  ) => {
    setHistoryFilters({ ...historyFilters, ...newFilters, page: 1 });
  };

  const handleInventoryPageChange = (page: number) => {
    setInventoryFilters({ ...inventoryFilters, page });
  };

  const handleHistoryPageChange = (page: number) => {
    setHistoryFilters({ ...historyFilters, page });
  };

  const renderInventoryItem = (project: GameProject) => (
    <div
      key={project._id}
      className="bg-gray-800/60 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {project.thumbnail && (
          <div className="w-full lg:w-48 h-32 lg:h-24 overflow-hidden rounded-lg flex-shrink-0">
            <img
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
            <h3 className="text-lg font-semibold text-white">
              {project.title}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                project.status
              )} self-start sm:self-auto`}
            >
              {project.status}
            </span>
          </div>

          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {project.shortDescription}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <span className="text-indigo-400 font-medium">
                {getProjectTypeLabel(project.projectType)}
              </span>
            </div>
            {project.soldAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Purchased: {new Date(project.soldAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {project.ideaSaleData?.askingPrice && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-green-400 font-medium">
                  {formatPrice(project.ideaSaleData.askingPrice)}
                </span>
              </div>
            )}
            {project.productSaleData?.askingPrice && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-blue-400 font-medium">
                  {formatPrice(project.productSaleData.askingPrice)}
                </span>
              </div>
            )}
          </div>

          {project.originalDeveloper && (
            <div className="text-xs text-gray-500 mb-3">
              <span>Original Creator: </span>
              <span className="text-gray-300 font-medium">
                {project.originalDeveloper.firstName}{" "}
                {project.originalDeveloper.lastName}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
              <Eye className="h-3 w-3" />
              View Details
            </button>
            <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
              <Download className="h-3 w-3" />
              Download Assets
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPurchaseHistoryItem = (project: GameProject) => (
    <div
      key={project._id}
      className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white mb-1">
            {project.title}
          </h3>
          <p className="text-gray-400 text-sm mb-2 line-clamp-1">
            {project.shortDescription}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="text-indigo-400 font-medium">
              {getProjectTypeLabel(project.projectType)}
            </span>
            {project.soldAt && (
              <span>
                Purchased: {new Date(project.soldAt).toLocaleDateString()}
              </span>
            )}
            {project.originalDeveloper && (
              <span>
                From: {project.originalDeveloper.firstName}{" "}
                {project.originalDeveloper.lastName}
              </span>
            )}
            {project.ideaSaleData?.askingPrice && (
              <span className="text-green-400 font-medium">
                {formatPrice(project.ideaSaleData.askingPrice)}
              </span>
            )}
            {project.productSaleData?.askingPrice && (
              <span className="text-blue-400 font-medium">
                {formatPrice(project.productSaleData.askingPrice)}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
            View
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Inventory Management
        </h2>
        <p className="text-gray-400">
          Manage your purchased games and view purchase history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">
              <GamepadIcon className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Total Purchases
            </h3>
            <div className="text-xl font-bold text-indigo-400">
              {stats?.totalPurchases || inventoryTotal}
            </div>
          </div>
        </div>

        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">
              <LightBulbIcon className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Idea Sales
            </h3>
            <div className="text-xl font-bold text-green-400">
              {stats?.ideaSales || 0}
            </div>
          </div>
        </div>

        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">
              <ShoppingCartIcon className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Product Sales
            </h3>
            <div className="text-xl font-bold text-blue-400">
              {stats?.productSales || 0}
            </div>
          </div>
        </div>

        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🤝</div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Collaborations
            </h3>
            <div className="text-xl font-bold text-purple-400">
              {stats?.collaborations || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/60 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "inventory"
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          My Inventory ({inventoryTotal})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "history"
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          Purchase History ({historyTotal})
        </button>
      </div>

      {/* Filters */}
      {activeTab === "inventory" && (
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Inventory Filters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={inventoryFilters.projectType || ""}
              onChange={(e) =>
                handleInventoryFilterChange({
                  projectType: (e.target.value as any) || undefined,
                })
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="idea_sale">Idea Sale</option>
              <option value="product_sale">Product Sale</option>
              <option value="dev_collaboration">Dev Collaboration</option>
            </select>

            <select
              value={inventoryFilters.status || ""}
              onChange={(e) =>
                handleInventoryFilterChange({
                  status: (e.target.value as any) || undefined,
                })
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="sold">Sold</option>
              <option value="in_collaboration">In Collaboration</option>
              <option value="completed">Completed</option>
            </select>

            <input
              type="text"
              value={inventoryFilters.gameGenre || ""}
              onChange={(e) =>
                handleInventoryFilterChange({
                  gameGenre: e.target.value || undefined,
                })
              }
              placeholder="Genre filter"
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <select
              value={inventoryFilters.sortBy || ""}
              onChange={(e) =>
                handleInventoryFilterChange({
                  sortBy: (e.target.value as any) || undefined,
                })
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Sort by</option>
              <option value="soldAt">Purchase Date</option>
              <option value="askingPrice">Price</option>
              <option value="createdAt">Created Date</option>
            </select>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {activeTab === "inventory" ? (
            <>
              {inventory.length === 0 ? (
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-8 text-center">
                  <div className="text-6xl mb-4">
                    <PackageIcon className="w-16 h-16 mx-auto text-blue-400" />
                  </div>
                  <p className="text-gray-400 text-lg mb-2">
                    No items in your inventory
                  </p>
                  <p className="text-gray-500 text-sm">
                    Start browsing games to build your collection
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inventory.map(renderInventoryItem)}

                  {/* Pagination for Inventory */}
                  {Math.ceil(inventoryTotal / (inventoryFilters.limit || 10)) >
                    1 && (
                    <div className="flex justify-center items-center space-x-2 mt-6">
                      <button
                        onClick={() =>
                          handleInventoryPageChange(
                            (inventoryFilters.page || 1) - 1
                          )
                        }
                        disabled={inventoryFilters.page === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <span className="text-sm text-gray-400">
                        Page {inventoryFilters.page || 1} of{" "}
                        {Math.ceil(
                          inventoryTotal / (inventoryFilters.limit || 10)
                        )}
                      </span>

                      <button
                        onClick={() =>
                          handleInventoryPageChange(
                            (inventoryFilters.page || 1) + 1
                          )
                        }
                        disabled={
                          (inventoryFilters.page || 1) >=
                          Math.ceil(
                            inventoryTotal / (inventoryFilters.limit || 10)
                          )
                        }
                        className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {purchaseHistory.length === 0 ? (
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-8 text-center">
                  <div className="text-6xl mb-4">
                    <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-lg mb-2">
                    No purchase history
                  </p>
                  <p className="text-gray-500 text-sm">
                    Your purchase history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchaseHistory.map(renderPurchaseHistoryItem)}

                  {/* Pagination for History */}
                  {Math.ceil(historyTotal / (historyFilters.limit || 10)) >
                    1 && (
                    <div className="flex justify-center items-center space-x-2 mt-6">
                      <button
                        onClick={() =>
                          handleHistoryPageChange(
                            (historyFilters.page || 1) - 1
                          )
                        }
                        disabled={historyFilters.page === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <span className="text-sm text-gray-400">
                        Page {historyFilters.page || 1} of{" "}
                        {Math.ceil(historyTotal / (historyFilters.limit || 10))}
                      </span>

                      <button
                        onClick={() =>
                          handleHistoryPageChange(
                            (historyFilters.page || 1) + 1
                          )
                        }
                        disabled={
                          (historyFilters.page || 1) >=
                          Math.ceil(historyTotal / (historyFilters.limit || 10))
                        }
                        className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryTab;
