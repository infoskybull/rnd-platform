import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCollaborations } from "../../hooks/useCollaborations";
import { useInventory } from "../../hooks/useInventory";
import {
  Collaboration,
  CollaborationFilters,
  CreateCollaborationRequest,
} from "../../types";

interface CollaborationsTabProps {
  userRole: "publisher" | "creator";
  userId: string;
}

const CollaborationsTab: React.FC<CollaborationsTabProps> = ({
  userRole,
  userId,
}) => {
  const navigate = useNavigate();
  const {
    collaborations,
    collaborationStats,
    loading,
    error,
    loadPublisherCollaborations,
    loadDeveloperCollaborations,
    loadPendingCollaborations,
    loadPublisherCollaborationStats,
    loadDeveloperCollaborationStats,
    createCollaboration,
    acceptCollaboration,
    rejectCollaboration,
    refreshPublisherData,
    refreshDeveloperData,
    clearError,
  } = useCollaborations();

  // Use inventory data for additional context
  const {
    inventory,
    purchaseHistory,
    inventoryStats,
    purchaseHistoryStats,
    loadInventory,
    loadPurchaseHistory,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<
    "active" | "pending" | "completed"
  >("active");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [filters, setFilters] = useState<CollaborationFilters>({
    page: 1,
    limit: 5,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Create collaboration form state
  const [createForm, setCreateForm] = useState<CreateCollaborationRequest>({
    projectId: "",
    description: "",
    deliverables: "",
    budget: 0,
    timeline: "",
    milestones: [],
    communicationChannels: [],
    communicationDetails: "",
    termsAndConditions: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    console.log(
      "CollaborationsTab useEffect - userRole:",
      userRole,
      "filters:",
      filters
    );
    if (userRole === "publisher") {
      loadPublisherCollaborations(filters);
      loadPublisherCollaborationStats();
      // Load inventory data for additional context
      loadInventory();
      loadPurchaseHistory();
    } else {
      loadDeveloperCollaborations(filters);
      loadDeveloperCollaborationStats();
      // Load inventory data for additional context
      loadInventory();
      loadPurchaseHistory();
    }
  }, [
    userRole,
    filters,
    loadPublisherCollaborations,
    loadDeveloperCollaborations,
    loadPublisherCollaborationStats,
    loadDeveloperCollaborationStats,
    loadInventory,
    loadPurchaseHistory,
  ]);

  const handleFilterChange = (newFilters: Partial<CollaborationFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleCreateCollaboration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCollaboration(createForm);
      setShowCreateForm(false);
      setCreateForm({
        projectId: "",
        description: "",
        deliverables: "",
        budget: 0,
        timeline: "",
        milestones: [],
        communicationChannels: [],
        communicationDetails: "",
        termsAndConditions: "",
        startDate: "",
        endDate: "",
      });
      if (userRole === "publisher") {
        refreshPublisherData();
      } else {
        refreshDeveloperData();
      }
    } catch (err) {
      console.error("Failed to create collaboration:", err);
    }
  };

  const handleAcceptCollaboration = async (collaborationId: string) => {
    try {
      await acceptCollaboration(collaborationId);
      if (userRole === "creator") {
        refreshDeveloperData();
      }
    } catch (err) {
      console.error("Failed to accept collaboration:", err);
    }
  };

  const handleRejectCollaboration = async (collaborationId: string) => {
    try {
      await rejectCollaboration(collaborationId);
      if (userRole === "creator") {
        refreshDeveloperData();
      }
    } catch (err) {
      console.error("Failed to reject collaboration:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "planning":
        return "bg-purple-100 text-purple-800";
      case "development":
        return "bg-blue-100 text-blue-800";
      case "testing":
        return "bg-orange-100 text-orange-800";
      case "deployment":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Calculate stats from collaborations data
  const calculateStatsFromCollaborations = () => {
    // Total Purchases: Total number of collaborations (all purchases/collaborations)
    const totalPurchases = collaborations.length;

    // Total Spent: Sum of all budgets from collaborations
    const totalSpent = collaborations.reduce((sum, collaboration) => {
      return sum + (collaboration.budget || 0);
    }, 0);

    // Active Collaborations: Collaborations with status "active"
    const activeCollaborations = collaborations.filter(
      (c) => c.status === "active"
    ).length;

    // Completed Contracts: Collaborations with status "completed"
    const completedContracts = collaborations.filter(
      (c) => c.status === "completed"
    ).length;

    return {
      totalPurchases,
      totalSpent,
      activeCollaborations,
      completedContracts,
    };
  };

  const calculatedStats = calculateStatsFromCollaborations();

  // Debug logging
  useEffect(() => {
    console.log("CollaborationsTab - collaborationStats:", collaborationStats);
    console.log("CollaborationsTab - collaborations:", collaborations);
    console.log("CollaborationsTab - inventory:", inventory);
    console.log("CollaborationsTab - purchaseHistory:", purchaseHistory);
    console.log("CollaborationsTab - inventoryStats:", inventoryStats);
    console.log("CollaborationsTab - calculatedStats:", calculatedStats);
  }, [
    collaborationStats,
    collaborations,
    inventory,
    purchaseHistory,
    inventoryStats,
    calculatedStats,
  ]);

  const renderCollaborationItem = (collaboration: Collaboration) => (
    <div
      key={collaboration._id}
      className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6 hover:border-indigo-500/50 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2 truncate">
            {collaboration.project?.title}
          </h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {collaboration.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              collaboration.status
            )}`}
          >
            {collaboration.status.toUpperCase()}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(
              collaboration.currentPhase
            )}`}
          >
            {collaboration.currentPhase.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Budget</div>
          <div className="text-lg font-semibold text-green-400">
            {formatPrice(collaboration.budget)}
          </div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Timeline</div>
          <div className="text-lg font-semibold text-white">
            {collaboration.timeline}
          </div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Progress</div>
          <div className="text-lg font-semibold text-blue-400">
            {collaboration.progressPercentage}%
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Progress Bar</div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${collaboration.progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-sm text-gray-400">
          <div className="truncate">
            <strong>Publisher:</strong>{" "}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${collaboration.publisherId}`);
              }}
              className="text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              {collaboration.publisher?.firstName}{" "}
              {collaboration.publisher?.lastName}
            </button>
          </div>
          <div className="truncate">
            <strong>Creator:</strong>{" "}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${collaboration.creatorId}`);
              }}
              className="text-purple-400 hover:text-purple-300 hover:underline"
            >
              {collaboration.creator?.firstName}{" "}
              {collaboration.creator?.lastName}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/collaboration/${collaboration._id}`)}
            className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
          >
            View Details
          </button>
          {userRole === "creator" && collaboration.status === "pending" && (
            <>
              <button
                onClick={() => handleAcceptCollaboration(collaboration._id)}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleRejectCollaboration(collaboration._id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderCreateForm = () => (
    <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Create New Collaboration
      </h3>
      <form onSubmit={handleCreateCollaboration} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project ID
            </label>
            <input
              type="text"
              value={createForm.projectId}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  projectId: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget
            </label>
            <input
              type="number"
              value={createForm.budget}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  budget: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={createForm.description}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deliverables
          </label>
          <textarea
            value={createForm.deliverables}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                deliverables: e.target.value,
              }))
            }
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Timeline
            </label>
            <input
              type="text"
              value={createForm.timeline}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, timeline: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., 3 months"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Communication Channels
            </label>
            <input
              type="text"
              value={createForm.communicationChannels.join(", ")}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  communicationChannels: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s),
                }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., email, discord, slack"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Collaboration
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-red-400">{error}</div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Collaborations</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              if (userRole === "publisher") {
                refreshPublisherData();
              } else {
                refreshDeveloperData();
              }
              // Also refresh inventory data for additional context
              loadInventory();
              loadPurchaseHistory();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
          {userRole === "publisher" && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showCreateForm ? "Cancel" : "Create Collaboration"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <div className="text-2xl font-bold text-white">
            {calculatedStats.totalPurchases}
          </div>
          <div className="text-sm text-gray-400">Total Collaborations</div>
        </div>
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-400">
            {formatPrice(calculatedStats.totalSpent)}
          </div>
          <div className="text-sm text-gray-400">Total Budget</div>
        </div>
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <div className="text-2xl font-bold text-blue-400">
            {calculatedStats.activeCollaborations}
          </div>
          <div className="text-sm text-gray-400">Active Collaborations</div>
        </div>
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
          <div className="text-2xl font-bold text-purple-400">
            {calculatedStats.completedContracts}
          </div>
          <div className="text-sm text-gray-400">Completed Collaborations</div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && renderCreateForm()}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search collaborations..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              handleFilterChange({
                status: (e.target.value as any) || undefined,
              })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.currentPhase || ""}
            onChange={(e) =>
              handleFilterChange({
                currentPhase: (e.target.value as any) || undefined,
              })
            }
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Phases</option>
            <option value="planning">Planning</option>
            <option value="development">Development</option>
            <option value="testing">Testing</option>
            <option value="deployment">Deployment</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Collaborations List */}
      <div className="space-y-4">
        {collaborations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No collaborations found</div>
            <div className="text-gray-500 text-sm mt-2">
              {userRole === "publisher"
                ? "Create your first collaboration to get started"
                : "No collaboration requests available"}
            </div>
          </div>
        ) : (
          collaborations.map(renderCollaborationItem)
        )}
      </div>
    </div>
  );
};

export default CollaborationsTab;
