import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCollaborations } from "../hooks/useCollaborations";
import { Collaboration } from "../types";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import RoleBadge from "../components/RoleBadge";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const CollaborationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  console.log("user", user);
  console.log("id", id);
  console.log("isAuthenticated", isAuthenticated);
  console.log("isLoading", isLoading);
  const {
    getCollaborationById,
    addCollaborationUpdate,
    acceptCollaboration,
    rejectCollaboration,
  } = useCollaborations();

  const [collaboration, setCollaboration] = useState<Collaboration | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    type: "progress" as "milestone" | "progress" | "message" | "file_upload",
    title: "",
    description: "",
    attachments: [] as string[],
  });

  useEffect(() => {
    // Wait for authentication to finish loading
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!id) {
      setError("Collaboration ID not provided");
      setLoading(false);
      return;
    }

    const loadCollaboration = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCollaborationById(id);
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
  }, [id, isAuthenticated, isLoading, navigate, getCollaborationById]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await addCollaborationUpdate(id, newUpdate);
      setNewUpdate({
        type: "progress",
        title: "",
        description: "",
        attachments: [],
      });
      setShowAddUpdate(false);

      // Refresh collaboration data
      const updatedData = await getCollaborationById(id);
      if (updatedData) {
        setCollaboration(updatedData);
      }
    } catch (err) {
      console.error("Failed to add update:", err);
    }
  };

  const handleAcceptCollaboration = async () => {
    if (!id) return;
    try {
      await acceptCollaboration(id);
      const updatedData = await getCollaborationById(id);
      if (updatedData) {
        setCollaboration(updatedData);
      }
    } catch (err) {
      console.error("Failed to accept collaboration:", err);
    }
  };

  const handleRejectCollaboration = async () => {
    if (!id) return;
    try {
      await rejectCollaboration(id);
      const updatedData = await getCollaborationById(id);
      if (updatedData) {
        setCollaboration(updatedData);
      }
    } catch (err) {
      console.error("Failed to reject collaboration:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        return "bg-yellow-600/20 text-yellow-300 border-yellow-500/30";
      case "active":
        return "bg-green-600/20 text-green-300 border-green-500/30";
      case "completed":
        return "bg-blue-600/20 text-blue-300 border-blue-500/30";
      case "cancelled":
        return "bg-red-600/20 text-red-300 border-red-500/30";
      default:
        return "bg-gray-600/20 text-gray-300 border-gray-500/30";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "planning":
        return "bg-purple-600/20 text-purple-300 border-purple-500/30";
      case "development":
        return "bg-blue-600/20 text-blue-300 border-blue-500/30";
      case "testing":
        return "bg-orange-600/20 text-orange-300 border-orange-500/30";
      case "deployment":
        return "bg-green-600/20 text-green-300 border-green-500/30";
      case "completed":
        return "bg-gray-600/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-gray-600/20 text-gray-300 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <div className="text-gray-300 mt-4">
            {isLoading
              ? "Checking authentication..."
              : "Loading collaboration..."}
          </div>
        </div>
      </div>
    );
  }

  if (error || !collaboration) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-lg">
            {error || "Collaboration not found"}
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Additional safety check for user object
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-lg">
            User not authenticated. Please log in again.
          </div>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Responsive Navigation */}
      <ResponsiveNavbar
        title="Collaboration Details"
        user={user}
        onLogout={handleLogout}
        backButton={{
          text: "Back to Dashboard",
          onClick: () => navigate("/dashboard"),
        }}
      />

      {/* Header */}
      <div className="bg-gray-800/60 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-600 hidden sm:block" />
              <h1 className="text-lg sm:text-xl font-semibold text-white">
                Collaboration Details
              </h1>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border flex items-center gap-1 ${getStatusColor(
                  collaboration.status
                )}`}
              >
                {getStatusIcon(collaboration.status)}
                <span className="hidden sm:inline">
                  {collaboration.status.toUpperCase()}
                </span>
                <span className="sm:hidden">
                  {collaboration.status.charAt(0).toUpperCase()}
                </span>
              </span>
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getPhaseColor(
                  collaboration.currentPhase
                )}`}
              >
                <span className="hidden sm:inline">
                  {collaboration.currentPhase.toUpperCase()}
                </span>
                <span className="sm:hidden">
                  {collaboration.currentPhase.charAt(0).toUpperCase()}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Project Overview */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {collaboration.project?.title}
              </h2>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                {collaboration.project?.shortDescription}
              </p>

              {/* Progress Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-300">
                    Progress
                  </span>
                  <span className="text-sm font-medium text-gray-300">
                    {collaboration.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                  <div
                    className="bg-indigo-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                    style={{ width: `${collaboration.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    <span className="text-xs sm:text-sm text-gray-300">
                      Budget
                    </span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-green-400">
                    {formatPrice(collaboration.budget)}
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    <span className="text-xs sm:text-sm text-gray-300">
                      Timeline
                    </span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-blue-400">
                    {collaboration.timeline}
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    <span className="text-xs sm:text-sm text-gray-300">
                      Phase
                    </span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-purple-400 capitalize">
                    {collaboration.currentPhase}
                  </div>
                </div>
              </div>
            </div>

            {/* Description and Deliverables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                  Description
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                  {collaboration.description}
                </p>
              </div>
              <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                  Deliverables
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                  {collaboration.deliverables}
                </p>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                Milestones
              </h3>
              <div className="space-y-3">
                {collaboration.milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      collaboration.completedMilestones.includes(milestone)
                        ? "bg-green-600/20 border-green-500/30"
                        : "bg-gray-700/50 border-gray-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                        collaboration.completedMilestones.includes(milestone)
                          ? "bg-green-500 text-white"
                          : "bg-gray-300"
                      }`}
                    >
                      {collaboration.completedMilestones.includes(
                        milestone
                      ) && <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3" />}
                    </div>
                    <span
                      className={`text-sm sm:text-base ${
                        collaboration.completedMilestones.includes(milestone)
                          ? "text-green-300 line-through"
                          : "text-white"
                      }`}
                    >
                      {milestone}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Updates */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Updates
                </h3>
                <button
                  onClick={() => setShowAddUpdate(!showAddUpdate)}
                  className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm w-full sm:w-auto"
                >
                  {showAddUpdate ? "Cancel" : "Add Update"}
                </button>
              </div>

              {showAddUpdate && (
                <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                  <form onSubmit={handleAddUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <select
                        value={newUpdate.type}
                        onChange={(e) =>
                          setNewUpdate((prev) => ({
                            ...prev,
                            type: e.target.value as any,
                          }))
                        }
                        className="px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                        className="px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      required
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Add Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddUpdate(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {collaboration.updates.map((update, index) => (
                  <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                      <h4 className="font-semibold text-white text-sm sm:text-base">
                        {update.title}
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <span className="px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded text-xs">
                          {update.type}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">
                      {update.description}
                    </p>
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Participants */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                Participants
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs sm:text-sm text-gray-300 mb-1">
                    Publisher
                  </div>
                  <div className="font-medium text-white text-sm sm:text-base">
                    {collaboration.publisher?.firstName}{" "}
                    {collaboration.publisher?.lastName}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    {collaboration.publisher?.email}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-300 mb-1">
                    Creator
                  </div>
                  <div className="font-medium text-white text-sm sm:text-base">
                    {collaboration.creator?.firstName}{" "}
                    {collaboration.creator?.lastName}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    {collaboration.creator?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Communication */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                Communication
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs sm:text-sm text-gray-300 mb-1">
                    Channels
                  </div>
                  <div className="text-white text-sm sm:text-base">
                    {collaboration.communicationChannels.join(", ")}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-300 mb-1">
                    Details
                  </div>
                  <div className="text-white text-xs sm:text-sm">
                    {collaboration.communicationDetails}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {user &&
              user.role === "creator" &&
              collaboration.status === "pending" && (
                <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleAcceptCollaboration}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Accept Collaboration
                    </button>
                    <button
                      onClick={handleRejectCollaboration}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Reject Collaboration
                    </button>
                  </div>
                </div>
              )}

            {/* Project Info */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                Project Information
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs sm:text-sm text-gray-300 mb-1">
                    Type
                  </div>
                  <div className="text-white capitalize text-sm sm:text-base">
                    {collaboration.project?.projectType?.replace("_", " ")}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-300 mb-1">
                    Status
                  </div>
                  <div className="text-white capitalize text-sm sm:text-base">
                    {collaboration.project?.status?.replace("_", " ")}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-300 mb-1">
                    Created
                  </div>
                  <div className="text-white text-sm sm:text-base">
                    {new Date(collaboration.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-300 mb-1">
                    Last Updated
                  </div>
                  <div className="text-white text-sm sm:text-base">
                    {new Date(collaboration.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationDetailPage;
