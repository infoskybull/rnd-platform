import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { GameProject } from "../types";
import PurchaseButton from "./PurchaseButton";
import { GamepadIcon, PackageIcon } from "./icons/Icons";

const PurchaseInventoryDemo: React.FC = () => {
  const [projectsForSale, setProjectsForSale] = useState<GameProject[]>([]);
  const [inventory, setInventory] = useState<GameProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "inventory">("browse");

  const loadProjectsForSale = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getProjectsForSale({ limit: 10 });
      setProjectsForSale(response.data?.projects || response.projects || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load projects for sale"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getInventory({ limit: 10 });
      setInventory(response.data?.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "browse") {
      loadProjectsForSale();
    } else {
      loadInventory();
    }
  }, [activeTab]);

  const handlePurchaseSuccess = (result: any) => {
    console.log("Purchase successful:", result);
    // Refresh both tabs
    loadProjectsForSale();
    loadInventory();
  };

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

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Purchase & Inventory Demo</h1>
        <p className="text-gray-400">
          Test the purchase and inventory functionality
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/60 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab("browse")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "browse"
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          Browse Projects ({projectsForSale.length})
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "inventory"
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          My Inventory ({inventory.length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-6">
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
          {activeTab === "browse" ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Projects Available for Purchase
              </h2>
              {projectsForSale.length === 0 ? (
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-8 text-center">
                  <div className="text-6xl mb-4">
                    <GamepadIcon className="w-16 h-16 mx-auto text-blue-400" />
                  </div>
                  <p className="text-gray-400 text-lg mb-2">
                    No projects available for purchase
                  </p>
                  <p className="text-gray-500 text-sm">
                    Check back later for new projects
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectsForSale.map((project) => (
                    <div
                      key={project._id}
                      className="bg-gray-800/60 rounded-xl border border-gray-700 p-4"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {project.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {project.shortDescription}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-indigo-400 font-medium text-sm">
                          {getProjectTypeLabel(project.projectType)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === "published"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      {project.ideaSaleData?.askingPrice && (
                        <div className="text-lg font-bold text-green-400 mb-3">
                          {formatPrice(project.ideaSaleData.askingPrice)}
                        </div>
                      )}

                      {project.productSaleData?.askingPrice && (
                        <div className="text-lg font-bold text-blue-400 mb-3">
                          {formatPrice(project.productSaleData.askingPrice)}
                        </div>
                      )}

                      <PurchaseButton
                        project={project}
                        onPurchaseSuccess={handlePurchaseSuccess}
                        onPurchaseError={setError}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">My Inventory</h2>
              {inventory.length === 0 ? (
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-8 text-center">
                  <div className="text-6xl mb-4">
                    <PackageIcon className="w-16 h-16 mx-auto text-blue-400" />
                  </div>
                  <p className="text-gray-400 text-lg mb-2">
                    No items in your inventory
                  </p>
                  <p className="text-gray-500 text-sm">
                    Purchase some projects to see them here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.map((project) => (
                    <div
                      key={project._id}
                      className="bg-gray-800/60 rounded-xl border border-gray-700 p-4"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {project.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {project.shortDescription}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-indigo-400 font-medium text-sm">
                          {getProjectTypeLabel(project.projectType)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === "sold"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      {project.soldAt && (
                        <div className="text-sm text-gray-400 mb-2">
                          Purchased:{" "}
                          {new Date(project.soldAt).toLocaleDateString()}
                        </div>
                      )}

                      {project.originalDeveloper && (
                        <div className="text-sm text-gray-400 mb-3">
                          From: {project.originalDeveloper.firstName}{" "}
                          {project.originalDeveloper.lastName}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                          View Details
                        </button>
                        <button className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors">
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PurchaseInventoryDemo;
