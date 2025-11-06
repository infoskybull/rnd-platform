import React, { useState, useEffect } from "react";
import { contractService } from "../../services/contractService";
import {
  Contract,
  ContractMilestone,
  UpdateMilestoneRequest,
  MilestoneProgressResponse,
} from "../../types";

interface MilestoneManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onMilestoneUpdated: (contract: Contract) => void;
}

export const MilestoneManagementModal: React.FC<
  MilestoneManagementModalProps
> = ({ isOpen, onClose, contract, onMilestoneUpdated }) => {
  const [milestoneProgress, setMilestoneProgress] =
    useState<MilestoneProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      loadMilestoneProgress();
    }
  }, [isOpen, contract._id]);

  const loadMilestoneProgress = async () => {
    try {
      setLoading(true);
      const progress = await contractService.getMilestoneProgress(contract._id);
      setMilestoneProgress(progress);
    } catch (err) {
      console.error("Failed to load milestone progress:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load milestone progress"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateMilestone = async (
    milestoneId: string,
    updateData: UpdateMilestoneRequest
  ) => {
    try {
      setUpdatingMilestone(milestoneId);
      setError(null);

      await contractService.updateMilestone(
        contract._id,
        milestoneId,
        updateData
      );

      // Reload milestone progress
      await loadMilestoneProgress();

      // Notify parent component
      const updatedContract = await contractService.getContractById(
        contract._id
      );
      onMilestoneUpdated(updatedContract);
    } catch (err) {
      console.error("Failed to update milestone:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update milestone"
      );
    } finally {
      setUpdatingMilestone(null);
    }
  };

  const markMilestoneComplete = (milestoneId: string) => {
    updateMilestone(milestoneId, {
      isCompleted: true,
      progressPercentage: 100,
      completedAt: new Date().toISOString(),
    });
  };

  const updateProgress = (milestoneId: string, progress: number) => {
    updateMilestone(milestoneId, {
      progressPercentage: progress,
      isCompleted: progress === 100,
      completedAt: progress === 100 ? new Date().toISOString() : undefined,
    });
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

  const getStatusColor = (milestone: ContractMilestone) => {
    if (milestone.isCompleted) return "text-green-400";
    if (milestone.paymentStatus === "overdue") return "text-red-400";
    if (milestone.paymentStatus === "paid") return "text-blue-400";
    return "text-yellow-400";
  };

  const getStatusBadge = (milestone: ContractMilestone) => {
    if (milestone.isCompleted) {
      return (
        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
          Completed
        </span>
      );
    }
    if (milestone.paymentStatus === "overdue") {
      return (
        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
          Overdue
        </span>
      );
    }
    if (milestone.paymentStatus === "paid") {
      return (
        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
          Paid
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
        Pending
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              Milestone Management
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Contract Info */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              {contract.contractTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Budget:</span>
                <span className="text-white ml-2">
                  {formatCurrency(contract.totalBudget)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="text-white ml-2 capitalize">
                  {contract.status}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Payment Schedule:</span>
                <span className="text-white ml-2 capitalize">
                  {contract.paymentSchedule}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          {milestoneProgress && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {milestoneProgress.totalProgress}%
                </div>
                <div className="text-sm text-gray-400">Overall Progress</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {milestoneProgress.completedMilestones}
                </div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {milestoneProgress.totalMilestones -
                    milestoneProgress.completedMilestones}
                </div>
                <div className="text-sm text-gray-400">Remaining</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {formatCurrency(milestoneProgress.totalPaid)}
                </div>
                <div className="text-sm text-gray-400">Total Paid</div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Milestones List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Milestones</h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading milestones...</p>
              </div>
            ) : (
              contract.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">
                          {milestone.title}
                        </h4>
                        {getStatusBadge(milestone)}
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        {milestone.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Budget:</span>
                          <span className="text-white ml-1">
                            {formatCurrency(milestone.budget)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Payment:</span>
                          <span className="text-white ml-1">
                            {milestone.paymentPercentage}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Due Date:</span>
                          <span className="text-white ml-1">
                            {formatDate(milestone.dueDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <span className={`ml-1 ${getStatusColor(milestone)}`}>
                            {milestone.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-400">Progress</span>
                      <span className="text-sm text-white">
                        {milestone.isCompleted ? 100 : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${milestone.isCompleted ? 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  {milestone.deliverables.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">
                        Deliverables:
                      </h5>
                      <ul className="list-disc list-inside text-sm text-gray-400">
                        {milestone.deliverables.map((deliverable, idx) => (
                          <li key={idx}>{deliverable}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {contract.status === "active" && !milestone.isCompleted && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateProgress(milestone.id, 50)}
                        disabled={updatingMilestone === milestone.id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        {updatingMilestone === milestone.id
                          ? "Updating..."
                          : "50% Complete"}
                      </button>
                      <button
                        onClick={() => markMilestoneComplete(milestone.id)}
                        disabled={updatingMilestone === milestone.id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        {updatingMilestone === milestone.id
                          ? "Updating..."
                          : "Mark Complete"}
                      </button>
                    </div>
                  )}

                  {/* Completion Info */}
                  {milestone.isCompleted && milestone.completedAt && (
                    <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-sm">
                      <span className="text-green-400">
                        ✓ Completed on {formatDate(milestone.completedAt)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
