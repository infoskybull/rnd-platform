import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contractService } from "../../services/contractService";
import { Contract, ContractStats, ContractFilters, User } from "../../types";
import { ContractCreationModal } from "./ContractCreationModal";
import { ContractSigningModal } from "./ContractSigningModal";
import { MilestoneManagementModal } from "./MilestoneManagementModal";
import { WarningIcon, ClipboardDocumentListIcon } from "../icons/Icons";

interface ContractsTabProps {
  user: User;
}

const ContractsTab: React.FC<ContractsTabProps> = ({ user }) => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContractFilters>({
    page: 1,
    limit: 10,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );

  // Load contracts and stats
  useEffect(() => {
    loadContracts();
    loadStats();
  }, [filters]);

  // Recalculate pending count whenever contracts or stats change
  useEffect(() => {
    if (contracts.length > 0 && stats) {
      const pendingCount = contracts.filter(
        (c) => c.status === "pending_signature" || c.status === "draft"
      ).length;

      console.log("Recalculated Pending Count:", pendingCount);

      if (stats.pendingContracts !== pendingCount) {
        console.log(
          `Updating pending count from ${stats.pendingContracts} to ${pendingCount}`
        );
        setStats({
          ...stats,
          pendingContracts: pendingCount,
        });
      }
    }
  }, [contracts, stats?.totalContracts]); // Only trigger when contracts or total changes

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("user role", user?.role);
      const response =
        user?.role === "publisher"
          ? await contractService.getPublisherContracts(filters)
          : await contractService.getDeveloperContracts(filters);

      console.log("Contracts Response:", response);
      console.log("Total Contracts:", response.contracts.length);

      const statusCounts = response.contracts.reduce((acc: any, c: any) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});

      console.log("Contracts by Status:", statusCounts);

      setContracts(response.contracts);
    } catch (err) {
      console.error("Failed to load contracts:", err);
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData =
        user?.role === "publisher"
          ? await contractService.getPublisherContractStats()
          : await contractService.getDeveloperContractStats();

      console.log("Contract Stats Response:", statsData);
      console.log("Pending Contracts Count:", statsData.pendingContracts);
      console.log("Contracts by Status:", statsData.contractsByStatus);

      setStats(statsData);
    } catch (err) {
      console.error("Failed to load contract stats:", err);
    }
  };

  const handleFilterChange = (newFilters: Partial<ContractFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleContractCreated = (newContract: Contract) => {
    setContracts((prev) => [newContract, ...prev]);
    loadStats(); // Refresh stats
  };

  const handleContractSigned = (signedContract: Contract) => {
    setContracts((prev) =>
      prev.map((c) => (c._id === signedContract._id ? signedContract : c))
    );
    loadStats(); // Refresh stats
  };

  const handleMilestoneUpdated = (updatedContract: Contract) => {
    setContracts((prev) =>
      prev.map((c) => (c._id === updatedContract._id ? updatedContract : c))
    );
    loadStats(); // Refresh stats
  };

  const openSignModal = (contract: Contract) => {
    setSelectedContract(contract);
    setShowSignModal(true);
  };

  const openMilestoneModal = (contract: Contract) => {
    setSelectedContract(contract);
    setShowMilestoneModal(true);
  };

  const handleViewDetails = (contractId: string) => {
    navigate(`/contract/detail/${contractId}`);
  };

  const getStatusColor = (status: Contract["status"]) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "completed":
        return "text-blue-400";
      case "pending_signature":
        return "text-yellow-400";
      case "draft":
        return "text-gray-400";
      case "terminated":
        return "text-red-400";
      case "expired":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBadge = (status: Contract["status"]) => {
    const colors = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      pending_signature:
        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      terminated: "bg-red-500/20 text-red-400 border-red-500/30",
      expired: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status]}`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Contracts</h2>
        <p className="text-gray-400">Manage your contracts and agreements</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-400">
                {stats.activeContracts}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Active</div>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-400">
                {stats.completedContracts}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Completed</div>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">
                {stats.pendingContracts}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Pending</div>
            </div>
          </div>
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-purple-400">
                {formatCurrency(stats.totalBudget)}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">
                Total Budget
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) =>
                handleFilterChange({
                  status: (e.target.value as Contract["status"]) || undefined,
                })
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_signature">Pending Signature</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="terminated">Terminated</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              value={filters.contractType || ""}
              onChange={(e) =>
                handleFilterChange({
                  contractType:
                    (e.target.value as Contract["contractType"]) || undefined,
                })
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="development">Development</option>
              <option value="publishing">Publishing</option>
              <option value="marketing">Marketing</option>
              <option value="support">Support</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search contracts..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-white">Contract History</h3>
          {user?.role === "publisher" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
            >
              Create Contract
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading contracts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">
              <WarningIcon className="w-8 h-8" />
            </div>
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadContracts}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              Try again
            </button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-400" />
            </div>
            <p className="text-gray-400">No contracts found</p>
            <p className="text-gray-500 text-sm">
              {filters.status || filters.contractType || filters.search
                ? "Try adjusting your filters"
                : "Contracts will appear here when you create or receive them"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract._id}
                className="bg-gray-700/50 rounded-lg border border-gray-600 p-4 hover:bg-gray-700/70 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-semibold text-white mb-1">
                      {contract.contractTitle}
                    </h4>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {contract.contractDescription}
                    </p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    {getStatusBadge(contract.status)}
                    <span className="text-base sm:text-lg font-bold text-green-400">
                      {formatCurrency(contract.totalBudget)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white ml-1 capitalize">
                      {contract.contractType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Start:</span>
                    <span className="text-white ml-1">
                      {formatDate(contract.contractStartDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">End:</span>
                    <span className="text-white ml-1">
                      {formatDate(contract.contractEndDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Progress:</span>
                    <span className="text-white ml-1">
                      {contract.milestones.filter((m) => m.isCompleted).length}/
                      {contract.milestones.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="text-xs sm:text-sm text-gray-400">
                    Created: {formatDate(contract.createdAt)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewDetails(contract._id)}
                      className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-blue-400/10 transition-colors"
                    >
                      View Details
                    </button>
                    {contract.status === "pending_signature" &&
                      user?.role === "creator" && (
                        <button
                          onClick={() => openSignModal(contract)}
                          className="text-green-400 hover:text-green-300 text-sm px-2 py-1 rounded hover:bg-green-400/10 transition-colors"
                        >
                          Sign Contract
                        </button>
                      )}
                    {contract.status === "active" &&
                      user?.role === "creator" && (
                        <button
                          onClick={() => openMilestoneModal(contract)}
                          className="text-purple-400 hover:text-purple-300 text-sm px-2 py-1 rounded hover:bg-purple-400/10 transition-colors"
                        >
                          Update Progress
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ContractCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onContractCreated={handleContractCreated}
      />

      {selectedContract && (
        <ContractSigningModal
          isOpen={showSignModal}
          onClose={() => {
            setShowSignModal(false);
            setSelectedContract(null);
          }}
          contract={selectedContract}
          onContractSigned={handleContractSigned}
        />
      )}

      {selectedContract && (
        <MilestoneManagementModal
          isOpen={showMilestoneModal}
          onClose={() => {
            setShowMilestoneModal(false);
            setSelectedContract(null);
          }}
          contract={selectedContract}
          onMilestoneUpdated={handleMilestoneUpdated}
        />
      )}
    </div>
  );
};

export default ContractsTab;
