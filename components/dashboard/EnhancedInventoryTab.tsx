import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInventory } from "../../hooks/useInventory";
import {
  InventoryItem,
  PurchaseHistoryItem,
  InventoryFilters,
  PurchaseHistoryFilters,
  InventoryUpdateData,
} from "../../types";
import {
  PackageIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
} from "../icons/Icons";
import {
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Archive,
  Eye,
  Calendar,
  DollarSign,
  Tag,
  MoreVertical,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { getInventoryItemBanner } from "../../utils/projectUtils";

const EnhancedInventoryTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    inventory,
    purchaseHistory,
    inventoryStats,
    purchaseHistoryStats,
    loading,
    error,
    loadInventory,
    loadPurchaseHistory,
    updateInventoryItem,
    deleteInventoryItem,
    searchInventory,
    getPurchaseHistoryByDateRange,
    exportPurchaseHistory,
    bulkUpdateInventory,
    bulkDeleteInventory,
    refreshAll,
    clearError,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<"inventory" | "history">(
    "inventory"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  // Filters state
  const [inventoryFilters, setInventoryFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 5,
    sortBy: "soldAt",
    sortOrder: "desc",
  });

  const [historyFilters, setHistoryFilters] = useState<PurchaseHistoryFilters>({
    page: 1,
    limit: 5,
    sortBy: "soldAt",
    sortOrder: "desc",
  });

  // Date range for history
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  // Load data on component mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Load data when filters change
  useEffect(() => {
    if (activeTab === "inventory") {
      loadInventory(inventoryFilters);
    } else if (activeTab === "history") {
      if (dateRange.start && dateRange.end) {
        getPurchaseHistoryByDateRange(
          dateRange.start,
          dateRange.end,
          historyFilters
        );
      } else {
        loadPurchaseHistory(historyFilters);
      }
    }
  }, [
    activeTab,
    inventoryFilters,
    historyFilters,
    dateRange,
    loadInventory,
    loadPurchaseHistory,
    getPurchaseHistoryByDateRange,
  ]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      await searchInventory(searchQuery, inventoryFilters);
    } else {
      await loadInventory(inventoryFilters);
    }
  }, [searchQuery, inventoryFilters, searchInventory, loadInventory]);

  // Handle filter changes
  const handleInventoryFilterChange = (
    newFilters: Partial<InventoryFilters>
  ) => {
    setInventoryFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleHistoryFilterChange = (
    newFilters: Partial<PurchaseHistoryFilters>
  ) => {
    setHistoryFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle item selection
  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === inventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inventory.map((item) => item._id));
    }
  };

  // Handle bulk operations
  const handleBulkUpdate = async (updateData: InventoryUpdateData) => {
    const updates = selectedItems.map((id) => ({ id, data: updateData }));
    await bulkUpdateInventory(updates);
    setSelectedItems([]);
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedItems.length} items?`
      )
    ) {
      await bulkDeleteInventory(selectedItems);
      setSelectedItems([]);
    }
  };

  // Handle export
  const handleExport = async (format: "csv" | "json") => {
    await exportPurchaseHistory(format);
  };

  // Handle edit item navigation
  const handleEditItem = (item: InventoryItem) => {
    navigate(`/project-detail/${item._id}`);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // Get project type label
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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "sold":
        return "bg-green-100 text-green-800";
      case "in_collaboration":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get price from project data
  const getProjectPrice = (item: InventoryItem) => {
    return (
      item.ideaSaleData?.askingPrice ||
      item.productSaleData?.askingPrice ||
      item.creatorCollaborationData?.budget ||
      0
    );
  };

  // Render inventory item
  const renderInventoryItem = (item: InventoryItem) => (
    <div
      key={item._id}
      className={`bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4 hover:border-gray-600 transition-colors touch-manipulation ${
        selectedItems.includes(item._id) ? "ring-2 ring-indigo-500" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selectedItems.includes(item._id)}
          onChange={() => handleItemSelect(item._id)}
          className="mt-1"
        />

        {viewMode === "grid" ? (
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  item.status
                )}`}
              >
                {item.status}
              </span>
            </div>

            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {item.shortDescription}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <span className="text-indigo-400 font-medium">
                  {getProjectTypeLabel(item.projectType)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Purchased: {formatDate(item.soldAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-green-400 font-medium">
                  {formatPrice(getProjectPrice(item))}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>Views: {item.viewCount}</span>
              </div>
            </div>

            {(item.ideaSaleData?.tags ||
              item.productSaleData?.tags ||
              item.creatorCollaborationData?.tags) && (
              <div className="flex flex-wrap gap-1 mb-3">
                {(
                  item.ideaSaleData?.tags ||
                  item.productSaleData?.tags ||
                  item.creatorCollaborationData?.tags ||
                  []
                ).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-xs"
                  >
                    <Tag className="h-3 w-3 inline mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {item.originalDeveloper && (
              <div className="text-gray-500 text-sm mb-3">
                <span className="font-medium">Original Creator:</span>{" "}
                {item.originalDeveloper.firstName}{" "}
                {item.originalDeveloper.lastName}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEditItem(item)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Edit"
              >
                <Edit className="h-3 w-3" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() =>
                  updateInventoryItem(item._id, { status: "archived" })
                }
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Archive"
              >
                <Archive className="h-3 w-3" />
                <span className="hidden sm:inline">Archive</span>
              </button>
              <button
                onClick={() => deleteInventoryItem(item._id)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            {/* Mobile List View - Stacked Layout */}
            <div className="block sm:hidden">
              <div className="space-y-3">
                {/* Title and Type */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {getProjectTypeLabel(item.projectType)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Price and Date */}
                <div className="flex justify-between items-center">
                  <div className="text-green-400 font-medium text-sm">
                    {formatPrice(getProjectPrice(item))}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {formatDate(item.soldAt)}
                  </div>
                </div>

                {/* Views and Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-gray-400 text-xs">
                    {item.viewCount} views
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors touch-manipulation active:scale-95"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        updateInventoryItem(item._id, { status: "archived" })
                      }
                      className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors touch-manipulation active:scale-95"
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteInventoryItem(item._id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors touch-manipulation active:scale-95"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Swipe Indicator */}
                <div className="flex justify-center">
                  <div className="w-8 h-1 bg-gray-600 rounded-full opacity-50"></div>
                </div>
              </div>
            </div>

            {/* Desktop List View - Table Layout */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="col-span-2">
                  <h3 className="text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {getProjectTypeLabel(item.projectType)}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-medium">
                    {formatPrice(getProjectPrice(item))}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {formatDate(item.soldAt)}
                  </div>
                </div>
                <div className="text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-center text-gray-400 text-sm">
                  {item.viewCount} views
                </div>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteInventoryItem(item._id)}
                    className="p-1 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render purchase history item
  const renderPurchaseHistoryItem = (item: PurchaseHistoryItem) => (
    <div
      key={item._id}
      className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4 hover:border-gray-600 transition-colors touch-manipulation active:scale-[0.98] cursor-pointer"
      onClick={() => {
        // Add mobile-friendly tap interaction
        if (window.innerWidth < 640) {
          // On mobile, you could expand the card or show more details
          console.log("Mobile tap on purchase history item:", item._id);
        }
      }}
    >
      <div className="space-y-3">
        {/* Header with title and status */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-white mb-1 truncate">
              {item.project.title || "Unknown Project"}
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm mb-2 line-clamp-2">
              {item.project.shortDescription ||
                item.notes ||
                "No description available"}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium self-start flex-shrink-0 ${
              item.status === "completed"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {item.status}
          </span>
        </div>

        {/* Project type and price */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-indigo-400 font-medium text-xs sm:text-sm">
            {getProjectTypeLabel(item.project.projectType || "unknown")}
          </span>
          <span className="text-green-400 font-semibold text-sm sm:text-base">
            {formatPrice(item.purchasePrice)}
          </span>
        </div>

        {/* Purchase date and additional info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Purchased: {formatDate(item.purchaseDate)}</span>
          </div>
          {item.project.viewCount && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{item.project.viewCount} views</span>
            </div>
          )}
        </div>

        {/* Tags if available */}
        {(item.project.ideaSaleData?.tags ||
          item.project.productSaleData?.tags ||
          item.project.creatorCollaborationData?.tags) && (
          <div className="flex flex-wrap gap-1">
            {(
              item.project.ideaSaleData?.tags ||
              item.project.productSaleData?.tags ||
              item.project.creatorCollaborationData?.tags ||
              []
            )
              .slice(0, 3)
              .map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-xs"
                >
                  <Tag className="h-3 w-3 inline mr-1" />
                  {tag}
                </span>
              ))}
            {(
              item.project.ideaSaleData?.tags ||
              item.project.productSaleData?.tags ||
              item.project.creatorCollaborationData?.tags ||
              []
            ).length > 3 && (
              <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded-full text-xs">
                +
                {(
                  item.project.ideaSaleData?.tags ||
                  item.project.productSaleData?.tags ||
                  item.project.creatorCollaborationData?.tags ||
                  []
                ).length - 3}{" "}
                more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            Inventory Management
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Manage your purchased games with advanced features
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={loading}
          className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      {inventoryStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4 hover:border-gray-600 transition-colors">
            <div className="text-center">
              <div className="text-lg sm:text-2xl mb-1 sm:mb-2">
                <PackageIcon className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">
                Total Items
              </h3>
              <div className="text-lg sm:text-xl font-bold text-indigo-400">
                {inventoryStats.totalItems}
              </div>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4 hover:border-gray-600 transition-colors">
            <div className="text-center">
              <div className="text-lg sm:text-2xl mb-1 sm:mb-2">
                <CurrencyDollarIcon className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">
                Total Value
              </h3>
              <div className="text-sm sm:text-xl font-bold text-green-400 break-all">
                {formatPrice(inventoryStats.totalValue)}
              </div>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4 hover:border-gray-600 transition-colors">
            <div className="text-center">
              <div className="text-lg sm:text-2xl mb-1 sm:mb-2">
                <ChartBarIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">
                Avg Price
              </h3>
              <div className="text-sm sm:text-xl font-bold text-blue-400 break-all">
                {formatPrice(inventoryStats.averagePurchasePrice)}
              </div>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4 hover:border-gray-600 transition-colors">
            <div className="text-center">
              <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🆕</div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">
                Recent
              </h3>
              <div className="text-lg sm:text-xl font-bold text-purple-400">
                {inventoryStats.recentPurchases}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/60 rounded-lg p-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex-1 min-w-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === "inventory"
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <span className="hidden sm:inline">Inventory</span>
            <span className="sm:hidden">Inventory</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === "inventory"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              {inventory.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 min-w-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === "history"
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <span className="hidden sm:inline">Purchase History</span>
            <span className="sm:hidden">History</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === "history"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              {purchaseHistory.length}
            </span>
          </div>
        </button>
      </div>

      {/* Search and Controls */}
      {activeTab === "inventory" && (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search inventory..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Search
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {activeTab === "inventory" && selectedItems.length > 0 && (
        <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-indigo-400 font-medium">
              {selectedItems.length} item(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkUpdate({ status: "archived" })}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Archive Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && activeTab === "inventory" && (
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Filters</h3>
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
                  status:
                    (e.target.value as
                      | "sold"
                      | "in_collaboration"
                      | "completed") || undefined,
                })
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="sold">Sold</option>
              <option value="in_collaboration">In Collaboration</option>
              <option value="completed">Completed</option>
            </select>

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
              <option value="title">Title</option>
              <option value="createdAt">Created Date</option>
            </select>

            <select
              value={inventoryFilters.sortOrder || ""}
              onChange={(e) =>
                handleInventoryFilterChange({
                  sortOrder: (e.target.value as any) || undefined,
                })
              }
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}

      {/* Date Range for History */}
      {activeTab === "history" && (
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Date Range Filter
          </h3>
          <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-4 sm:items-end">
            {/* Date inputs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setDateRange({ start: "", end: "" })}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation active:scale-95"
              >
                Clear
              </button>
              <button
                onClick={() => handleExport("csv")}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {activeTab === "inventory" && (
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
                <div className="space-y-2">
                  {/* Desktop Table Header */}
                  <div className="hidden sm:block bg-gray-800/40 rounded-lg p-3">
                    <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <div className="col-span-2">Project</div>
                      <div className="text-center">Price</div>
                      <div className="text-center">Status</div>
                      <div className="text-center">Views</div>
                      <div className="text-center">Actions</div>
                    </div>
                  </div>

                  {/* Inventory Items */}
                  <div className="space-y-2">
                    {inventory.map(renderInventoryItem)}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "history" && (
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
                <div className="space-y-3 sm:space-y-4">
                  {purchaseHistory.map(renderPurchaseHistoryItem)}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedInventoryTab;
