import React, { useState } from "react";
import { contractService } from "../../services/contractService";
import { Contract, SignContractRequest } from "../../types";

interface ContractSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onContractSigned: (contract: Contract) => void;
}

export const ContractSigningModal: React.FC<ContractSigningModalProps> = ({
  isOpen,
  onClose,
  contract,
  onContractSigned,
}) => {
  const [signatureData, setSignatureData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signatureData.trim()) {
      setError("Please provide your signature");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const signData: SignContractRequest = {
        signatureData: signatureData.trim(),
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
      };

      const signedContract = await contractService.signContract(
        contract._id,
        signData
      );
      onContractSigned(signedContract);
      onClose();
      setSignatureData("");
    } catch (err) {
      console.error("Failed to sign contract:", err);
      setError(err instanceof Error ? err.message : "Failed to sign contract");
    } finally {
      setLoading(false);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "127.0.0.1"; // Fallback IP
    }
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
      month: "long",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Sign Contract</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Contract Summary */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {contract.contractTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>
                <span className="text-white ml-2 capitalize">
                  {contract.contractType}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Total Budget:</span>
                <span className="text-white ml-2">
                  {formatCurrency(contract.totalBudget)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Start Date:</span>
                <span className="text-white ml-2">
                  {formatDate(contract.contractStartDate)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">End Date:</span>
                <span className="text-white ml-2">
                  {formatDate(contract.contractEndDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Contract Description */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">
              Description
            </h4>
            <p className="text-gray-300">{contract.contractDescription}</p>
          </div>

          {/* Milestones */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-3">
              Milestones
            </h4>
            <div className="space-y-3">
              {contract.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="bg-gray-700/30 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-white font-medium">
                        {milestone.title}
                      </h5>
                      <p className="text-gray-400 text-sm">
                        {milestone.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-medium">
                        {formatCurrency(milestone.budget)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {milestone.paymentPercentage}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    Due: {formatDate(milestone.dueDate)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">
              Terms and Conditions
            </h4>
            <div className="bg-gray-700/30 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {contract.termsAndConditions}
              </p>
            </div>
          </div>

          {/* Signature Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Digital Signature *
              </label>
              <textarea
                value={signatureData}
                onChange={(e) => setSignatureData(e.target.value)}
                placeholder="Type your full name or signature here..."
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-gray-400 text-xs mt-1">
                By signing this contract, you agree to all terms and conditions
                listed above.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? "Signing..." : "Sign Contract"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
