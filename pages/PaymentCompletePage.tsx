import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import DashboardNavbar from "../components/DashboardNavbar";
import RnDLogo from "../components/icons/RnDLogo";
import {
  getNavigationItems,
  getDefaultRightIcons,
  getMessagesPathForRole,
} from "../utils/navbarConfig";

const PaymentCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState<string>("");
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const handlePaymentCompletion = async () => {
      // Get token and PayerID from URL (PayPal redirect parameters)
      const token = searchParams.get("token"); // PayPal Order ID
      const payerId = searchParams.get("PayerID"); // PayPal Payer ID

      if (!token) {
        setStatus("error");
        setMessage("No payment token found. Payment may have been cancelled.");
        return;
      }

      try {
        setStatus("processing");
        setMessage("Completing payment...");

        // Complete payment using orderId (token from PayPal is the orderId)
        // According to docs, backend expects: { "orderId": "..." }
        const result = await apiService.completePayment(token);

        if (result.success) {
          setStatus("success");
          setPaymentData(result.data);
          setMessage("Payment successful!");
          // Don't auto-redirect anymore, let user click Done button
        } else {
          throw new Error("Payment completion failed");
        }
      } catch (error) {
        console.error("Payment completion error:", error);
        setStatus("error");
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to complete payment. Please contact support.";
        setMessage(errorMessage);

        // Clear URL parameters after showing error
        setTimeout(() => {
          navigate("/payment", { replace: true });
        }, 5000);
      }
    };

    handlePaymentCompletion();
  }, [searchParams, navigate, user]);

  // Helper functions for formatting
  const formatTransactionId = (id: string) => {
    if (!id) return "**** **** ****";
    const last8 = id.slice(-8);
    return `**** **** ${last8}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPaymentMethod = (method: string) => {
    switch (method?.toLowerCase()) {
      case "paypal":
        return "PayPal";
      case "visa":
        return "Visa Debit Card";
      case "web3":
        return "Web3 Wallet";
      default:
        return method || "Unknown";
    }
  };

  const handleDone = () => {
    if (paymentData) {
      // Check if user is publisher and has projectId - redirect to prototype-detail
      if (user?.role === "publisher" && paymentData.projectId) {
        navigate(`/prototype-detail/${paymentData.projectId}`);
        return;
      }

      // Determine navigation based on payment type
      if (paymentData.paymentType === "collaboration_budget") {
        if (paymentData.collaborationId) {
          navigate(`/collaboration/${paymentData.collaborationId}`);
        } else if (paymentData.projectId) {
          navigate(`/project-detail/${paymentData.projectId}`);
        } else {
          navigate("/dashboard");
        }
      } else if (paymentData.projectId) {
        navigate(`/project-detail/${paymentData.projectId}`);
      } else if (paymentData.paymentType === "subscription") {
        navigate("/manage-plan");
      } else {
        // Default navigation based on user role
        if (user?.role === "publisher") {
          navigate("/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } else {
      // Default navigation based on user role
      if (user?.role === "publisher") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  };

  // Get navigation items for navbar
  const navigationItems = getNavigationItems(user?.role, location.pathname);
  const rightIcons = getDefaultRightIcons({
    onMessagesClick: () => navigate(getMessagesPathForRole(user?.role)),
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <DashboardNavbar
        user={user}
        onLogout={logout}
        navigationItems={navigationItems}
        showSearch={false}
        rightIcons={rightIcons}
        logo={<RnDLogo size={40} />}
      />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {status === "processing" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Processing Payment
            </h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Payment successful
            </h2>

            {/* Details Section */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                DETAILS
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transaction ID:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {paymentData
                      ? formatTransactionId(paymentData._id || "")
                      : "**** **** ****"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Time:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {paymentData
                      ? formatTime(
                          paymentData.completedAt || paymentData.createdAt
                        )
                      : formatTime(new Date().toISOString())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {paymentData
                      ? formatDate(
                          paymentData.completedAt || paymentData.createdAt
                        )
                      : formatDate(new Date().toISOString())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {paymentData
                      ? formatPaymentMethod(paymentData.paymentMethod)
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Station Name:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {paymentData?.description || "RnD Platform"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Session ID:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {paymentData?.paypalOrderId
                      ? "CHG" + paymentData.paypalOrderId.slice(-8)
                      : paymentData?.paypalCaptureId
                      ? "CHG" + paymentData.paypalCaptureId.slice(-8)
                      : paymentData?._id
                      ? "CHG" + paymentData._id.slice(-8).toUpperCase()
                      : "CHG" + Date.now().toString().slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${paymentData?.amount?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={handleDone}
              className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Done
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500 text-white text-4xl">
                ✕
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/payment")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Return to Payment
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentCompletePage;
