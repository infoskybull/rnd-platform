import React, { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { User } from "../types";
import DashboardNavbar from "../components/DashboardNavbar";
import RnDLogo from "../components/icons/RnDLogo";
import {
  getNavigationItems,
  getDefaultRightIcons,
  getMessagesPathForRole,
} from "../utils/navbarConfig";
import apiService from "../services/api";

interface OfferPageProps {
  user: User;
  onLogout: () => void;
}

const OfferPage: React.FC<OfferPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Get creatorId and projectId from URL params or location state
  const creatorId =
    searchParams.get("creatorId") || (location.state as any)?.creatorId;
  const projectId =
    searchParams.get("projectId") || (location.state as any)?.projectId;
  const [coreOfferAmount, setCoreOfferAmount] = useState(100);
  const [milestone1Link, setMilestone1Link] = useState("");
  const [milestone2Budget, setMilestone2Budget] = useState(null);
  const [milestone3CPI, setMilestone3CPI] = useState({
    operator: "Greater than",
    value: "",
  });
  const [milestone3Retention, setMilestone3Retention] = useState({
    operator: "Greater than",
    value: "90%",
  });
  const [milestone3Playtime, setMilestone3Playtime] = useState({
    operator: "Less than",
    value: "30m",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigationItems = getNavigationItems(user?.role, "/offer");
  const rightIcons = getDefaultRightIcons({
    onMessagesClick: () => navigate(getMessagesPathForRole(user?.role)),
  });

  // Generate HTML content from form data
  const generateOfferContent = (): string => {
    let html = `<h1>Collaboration Offer</h1>`;

    html += `<p><strong>Publisher agrees to pay $${coreOfferAmount.toLocaleString()}</strong> to the Creator for delivering the listed prototype on the Platform.</p>`;

    html += `<h2>Optional Milestone Payments:</h2>`;

    // Milestone 1
    html += `<h3>Milestone 1: SDK integration & successful publishing</h3>`;
    if (milestone1Link) {
      html += `<p>SDK Integration Link: <a href="${milestone1Link}">${milestone1Link}</a></p>`;
    } else {
      html += `<p>No SDK integration link provided.</p>`;
    }

    // Milestone 2
    html += `<h3>Milestone 2: Game tested via publisher's UA system</h3>`;
    if (milestone2Budget > 0) {
      html += `<p>The publisher commits to spending a minimum budget on testing activities of: <strong>$${milestone2Budget.toLocaleString()}</strong></p>`;
    } else {
      html += `<p>No budget specified.</p>`;
    }

    // Milestone 3
    html += `<h3>Milestone 3: Performance KPIs</h3>`;
    html += `<p>If the game reaches performance KPIs, additional payments will be made:</p>`;
    html += `<ul>`;

    if (milestone3CPI.value) {
      html += `<li>CPI: ${milestone3CPI.operator} ${milestone3CPI.value}</li>`;
    }

    if (milestone3Retention.value) {
      html += `<li>Retention Rate Day 1: ${milestone3Retention.operator} ${milestone3Retention.value}</li>`;
    }

    if (milestone3Playtime.value) {
      html += `<li>Average Playtime: ${milestone3Playtime.operator} ${milestone3Playtime.value}</li>`;
    }

    html += `</ul>`;

    return html;
  };

  const handleMakeOffer = async () => {
    if (!creatorId) {
      setError("Creator ID is missing. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (!projectId) {
      setError("Project ID is missing. Please try again.");
      return;
    }

    try {
      const content = generateOfferContent();

      await apiService.sendOffer({
        creatorId,
        projectId,
        subject: "Collaboration Offer",
        content,
      });

      // Show success modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error sending offer:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send offer. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleBackToPrototypeDetail = () => {
    navigate(`/prototype-detail/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <DashboardNavbar
        user={user}
        onLogout={onLogout}
        navigationItems={navigationItems}
        rightIcons={rightIcons}
        logo={<RnDLogo size={40} />}
      />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4"
                  />
                </svg>
              </div>
            </div>

            {/* Message */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Your offer has been sent to the Creator
            </h2>
            <p className="text-gray-600 text-center mb-6">
              We will notify you when the Creator responds to your offer.
            </p>

            {/* Button */}
            <button
              onClick={handleBackToPrototypeDetail}
              className="w-full px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Back to Prototype Detail
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-start justify-center p-8 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-[620px] bg-white rounded-lg shadow-sm p-10 flex flex-col items-center">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-3 text-center">
            Your offer
          </h1>

          {/* Explanatory Text */}
          <p className="text-sm text-gray-500 mb-1 text-center max-w-[470px]">
            This is your offer to the Creator. Once submitted, the Creator will
            receive and review it.
          </p>

          <p className="text-sm text-gray-500 mb-8 text-center max-w-[470px]">
            The offer is only valid once both parties agree to the following
            terms:
          </p>

          {/* Core Offer */}
          <div className="mb-10 text-center max-w-[470px]">
            <p className="text-base text-gray-900 leading-relaxed">
              Publisher agrees to pay{" "}
              <span className="text-blue-600 font-semibold">
                ${coreOfferAmount.toLocaleString()}
              </span>{" "}
              to the Creator for delivering the listed prototype on the
              Platform.
            </p>
          </div>

          {/* Optional Milestone Payments */}
          <div className="mb-10 px-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center max-w-[470px]">
              Optional milestone payments are proposed for further cooperation:
            </h2>

            {/* Milestone 1 */}
            <div className="mb-6">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-black text-sm mt-1">▶</span>
                <div className="flex-1 flex justify-between items-end">
                  <div>
                    <p className="text-base text-gray-900 font-medium mb-1">
                      Milestone 1: SDK integration & successful publishing
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Please provide the link to the sdk integration
                      documentation
                    </p>
                  </div>
                  <input
                    type="text"
                    value={milestone1Link}
                    onChange={(e) => setMilestone1Link(e.target.value)}
                    placeholder="https://www.notion.so/29a1f87.."
                    className="text-gray-900 h-10 w-full max-w-[140px] px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="mb-6">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-black text-sm mt-1">▶</span>
                <div className="flex-1 flex justify-between items-end">
                  <div>
                    <p className="text-base text-gray-900 font-medium mb-1">
                      Milestone 2: Game tested via publisher's UA system
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      The publisher commits to spending a minimum budget on
                      testing activities of:
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 text-sm">$</span>
                    {/* <input
                      type="number"
                      value={milestone2Budget}
                      onChange={(e) =>
                        setMilestone2Budget(Number(e.target.value) || 0)
                      }
                      placeholder="500"
                      className="text-gray-900 h-10 w-full max-w-[140px] px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    /> */}
                    <input
                      type="number"
                      value={milestone2Budget}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Allow empty string
                        if (inputValue === "") {
                          setMilestone2Budget(Number(e.target.value) || 0);
                          return;
                        }
                        // Prevent negative numbers
                        if (inputValue.startsWith("-")) {
                          return;
                        }
                        // Allow intermediate typing states (ending with .) or valid numbers > 0
                        const numValue = Number(inputValue);
                        if (
                          inputValue.endsWith(".") ||
                          (!isNaN(numValue) && numValue > 0)
                        ) {
                          setMilestone2Budget(Number(e.target.value) || 0);
                        }
                      }}
                      onBlur={(e) => {
                        // Validate on blur - ensure final value is > 0 or clear if invalid
                        const numValue = Number(e.target.value);
                        if (
                          e.target.value !== "" &&
                          (isNaN(numValue) || numValue <= 0)
                        ) {
                          setMilestone2Budget(Number(e.target.value) || 0);
                        }
                      }}
                      placeholder="500"
                      min="0.01"
                      step="0.01"
                      className="w-20 px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 w-full max-w-[140px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="mb-6">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-black text-sm mt-1">▶</span>
                <div className="flex-col justify-between items-end">
                  <div className="flex-1">
                    <p className="text-base text-gray-900 font-medium mb-4">
                      Milestone 3: If the game reaches performance KPIs,
                      additional payments will be made:
                    </p>
                  </div>

                  <div className="flex-col gap-2 flex-2">
                    {/* CPI */}
                    <div className="mb-4 flex items-center gap-2 w-full justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPI:
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={milestone3CPI.operator}
                          onChange={(e) =>
                            setMilestone3CPI({
                              ...milestone3CPI,
                              operator: e.target.value,
                            })
                          }
                          className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900">
                          <option>Greater than</option>
                          <option>Less than</option>
                          <option>Equal to</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 text-sm">$</span>
                            <input
                              type="number"
                              value={milestone3CPI.value}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                // Allow empty string
                                if (inputValue === "") {
                                  setMilestone3CPI({
                                    ...milestone3CPI,
                                    value: "",
                                  });
                                  return;
                                }
                                // Prevent negative numbers
                                if (inputValue.startsWith("-")) {
                                  return;
                                }
                                // Allow intermediate typing states (ending with .) or valid numbers > 0
                                const numValue = Number(inputValue);
                                if (
                                  inputValue.endsWith(".") ||
                                  (!isNaN(numValue) && numValue > 0)
                                ) {
                                  setMilestone3CPI({
                                    ...milestone3CPI,
                                    value: inputValue,
                                  });
                                }
                              }}
                              onBlur={(e) => {
                                // Validate on blur - ensure final value is > 0 or clear if invalid
                                const numValue = Number(e.target.value);
                                if (
                                  e.target.value !== "" &&
                                  (isNaN(numValue) || numValue <= 0)
                                ) {
                                  setMilestone3CPI({
                                    ...milestone3CPI,
                                    value: "",
                                  });
                                }
                              }}
                              placeholder="1"
                              min="0.01"
                              step="0.01"
                              style={{ width: "80px" }}
                              className="w-20 px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 w-full max-w-[140px]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Retention Rate Day 1 */}
                    <div className="mb-4 flex items-center gap-2 w-full justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Retention Rate Day 1:
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={milestone3Retention.operator}
                          onChange={(e) =>
                            setMilestone3Retention({
                              ...milestone3Retention,
                              operator: e.target.value,
                            })
                          }
                          className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900">
                          <option>Greater than</option>
                          <option>Less than</option>
                          <option>Equal to</option>
                        </select>
                        <select
                          value={milestone3Retention.value}
                          onChange={(e) =>
                            setMilestone3Retention({
                              ...milestone3Retention,
                              value: e.target.value,
                            })
                          }
                          className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900">
                          <option>90%</option>
                          <option>80%</option>
                          <option>70%</option>
                          <option>60%</option>
                          <option>50%</option>
                        </select>
                      </div>
                    </div>

                    {/* Average Playtime */}
                    <div className="mb-4 flex items-center gap-2 w-full justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Average Playtime:
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={milestone3Playtime.operator}
                          onChange={(e) =>
                            setMilestone3Playtime({
                              ...milestone3Playtime,
                              operator: e.target.value,
                            })
                          }
                          className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900">
                          <option>Greater than</option>
                          <option>Less than</option>
                          <option>Equal to</option>
                        </select>
                        <select
                          value={milestone3Playtime.value}
                          onChange={(e) =>
                            setMilestone3Playtime({
                              ...milestone3Playtime,
                              value: e.target.value,
                            })
                          }
                          className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900">
                          <option>30m</option>
                          <option>20m</option>
                          <option>15m</option>
                          <option>10m</option>
                          <option>5m</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 justify-end pt-4 border-t border-gray-200 w-full">
            <button
              onClick={handleMakeOffer}
              disabled={isSubmitting || !creatorId}
              className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isSubmitting ? "Sending..." : "Make offer"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-300 text-white font-medium rounded-lg hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPage;
