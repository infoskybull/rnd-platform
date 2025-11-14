import React, { useState } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

interface MilestoneStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  milestoneTitle: string;
  milestoneIndex: number;
  currentStatus: boolean;
  loading?: boolean;
}

const MilestoneStatusUpdateModal: React.FC<MilestoneStatusUpdateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  milestoneTitle,
  milestoneIndex,
  currentStatus,
  loading = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update milestone status"
      );
    }
  };

  const actionText = currentStatus ? "mark as incomplete" : "mark as complete";
  const statusText = currentStatus ? "completed" : "incomplete";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {currentStatus ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            )}
            <h2 className="text-xl font-semibold text-white">
              Confirm Milestone Update
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-gray-300 mb-2">
              Are you sure you want to{" "}
              <span className="font-semibold text-white">{actionText}</span> this
              milestone?
            </p>
            <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
              <div className="text-sm text-gray-400 mb-1">Milestone:</div>
              <div className="text-base font-medium text-white">
                {milestoneTitle}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Current status:{" "}
                <span
                  className={`font-medium ${
                    currentStatus ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {statusText}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}

          <div className="text-xs text-gray-400 mt-4">
            Note: Updating milestone status will automatically recalculate the
            collaboration progress and phase.
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              currentStatus
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              `Confirm ${currentStatus ? "Incomplete" : "Complete"}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilestoneStatusUpdateModal;

