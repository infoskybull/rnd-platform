import React, { useState, useEffect } from "react";
import { contractService } from "../../services/contractService";
import { apiService } from "../../services/api";
import {
  Contract,
  CreateContractRequest,
  ContractMilestone,
} from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { WarningIcon } from "../icons/Icons";

interface ContractCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborationId?: string;
  onContractCreated: (contract: Contract) => void;
}

export const ContractCreationModal: React.FC<ContractCreationModalProps> = ({
  isOpen,
  onClose,
  collaborationId,
  onContractCreated,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<CreateContractRequest>>({
    collaborationId: collaborationId || "",
    contractTitle: "",
    contractDescription: "",
    contractType: "development",
    totalBudget: 0,
    advancePayment: 0,
    paymentSchedule: "milestone_based",
    milestones: [],
    termsAndConditions: "",
    contractStartDate: "",
    contractEndDate: "",
  });

  const [milestones, setMilestones] = useState<Partial<ContractMilestone>[]>([
    {
      title: "",
      description: "",
      budget: 0,
      dueDate: new Date(),
      deliverables: [],
      paymentPercentage: 0,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [loadingCollaborations, setLoadingCollaborations] = useState(false);

  // Load collaborations when modal opens
  useEffect(() => {
    if (isOpen && !collaborationId) {
      loadCollaborations();
    }
  }, [isOpen, collaborationId]);

  const loadCollaborations = async () => {
    try {
      setLoadingCollaborations(true);

      // Get collaborations based on user role
      const response =
        user?.role === "publisher"
          ? await apiService.getPublisherCollaborations({ status: "active" })
          : await apiService.getDeveloperCollaborations({ status: "active" });

      // Filter collaborations that don't already have contracts
      const availableCollaborations = response.collaborations || response || [];
      setCollaborations(availableCollaborations);
    } catch (err) {
      console.error("Failed to load collaborations:", err);
      setError("Failed to load collaborations. Please try again.");
    } finally {
      setLoadingCollaborations(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateContractRequest,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-populate contract details when collaboration is selected
    if (field === "collaborationId" && value) {
      const selectedCollaboration = collaborations.find((c) => c._id === value);
      if (selectedCollaboration) {
        // Auto-populate some fields from collaboration
        setFormData((prev) => ({
          ...prev,
          collaborationId: value,
          contractTitle:
            prev.contractTitle ||
            `${selectedCollaboration.project?.title || "Project"} Contract`,
          contractDescription:
            prev.contractDescription || selectedCollaboration.description || "",
          totalBudget: prev.totalBudget || selectedCollaboration.budget || 0,
        }));
      }
    }
  };

  const handleMilestoneChange = (
    index: number,
    field: keyof ContractMilestone,
    value: any
  ) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
    setMilestones(updatedMilestones);
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        budget: 0,
        dueDate: new Date(),
        deliverables: [],
        paymentPercentage: 0,
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    if (
      !formData.collaborationId ||
      !formData.contractTitle ||
      !formData.contractDescription
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.contractStartDate || !formData.contractEndDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (
      new Date(formData.contractStartDate) >= new Date(formData.contractEndDate)
    ) {
      setError("End date must be after start date");
      return;
    }

    if (formData.totalBudget <= 0) {
      setError("Total budget must be greater than 0");
      return;
    }

    if (formData.advancePayment > formData.totalBudget) {
      setError("Advance payment cannot exceed total budget");
      return;
    }

    // Validate milestones
    const totalMilestonePercentage = milestones.reduce(
      (sum, m) => sum + (m.paymentPercentage || 0),
      0
    );
    if (totalMilestonePercentage > 100) {
      setError("Total milestone payment percentage cannot exceed 100%");
      return;
    }

    const totalMilestoneBudget = milestones.reduce(
      (sum, m) => sum + (m.budget || 0),
      0
    );
    if (totalMilestoneBudget > formData.totalBudget) {
      setError("Total milestone budget cannot exceed contract total budget");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const contractData: CreateContractRequest = {
        ...(formData as CreateContractRequest),
        milestones: milestones.map((m) => ({
          title: m.title!,
          description: m.description!,
          budget: m.budget!,
          dueDate: m.dueDate!,
          deliverables: m.deliverables!,
          paymentPercentage: m.paymentPercentage!,
        })),
      };

      const newContract = await contractService.createContract(contractData);
      onContractCreated(newContract);
      onClose();

      // Reset form
      resetForm();
    } catch (err) {
      console.error("Failed to create contract:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create contract"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      collaborationId: collaborationId || "",
      contractTitle: "",
      contractDescription: "",
      contractType: "development",
      totalBudget: 0,
      advancePayment: 0,
      paymentSchedule: "milestone_based",
      milestones: [],
      termsAndConditions: "",
      contractStartDate: "",
      contractEndDate: "",
    });
    setMilestones([
      {
        title: "",
        description: "",
        budget: 0,
        dueDate: new Date(),
        deliverables: [],
        paymentPercentage: 0,
      },
    ]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              Create New Contract
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!collaborationId && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Collaboration *
                  </label>
                  <select
                    value={formData.collaborationId || ""}
                    onChange={(e) =>
                      handleInputChange("collaborationId", e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loadingCollaborations}
                  >
                    <option value="">
                      {loadingCollaborations
                        ? "Loading collaborations..."
                        : collaborations.length === 0
                        ? "No active collaborations available"
                        : "Select a collaboration"}
                    </option>
                    {collaborations.map((collab) => (
                      <option key={collab._id} value={collab._id}>
                        {collab.project?.title ||
                          collab.description ||
                          `Collaboration ${collab._id.slice(-6)}`}
                        {collab.budget &&
                          ` - Budget: $${collab.budget.toLocaleString()}`}
                      </option>
                    ))}
                  </select>

                  {collaborations.length === 0 && !loadingCollaborations && (
                    <p className="text-yellow-400 text-sm mt-1">
                      <WarningIcon className="w-5 h-5 text-yellow-400 inline mr-2" />{" "}
                      No active collaborations found. You need to have an active
                      collaboration to create a contract.
                    </p>
                  )}

                  {loadingCollaborations && (
                    <p className="text-blue-400 text-sm mt-1">
                      Loading your collaborations...
                    </p>
                  )}

                  {!loadingCollaborations && collaborations.length > 0 && (
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-green-400 text-sm">
                        ✅ {collaborations.length} active collaboration
                        {collaborations.length !== 1 ? "s" : ""} available
                      </p>
                      <button
                        type="button"
                        onClick={loadCollaborations}
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Collaboration Info */}
              {formData.collaborationId && (
                <div className="md:col-span-2">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <h4 className="text-green-400 font-medium mb-2">
                      Selected Collaboration
                    </h4>
                    {(() => {
                      const selectedCollab = collaborations.find(
                        (c) => c._id === formData.collaborationId
                      );
                      return selectedCollab ? (
                        <div className="text-sm text-gray-300">
                          <p>
                            <span className="text-green-400">Project:</span>{" "}
                            {selectedCollab.project?.title || "N/A"}
                          </p>
                          <p>
                            <span className="text-green-400">Description:</span>{" "}
                            {selectedCollab.description || "N/A"}
                          </p>
                          {selectedCollab.budget && (
                            <p>
                              <span className="text-green-400">Budget:</span> $
                              {selectedCollab.budget.toLocaleString()}
                            </p>
                          )}
                          <p>
                            <span className="text-green-400">Status:</span>{" "}
                            {selectedCollab.status || "N/A"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-yellow-400">
                          Collaboration details not available
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contract Title *
                </label>
                <input
                  type="text"
                  value={formData.contractTitle}
                  onChange={(e) =>
                    handleInputChange("contractTitle", e.target.value)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter contract title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contract Type
                </label>
                <select
                  value={formData.contractType}
                  onChange={(e) =>
                    handleInputChange("contractType", e.target.value)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="development">Development</option>
                  <option value="publishing">Publishing</option>
                  <option value="marketing">Marketing</option>
                  <option value="support">Support</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contract Description *
              </label>
              <textarea
                value={formData.contractDescription}
                onChange={(e) =>
                  handleInputChange("contractDescription", e.target.value)
                }
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Budget Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Budget *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalBudget || ""}
                  onChange={(e) =>
                    handleInputChange("totalBudget", Number(e.target.value))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Advance Payment
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={formData.totalBudget || 0}
                  value={formData.advancePayment || ""}
                  onChange={(e) =>
                    handleInputChange("advancePayment", Number(e.target.value))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {formData.totalBudget > 0 && formData.advancePayment > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {(
                      (formData.advancePayment / formData.totalBudget) *
                      100
                    ).toFixed(1)}
                    % of total budget
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Schedule
                </label>
                <select
                  value={formData.paymentSchedule}
                  onChange={(e) =>
                    handleInputChange("paymentSchedule", e.target.value)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="milestone_based">Milestone Based</option>
                  <option value="upfront">Upfront</option>
                  <option value="completion">On Completion</option>
                </select>
              </div>
            </div>

            {/* Budget Summary */}
            {formData.totalBudget > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-400">Total Budget:</span>
                  <span className="text-white font-medium">
                    ${formData.totalBudget.toLocaleString()}
                  </span>
                </div>
                {formData.advancePayment > 0 && (
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-blue-400">Remaining Budget:</span>
                    <span className="text-white font-medium">
                      $
                      {(
                        formData.totalBudget - formData.advancePayment
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Contract Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) =>
                    handleInputChange("contractStartDate", e.target.value)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) =>
                    handleInputChange("contractEndDate", e.target.value)
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Milestones */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Milestones</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Add Milestone
                  </button>
                </div>
              </div>

              {/* Milestone Summary */}
              {milestones.length > 0 && (
                <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total Milestones:</span>
                      <span className="text-white ml-1 font-medium">
                        {milestones.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Budget:</span>
                      <span className="text-white ml-1 font-medium">
                        $
                        {milestones
                          .reduce((sum, m) => sum + (m.budget || 0), 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Payment %:</span>
                      <span className="text-white ml-1 font-medium">
                        {milestones.reduce(
                          (sum, m) => sum + (m.paymentPercentage || 0),
                          0
                        )}
                        %
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Remaining Budget:</span>
                      <span className="text-white ml-1 font-medium">
                        $
                        {(formData.totalBudget || 0) -
                          milestones.reduce(
                            (sum, m) => sum + (m.budget || 0),
                            0
                          ) >
                        0
                          ? (
                              (formData.totalBudget || 0) -
                              milestones.reduce(
                                (sum, m) => sum + (m.budget || 0),
                                0
                              )
                            ).toLocaleString()
                          : "0"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-white font-medium">
                        Milestone {index + 1}
                      </h4>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={milestone.title || ""}
                          onChange={(e) =>
                            handleMilestoneChange(
                              index,
                              "title",
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Budget
                        </label>
                        <input
                          type="number"
                          value={milestone.budget || ""}
                          onChange={(e) =>
                            handleMilestoneChange(
                              index,
                              "budget",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={
                            milestone.dueDate
                              ? new Date(milestone.dueDate)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleMilestoneChange(
                              index,
                              "dueDate",
                              new Date(e.target.value)
                            )
                          }
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Payment %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={milestone.paymentPercentage || ""}
                          onChange={(e) =>
                            handleMilestoneChange(
                              index,
                              "paymentPercentage",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={milestone.description || ""}
                        onChange={(e) =>
                          handleMilestoneChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        rows={2}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Terms and Conditions
              </label>
              <textarea
                value={formData.termsAndConditions}
                onChange={(e) =>
                  handleInputChange("termsAndConditions", e.target.value)
                }
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contract terms and conditions..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
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
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? "Creating..." : "Create Contract"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
