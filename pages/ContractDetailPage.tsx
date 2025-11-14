import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { contractService, Contract } from "../services/contractService";
import { useAuth } from "../hooks/useAuth";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { ContractSigningModal } from "../components/dashboard/ContractSigningModal";
import { MilestoneManagementModal } from "../components/dashboard/MilestoneManagementModal";
import {
  Calendar,
  DollarSign,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  WarningIcon,
  ClipboardDocumentListIcon,
} from "../components/icons/Icons";

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (id && !authLoading) {
      loadContract();
    }
  }, [id, authLoading]);

  const loadContract = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const contractData = await contractService.getContractById(id);
      setContract(contractData);
    } catch (err) {
      console.error("Failed to load contract:", err);
      setError(err instanceof Error ? err.message : "Failed to load contract");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Contract["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending_signature":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "draft":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "terminated":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "expired":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: Contract["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case "pending_signature":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case "draft":
        return <FileText className="w-5 h-5 text-gray-400" />;
      case "terminated":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "expired":
        return <Clock className="w-5 h-5 text-orange-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount == null || isNaN(amount)) {
      return "$0.00";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    if (!date) {
      return "N/A";
    }
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const formatDateTime = (date: Date | string) => {
    if (!date) {
      return "N/A";
    }
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      return dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date/time:", error);
      return "Invalid Date";
    }
  };

  const handleContractSigned = (signedContract: Contract) => {
    setContract(signedContract);
  };

  const handleMilestoneUpdated = (updatedContract: Contract) => {
    setContract(updatedContract);
  };

  const canSignContract = () => {
    if (!contract || !user) return false;

    // Check if contract is in pending signature status
    if (contract.status !== "pending_signature") return false;

    // Check if user is publisher or creator
    const isPublisher =
      user.role === "publisher" && contract.publisherId === user.id;
    const isCreator =
      user.role === "creator" &&
      (contract.creatorId === user.id || contract.creatorId === user.id);

    if (!isPublisher && !isCreator) return false;

    // Check if user has already signed
    if (isPublisher && contract.publisherSignature) return false;
    if (isCreator && contract.creatorSignature) return false;

    return true;
  };

  const canManageMilestones = () => {
    if (!contract || !user) return false;

    // Only active contracts can have milestones updated
    if (contract.status !== "active") return false;

    // Both publisher and creator can manage milestones
    const isPublisher =
      user.role === "publisher" && contract.publisherId === user.id;
    const isCreator =
      user.role === "creator" &&
      (contract.creatorId === user.id || contract.creatorId === user.id);

    return isPublisher || isCreator;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">
            <WarningIcon className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Error Loading Contract
          </h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={loadContract}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">
            <ClipboardDocumentListIcon className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Contract Not Found
          </h1>
          <p className="text-gray-400 mb-4">
            The contract you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Responsive Navigation */}
      <ResponsiveNavbar
        title="Contract Details"
        titleColor="text-indigo-400"
        user={user}
        onLogout={handleLogout}
        backButton={{
          text: "Back to Contracts",
          onClick: () => navigate(-1),
        }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {contract.contractTitle}
              </h1>
              <p className="text-gray-400 text-lg">
                {contract.contractDescription}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`px-4 py-2 rounded-full border flex items-center gap-2 ${getStatusColor(
                  contract.status
                )}`}
              >
                {getStatusIcon(contract.status)}
                <span className="font-medium">
                  {contract.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(contract.totalBudget)}
                </div>
                <div className="text-sm text-gray-400">Total Budget</div>
              </div>

              {/* Sign Contract Button in Header */}
              {canSignContract() && (
                <button
                  onClick={() => setShowSignModal(true)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-green-600/50 animate-pulse"
                >
                  <FileText className="w-5 h-5" />
                  Sign Contract
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          {canSignContract() && (
            <button
              onClick={() => setShowSignModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-green-600/50"
            >
              <FileText className="w-5 h-5" />
              Sign Contract Now
            </button>
          )}

          {canManageMilestones() && (
            <button
              onClick={() => setShowMilestoneModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Update Progress
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Details */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Contract Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Contract Type
                  </label>
                  <p className="text-white capitalize">
                    {contract.contractType}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Payment Schedule
                  </label>
                  <p className="text-white capitalize">
                    {contract.paymentSchedule.replace("_", " ")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Start Date
                  </label>
                  <p className="text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(contract.contractStartDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    End Date
                  </label>
                  <p className="text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(contract.contractEndDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Advance Payment
                  </label>
                  <p className="text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(contract.advancePayment)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Created
                  </label>
                  <p className="text-white flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatDateTime(contract.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Terms and Conditions
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {contract.termsAndConditions}
                </p>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Milestones (
                {contract.milestones?.filter((m) => m.isCompleted).length || 0}/
                {contract.milestones?.length || 0})
              </h2>

              <div className="space-y-4">
                {contract.milestones?.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-lg border ${
                      milestone.isCompleted
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-gray-700/50 border-gray-600"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">
                        {index + 1}. {milestone.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-400">
                          {formatCurrency(milestone.budget ?? 0)}
                        </span>
                        {milestone.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-3">
                      {milestone.description}
                    </p>

                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        Due:{" "}
                        {milestone.dueDate
                          ? formatDate(milestone.dueDate)
                          : "N/A"}
                      </div>
                      <div className="text-gray-400">
                        {milestone.paymentPercentage ?? 0}% of total budget
                      </div>
                    </div>

                    {milestone.deliverables?.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">
                          Deliverables:
                        </h4>
                        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                          {milestone.deliverables?.map((deliverable, idx) => (
                            <li key={idx}>{deliverable}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {milestone.isCompleted && milestone.completedAt && (
                      <div className="mt-3 text-sm text-green-400">
                        Completed on: {formatDateTime(milestone.completedAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Summary */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contract Summary
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Contract ID
                  </label>
                  <p className="text-white font-mono text-sm">{contract._id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Collaboration ID
                  </label>
                  <p className="text-white font-mono text-sm">
                    {contract.collaborationId}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Publisher ID
                  </label>
                  <p className="text-white font-mono text-sm">
                    {contract.publisherId}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Creator ID
                  </label>
                  <p className="text-white font-mono text-sm">
                    {contract.creatorId}
                  </p>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Signatures{" "}
                {contract.isFullySigned && (
                  <span className="text-green-400 text-sm">(Fully Signed)</span>
                )}
              </h3>

              {/* Sign Contract Button in Signatures Section */}
              {canSignContract() && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/50"
                  >
                    <FileText className="w-5 h-5" />
                    Sign Contract
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {contract.status === "pending_signature" &&
                      (user?.role === "publisher" &&
                      contract.publisherId === user.id
                        ? "Waiting for your signature"
                        : user?.role === "creator" &&
                          (contract.creatorId === user.id ||
                            contract.creatorId === user.id)
                        ? "Waiting for your signature"
                        : "Please sign to proceed")}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {contract.publisherSignature && (
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <div className="text-sm font-medium text-white mb-1">
                      Publisher Signature
                    </div>
                    <div className="text-sm text-gray-300 mb-1">
                      Signed:{" "}
                      {formatDateTime(contract.publisherSignature.signedAt)}
                    </div>
                    <div className="text-xs text-gray-400">
                      IP: {contract.publisherSignature.ipAddress}
                    </div>
                  </div>
                )}

                {contract.creatorSignature && (
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <div className="text-sm font-medium text-white mb-1">
                      Creator Signature
                    </div>
                    <div className="text-sm text-gray-300 mb-1">
                      Signed:{" "}
                      {formatDateTime(contract.creatorSignature.signedAt)}
                    </div>
                    <div className="text-xs text-gray-400">
                      IP: {contract.creatorSignature.ipAddress}
                    </div>
                  </div>
                )}

                {/* Show pending signature status */}
                {!contract.isFullySigned &&
                  contract.status === "pending_signature" && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="text-sm font-medium text-yellow-400 mb-1">
                        ⏳ Waiting for Signatures
                      </div>
                      <div className="text-xs text-gray-300">
                        {!contract.publisherSignature &&
                          "Publisher signature pending"}
                        {!contract.publisherSignature &&
                          !contract.creatorSignature &&
                          " • "}
                        {!contract.creatorSignature &&
                          "Creator signature pending"}
                      </div>
                    </div>
                  )}

                {/* Legacy signatures array */}
                {contract.signatures?.map((signature, index) => (
                  <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                    <div className="text-sm text-gray-300 mb-1">
                      Signed: {formatDateTime(signature.signedAt)}
                    </div>
                    <div className="text-xs text-gray-400">
                      IP: {signature.ipAddress}
                    </div>
                  </div>
                ))}

                {contract.activatedAt && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="text-sm font-medium text-green-400 mb-1">
                      Contract Activated
                    </div>
                    <div className="text-xs text-gray-300">
                      {formatDateTime(contract.activatedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>

              <div className="space-y-3">
                {canSignContract() && (
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-600/50"
                  >
                    <FileText className="w-4 h-4" />
                    Sign Contract
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Print Contract
                </button>

                <button
                  onClick={() => {
                    const contractData = JSON.stringify(contract, null, 2);
                    const blob = new Blob([contractData], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `contract-${contract._id}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {contract && (
        <>
          <ContractSigningModal
            isOpen={showSignModal}
            onClose={() => setShowSignModal(false)}
            contract={contract}
            onContractSigned={handleContractSigned}
          />

          <MilestoneManagementModal
            isOpen={showMilestoneModal}
            onClose={() => setShowMilestoneModal(false)}
            contract={contract}
            onMilestoneUpdated={handleMilestoneUpdated}
          />
        </>
      )}
    </div>
  );
};

export default ContractDetailPage;
