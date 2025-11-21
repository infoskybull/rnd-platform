import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import Web3WalletModal from "../components/Web3WalletModal";
import {
  Web3WalletCredentials,
  GameProject,
  GameProjectBasicInfo,
} from "../types";
import { useTonConnect } from "../hooks/useTonConnect";
import { useAccount } from "wagmi";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { useSuiWallet } from "../contexts/SuiWalletContext";
import { apiService } from "../services/api";
// PayPal JavaScript SDK not needed for server-side flow
// import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type PlanType = "free" | "pro" | "business";
type PaymentMethod = "visa" | "paypal" | "web3";

interface PlanDetails {
  name: string;
  price: number;
}

const planDetails: Record<PlanType, PlanDetails> = {
  free: { name: "Free", price: 0 },
  pro: { name: "Pro", price: 29 },
  business: { name: "Business", price: 99 },
};

// PayPal Configuration - Server-side flow
// PayPal Client ID no longer needed in frontend for server-side flow
// Backend handles PayPal integration using PayPal Secret
// Note: Mode is determined by backend, but we can check from URL or env for display
const PAYPAL_MODE =
  ((import.meta as any).env?.VITE_PAYPAL_MODE as "sandbox" | "production") ||
  "sandbox"; // Default to sandbox for testing (for display purposes only)

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const selectedPlanId = searchParams.get("plan") as PlanType | null;
  const projectId = searchParams.get("projectId");
  const payToView = searchParams.get("payToView") === "true";
  const paymentTypeParam = searchParams.get("paymentType") as
    | "project_purchase"
    | "subscription"
    | "collaboration_budget"
    | "pay_to_view"
    | null;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paypal");
  const [showWeb3Modal, setShowWeb3Modal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [project, setProject] = useState<
    GameProject | GameProjectBasicInfo | null
  >(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPlan = selectedPlanId ? planDetails[selectedPlanId] : null;

  // Web3 wallet hooks
  const { walletAddress: tonAddress, isConnected: isTonConnected } =
    useTonConnect();
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { walletAddress: suiAddress, isConnected: isSuiConnected } =
    useSuiWallet();
  const { publicKey: solanaPublicKey, isConnected: isSolanaConnected } =
    useSolanaWallet();

  // Calculate payment amount based on paymentType, project or plan
  const getPaymentAmount = (): number => {
    // If subscription plan, return plan price
    if (selectedPlan) {
      return selectedPlan.price;
    }

    if (project) {
      // Use paymentType from query params to determine which price to use
      if (paymentTypeParam) {
        if (paymentTypeParam === "pay_to_view") {
          return project.payToViewAmount || 0;
        }
        if (paymentTypeParam === "collaboration_budget") {
          // Get price from collaboration budget (only for full GameProject)
          if (
            "creatorCollaborationData" in project &&
            project.creatorCollaborationData?.budget
          ) {
            return project.creatorCollaborationData.budget;
          }
          return 0;
        }
        if (paymentTypeParam === "project_purchase") {
          // Get price from product sale asking price (only for full GameProject)
          if (
            "productSaleData" in project &&
            project.productSaleData?.askingPrice
          ) {
            return project.productSaleData.askingPrice;
          }
          return 0;
        }
      }

      // Fallback: If payToView flag is set, use payToViewAmount
      if (payToView && project.payToViewAmount > 0) {
        return project.payToViewAmount;
      }

      // Fallback: Get price from project based on type (only for full GameProject, not basic info)
      if (
        "productSaleData" in project &&
        project.productSaleData?.askingPrice
      ) {
        return project.productSaleData.askingPrice;
      }
      if (
        "creatorCollaborationData" in project &&
        project.creatorCollaborationData?.budget
      ) {
        return project.creatorCollaborationData.budget;
      }
      return 0;
    }

    return 0;
  };

  const paymentAmount = getPaymentAmount();

  // Helper function to determine payment type
  const getPaymentType = ():
    | "project_purchase"
    | "subscription"
    | "collaboration_budget"
    | "pay_to_view" => {
    // Use paymentType from query params if provided
    if (paymentTypeParam) {
      return paymentTypeParam;
    }
    // Fallback to auto-detection
    if (selectedPlanId) {
      return "subscription";
    }
    if (projectId && project) {
      if (payToView) {
        return "pay_to_view";
      }
      if (
        Array.isArray(project.projectType) &&
        project.projectType.includes("dev_collaboration")
      ) {
        return "collaboration_budget";
      }
      return "project_purchase";
    }
    return "project_purchase";
  };

  // Get payment description
  const getPaymentDescription = (): string => {
    if (project) {
      if (payToView) {
        return `Pay to view: ${project.title}`;
      }
      return project.title;
    }
    if (selectedPlan) {
      return `${selectedPlan.name} Plan`;
    }
    return "Payment";
  };

  // Fetch project data if projectId is provided
  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        setLoadingProject(true);
        try {
          // If payToView, use basic-info endpoint instead of full project detail
          if (payToView) {
            const projectData = await apiService.getGameProjectBasicInfo(
              projectId
            );
            setProject(projectData);
          } else {
            const projectData = await apiService.getGameProjectById(projectId);
            setProject(projectData);
          }
        } catch (error) {
          console.error("Failed to load project:", error);
          navigate("/");
        } finally {
          setLoadingProject(false);
        }
      }
    };

    loadProject();
  }, [projectId, payToView, navigate]);

  // Validate redirect - must have either plan or projectId
  useEffect(() => {
    if (!selectedPlanId && !projectId) {
      navigate("/plan");
    }
  }, [selectedPlanId, projectId, navigate]);

  const validateCard = () => {
    const newErrors: Record<string, string> = {};

    if (!cardDetails.number.replace(/\s/g, "").match(/^\d{16}$/)) {
      newErrors.number = "Please enter a valid 16-digit card number";
    }

    if (!cardDetails.name.trim()) {
      newErrors.name = "Cardholder name is required";
    }

    if (!cardDetails.expiry.match(/^\d{2}\/\d{2}$/)) {
      newErrors.expiry = "Please enter expiry date in MM/YY format";
    }

    if (!cardDetails.cvv.match(/^\d{3,4}$/)) {
      newErrors.cvv = "Please enter a valid CVV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    value = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardDetails({ ...cardDetails, number: value });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    setCardDetails({ ...cardDetails, expiry: value });
  };

  const handleVisaPayment = async () => {
    if (!validateCard()) return;

    setProcessing(true);
    try {
      // Get payment type using helper function
      const paymentType = getPaymentType();

      // Create payment based on payment type
      if (projectId && project) {
        const paymentData = await apiService.createPayment({
          paymentType,
          projectId: projectId,
          amount: paymentAmount,
          currency: "USD",
          description: getPaymentDescription(),
          paymentMethod: "visa",
        });

        if (paymentData.success) {
          navigate(`/project-detail/${projectId}`);
        } else {
          throw new Error("Failed to process payment");
        }
      } else if (selectedPlanId) {
        // Create payment for subscription upgrade
        const paymentData = await apiService.createPayment({
          paymentType: "subscription",
          planType: selectedPlanId,
          amount: paymentAmount,
          currency: "USD",
          description: `Upgrade to ${selectedPlan?.name} plan`,
          paymentMethod: "visa",
        });

        if (paymentData.success && paymentData.data.approvalUrl) {
          // For card payments, we might need to handle differently
          // For now, redirect to PayPal (card payments may need separate flow)
          navigate("/manage-plan");
        } else {
          throw new Error("Failed to process payment");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Create payment and redirect to PayPal (Server-side flow)
  const handlePayPalPayment = async () => {
    if (paymentAmount === 0) {
      return;
    }

    setProcessing(true);
    try {
      // Get payment type using helper function
      const paymentType = getPaymentType();

      // Create payment on backend
      const paymentData = await apiService.createPayment({
        paymentType,
        projectId: projectId || undefined,
        planType:
          paymentType === "subscription"
            ? selectedPlanId || undefined
            : undefined,
        amount: paymentAmount,
        currency: "USD",
        description: getPaymentDescription(),
        paymentMethod: "paypal",
      });

      if (paymentData.success && paymentData.data.approvalUrl) {
        // Store order ID for completion (optional, mainly for debugging)
        setPaypalOrderId(paymentData.data.paypalOrderId);

        // Redirect user to PayPal approval URL
        // PayPal will redirect back to this page with 'token' parameter
        window.location.href = paymentData.data.approvalUrl;
      } else {
        throw new Error("Failed to create payment");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      setProcessing(false);
    }
  };

  // Legacy client-side PayPal success handler (for backward compatibility)
  const handlePayPalSuccess = async (details: any) => {
    setProcessing(true);
    try {
      // Get payment type using helper function
      const paymentType = getPaymentType();

      // If project payment, call purchase API with PayPal order details
      if (projectId && project) {
        if (paymentType === "pay_to_view") {
          // Pay to view payment
          const paymentData = await apiService.createPayment({
            paymentType: "pay_to_view",
            projectId: projectId,
            amount: paymentAmount,
            currency: "USD",
            description: `Pay to view: ${project.title}`,
            paymentMethod: "paypal",
          });
          navigate(`/project-detail/${projectId}`);
        } else if (paymentType === "collaboration_budget") {
          // Collaboration budget payment
          const paymentData = await apiService.createPayment({
            paymentType: "collaboration_budget",
            projectId: projectId,
            amount: paymentAmount,
            currency: "USD",
            description: getPaymentDescription(),
            paymentMethod: "paypal",
          });
          navigate(`/project-detail/${projectId}`);
        } else {
          // Send PayPal order ID to backend for verification
          await apiService.purchaseGameProject(projectId, {
            paymentMethod: "paypal",
            paypalOrderId: details.id,
            payerId: details.payer?.payer_id,
            paymentStatus: details.status,
          });
          navigate(`/project-detail/${projectId}`);
        }
      } else if (selectedPlanId) {
        // TODO: Integrate with payment API for plan upgrade
        navigate("/manage-plan");
      }
    } catch (error) {
      console.error("PayPal payment error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleWeb3Payment = async (credentials: Web3WalletCredentials) => {
    setProcessing(true);
    try {
      // Get payment type using helper function
      const paymentType = getPaymentType();

      // Create payment based on payment type
      if (projectId && project) {
        const paymentData = await apiService.createPayment({
          paymentType,
          projectId: projectId,
          amount: paymentAmount,
          currency: "USD",
          description: getPaymentDescription(),
          paymentMethod: "web3",
        });

        if (paymentData.success) {
          setShowWeb3Modal(false);
          navigate(`/project-detail/${projectId}`);
        } else {
          throw new Error("Failed to process payment");
        }
      } else if (selectedPlanId) {
        // Create payment for subscription upgrade
        const paymentData = await apiService.createPayment({
          paymentType: "subscription",
          planType: selectedPlanId,
          amount: paymentAmount,
          currency: "USD",
          description: `Upgrade to ${selectedPlan?.name} plan`,
          paymentMethod: "web3",
        });

        if (paymentData.success) {
          // For Web3 payments, backend should handle the transaction
          setShowWeb3Modal(false);
          navigate("/manage-plan");
        } else {
          throw new Error("Failed to process payment");
        }
      }
    } catch (error) {
      console.error("Web3 payment error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const isWeb3WalletConnected =
    isTonConnected || isEthConnected || isSuiConnected || isSolanaConnected;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBack = () => {
    if (project) {
      navigate(`/project/${project._id}`);
    } else {
      navigate("/plan");
    }
  };

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (paymentAmount === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Invalid payment amount</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    // PayPalScriptProvider removed - using server-side flow instead
    // <PayPalScriptProvider ...>
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Navbar */}
      <ResponsiveNavbar
        title="Payment"
        titleColor="text-indigo-400"
        user={user}
        onLogout={handleLogout}
        backButton={{
          text: "Back",
          onClick: handleBack,
        }}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Payment
          </h1>
          <p className="text-gray-400">
            {project
              ? payToView
                ? `Pay to View: ${project.title}`
                : `Purchase: ${project.title}`
              : selectedPlan
              ? `Upgrade to ${selectedPlan.name} Plan`
              : "Payment"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-white mb-4">
                Order Summary
              </h2>
              <div className="space-y-4">
                {project ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Project</span>
                      <span className="text-white font-medium truncate ml-2">
                        {project.title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type</span>
                      <span className="text-white font-medium">
                        {(() => {
                          // Use paymentType to determine which type to show
                          const currentPaymentType = getPaymentType();
                          if (currentPaymentType === "collaboration_budget") {
                            return "Dev Collaboration";
                          }
                          if (currentPaymentType === "project_purchase") {
                            return "Product Sale";
                          }
                          // Fallback: show all types
                          const types = Array.isArray(project.projectType)
                            ? project.projectType
                            : [project.projectType];
                          return types
                            .map((t) => {
                              switch (t) {
                                case "product_sale":
                                  return "Product Sale";
                                case "dev_collaboration":
                                  return "Dev Collaboration";
                                default:
                                  return String(t);
                              }
                            })
                            .join(", ");
                        })()}
                      </span>
                    </div>
                    {payToView && project.payToViewAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Viewing Fee</span>
                        <span className="text-white font-medium">
                          ${project.payToViewAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {(() => {
                      const currentPaymentType = getPaymentType();
                      // Only show asking price for project_purchase
                      if (
                        currentPaymentType === "project_purchase" &&
                        !payToView &&
                        "productSaleData" in project &&
                        project.productSaleData?.askingPrice
                      ) {
                        return (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Asking Price</span>
                            <span className="text-white font-medium">
                              ${project.productSaleData.askingPrice}
                            </span>
                          </div>
                        );
                      }
                      // Only show budget for collaboration_budget
                      if (
                        currentPaymentType === "collaboration_budget" &&
                        "creatorCollaborationData" in project &&
                        project.creatorCollaborationData?.budget
                      ) {
                        return (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Budget</span>
                            <span className="text-white font-medium">
                              ${project.creatorCollaborationData.budget}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </>
                ) : selectedPlan ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Plan</span>
                      <span className="text-white font-medium">
                        {selectedPlan.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Billing</span>
                      <span className="text-white font-medium">Monthly</span>
                    </div>
                  </>
                ) : null}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-white">${paymentAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Payment Method
              </h2>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setPaymentMethod("paypal")}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    paymentMethod === "paypal"
                      ? "border-indigo-500 bg-indigo-900/20 text-white"
                      : "border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="font-semibold">PayPal</span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("visa")}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    paymentMethod === "visa"
                      ? "border-indigo-500 bg-indigo-900/20 text-white"
                      : "border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <span>Card</span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("web3")}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    paymentMethod === "web3"
                      ? "border-indigo-500 bg-indigo-900/20 text-white"
                      : "border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Web3</span>
                  </div>
                </button>
              </div>

              {/* PayPal Payment */}
              {paymentMethod === "paypal" && (
                <div className="space-y-4">
                  {PAYPAL_MODE === "sandbox" && (
                    <div className="bg-yellow-900/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg">
                      <p className="text-sm font-semibold mb-1">
                        🧪 Sandbox Mode Active
                      </p>
                      <p className="text-xs">
                        You're using PayPal Sandbox for testing. No real money
                        will be charged. Use test accounts from{" "}
                        <a
                          href="https://developer.paypal.com/dashboard/accounts"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-200"
                        >
                          PayPal Developer Dashboard
                        </a>
                      </p>
                    </div>
                  )}
                  <div className="bg-blue-900/20 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg">
                    <p className="text-sm">
                      Pay securely with PayPal. You'll be redirected to PayPal
                      to complete your payment. After approval, you'll be
                      redirected back to complete the transaction.
                    </p>
                  </div>
                  <button
                    onClick={handlePayPalPayment}
                    disabled={processing || paymentAmount === 0}
                    className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                        </svg>
                        <span>Pay with PayPal - ${paymentAmount}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* VISA Payment Form */}
              {paymentMethod === "visa" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.number}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.number ? "border-red-500" : "border-gray-600"
                      }`}
                    />
                    {errors.number && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.number}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardDetails.name}
                      onChange={(e) =>
                        setCardDetails({
                          ...cardDetails,
                          name: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.name ? "border-red-500" : "border-gray-600"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.expiry ? "border-red-500" : "border-gray-600"
                        }`}
                      />
                      {errors.expiry && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.expiry}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4);
                          setCardDetails({ ...cardDetails, cvv: value });
                        }}
                        placeholder="123"
                        maxLength={4}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.cvv ? "border-red-500" : "border-gray-600"
                        }`}
                      />
                      {errors.cvv && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleVisaPayment}
                    disabled={processing}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {processing ? "Processing..." : `Pay $${paymentAmount}`}
                  </button>
                </div>
              )}

              {/* Web3 Payment */}
              {paymentMethod === "web3" && (
                <div className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg">
                    <p className="text-sm">
                      Connect your Web3 wallet to complete the payment. You'll
                      be able to pay using TON, Ethereum, SUI, or Solana.
                    </p>
                  </div>

                  {isWeb3WalletConnected ? (
                    <div className="space-y-4">
                      <div className="bg-green-900/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
                        <p className="text-sm font-medium">Wallet Connected</p>
                        {(tonAddress ||
                          ethAddress ||
                          suiAddress ||
                          solanaPublicKey) && (
                          <p className="text-xs mt-1 opacity-75">
                            {tonAddress ||
                              ethAddress ||
                              suiAddress ||
                              solanaPublicKey?.toString()}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const credentials: Web3WalletCredentials = {
                            walletAddress:
                              tonAddress ||
                              ethAddress ||
                              suiAddress ||
                              solanaPublicKey?.toString() ||
                              "",
                            walletType: tonAddress
                              ? "ton"
                              : ethAddress
                              ? "ethereum"
                              : suiAddress
                              ? "sui"
                              : "solana",
                            signature: "",
                          };
                          handleWeb3Payment(credentials);
                        }}
                        disabled={processing}
                        className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        {processing ? "Processing..." : `Pay $${paymentAmount}`}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowWeb3Modal(true)}
                      className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Web3 Wallet Modal */}
      <Web3WalletModal
        isOpen={showWeb3Modal}
        onClose={() => setShowWeb3Modal(false)}
        onWeb3Login={async (credentials) => {
          setShowWeb3Modal(false);
          await handleWeb3Payment(credentials);
        }}
        isLoading={processing}
      />
    </div>
    // </PayPalScriptProvider>
  );
};

export default PaymentPage;
