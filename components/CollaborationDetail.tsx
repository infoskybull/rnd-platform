import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { useCollaborations } from "../hooks/useCollaborations";
import { Collaboration, AddUpdateRequest } from "../types";

interface CollaborationDetailProps {
  collaborationId: string;
  userRole: "publisher" | "creator";
  onClose: () => void;
}

const CollaborationDetail: React.FC<CollaborationDetailProps> = ({
  collaborationId,
  userRole,
  onClose,
}) => {
  const {
    getCollaborationById,
    addCollaborationUpdate,
    updateCollaboration,
    acceptCollaboration,
    rejectCollaboration,
  } = useCollaborations();

  const [collaboration, setCollaboration] = useState<Collaboration | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [newUpdate, setNewUpdate] = useState<AddUpdateRequest>({
    type: "progress",
    title: "",
    description: "",
    attachments: [],
  });

  useEffect(() => {
    const loadCollaboration = async () => {
      try {
        setLoading(true);
        const data = await getCollaborationById(collaborationId);
        if (data) {
          setCollaboration(data);
        } else {
          setError("Collaboration not found");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load collaboration"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCollaboration();
  }, [collaborationId, getCollaborationById]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCollaborationUpdate(collaborationId, newUpdate);
      setNewUpdate({
        type: "progress",
        title: "",
        description: "",
        attachments: [],
      });
      setShowAddUpdate(false);

      // Refresh collaboration data
      const updatedData = await getCollaborationById(collaborationId);
      if (updatedData) {
        setCollaboration(updatedData);
      }
    } catch (err) {
      console.error("Failed to add update:", err);
    }
  };

  const handleAcceptCollaboration = async () => {
    try {
      await acceptCollaboration(collaborationId);
      const updatedData = await getCollaborationById(collaborationId);
      if (updatedData) {
        setCollaboration(updatedData);
      }
    } catch (err) {
      console.error("Failed to accept collaboration:", err);
    }
  };

  const handleRejectCollaboration = async () => {
    try {
      await rejectCollaboration(collaborationId);
      const updatedData = await getCollaborationById(collaborationId);
      if (updatedData) {
        setCollaboration(updatedData);
      }
    } catch (err) {
      console.error("Failed to reject collaboration:", err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <div className="text-white mt-4">Loading collaboration...</div>
        </div>
      </div>
    );
  }

  if (error || !collaboration) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md">
          <div className="text-red-400 mb-4">
            {error || "Collaboration not found"}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {collaboration.project?.title}
              </h2>
              <div className="flex gap-2">
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
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Budget</div>
              <div className="text-2xl font-bold text-green-400">
                {formatPrice(collaboration.budget)}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Timeline</div>
              <div className="text-2xl font-bold text-white">
                {collaboration.timeline}
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Progress</div>
              <div className="text-2xl font-bold text-blue-400">
                {collaboration.progressPercentage}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Progress</div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${collaboration.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Description and Deliverables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Description
              </h3>
              <p className="text-gray-300">{collaboration.description}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Deliverables
              </h3>
              <p className="text-gray-300">{collaboration.deliverables}</p>
            </div>
          </div>

          {/* Milestones */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Milestones
            </h3>
            <div className="space-y-2">
              {collaboration.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    collaboration.completedMilestones.includes(milestone)
                      ? "bg-green-900/20 border border-green-500/30"
                      : "bg-gray-700/50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full ${
                      collaboration.completedMilestones.includes(milestone)
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  />
                  <span
                    className={`${
                      collaboration.completedMilestones.includes(milestone)
                        ? "text-green-400 line-through"
                        : "text-white"
                    }`}
                  >
                    {milestone}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Communication Details */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Communication
            </h3>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="mb-2">
                <strong className="text-gray-300">Channels:</strong>{" "}
                <span className="text-white">
                  {collaboration.communicationChannels.join(", ")}
                </span>
              </div>
              <div>
                <strong className="text-gray-300">Details:</strong>{" "}
                <span className="text-white">
                  {collaboration.communicationDetails}
                </span>
              </div>
            </div>
          </div>

          {/* Updates */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white">Updates</h3>
              <button
                onClick={() => setShowAddUpdate(!showAddUpdate)}
                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
              >
                {showAddUpdate ? "Cancel" : "Add Update"}
              </button>
            </div>

            {showAddUpdate && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                <form onSubmit={handleAddUpdate} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={newUpdate.type}
                      onChange={(e) =>
                        setNewUpdate((prev) => ({
                          ...prev,
                          type: e.target.value as any,
                        }))
                      }
                      className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm"
                    >
                      <option value="progress">Progress Update</option>
                      <option value="milestone">Milestone</option>
                      <option value="message">Message</option>
                      <option value="file_upload">File Upload</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Update title"
                      value={newUpdate.title}
                      onChange={(e) =>
                        setNewUpdate((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm"
                      required
                    />
                  </div>
                  <textarea
                    placeholder="Update description"
                    value={newUpdate.description}
                    onChange={(e) =>
                      setNewUpdate((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm"
                    rows={3}
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      Add Update
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddUpdate(false)}
                      className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {collaboration.updates.map((update, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white">{update.title}</h4>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">
                        {update.type}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(update.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{update.description}</p>
                  {update.attachments && update.attachments.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-1">
                        Attachments:
                      </div>
                      {update.attachments.map((attachment, idx) => (
                        <a
                          key={idx}
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-xs mr-2"
                        >
                          Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  {update.type === "message" && (
                    <div className="mt-3">
                      <button
                        onClick={async () => {
                          const reason = window.prompt(
                            "Nhập lý do report tin nhắn",
                            "Tin nhắn có nội dung spam/vi phạm"
                          );
                          if (!reason) return;
                          const attachmentsInput = window.prompt(
                            "Nhập URLs đính kèm (phân tách bằng dấu phẩy)",
                            ""
                          );
                          const attachments = attachmentsInput
                            ? attachmentsInput
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : [];
                          try {
                            await apiService.reportCollaborationMessage(
                              collaborationId,
                              (update as any).id ||
                                (update as any)._id ||
                                (update as any).messageId ||
                                `${index}`,
                              { reason, attachments }
                            );
                            alert("Report submitted");
                          } catch (err: any) {
                            alert(err?.message || "Failed to submit report");
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Report message
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {userRole === "creator" && collaboration.status === "pending" && (
            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleAcceptCollaboration}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Accept Collaboration
              </button>
              <button
                onClick={handleRejectCollaboration}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject Collaboration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationDetail;
