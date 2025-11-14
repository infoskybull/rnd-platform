import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const PaymentCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState<string>("");

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

          // Determine success message and navigation based on payment type
          if (result.data.paymentType === "collaboration_budget") {
            setMessage(
              `Payment successful! Collaboration budget has been paid. Redirecting...`
            );
            setTimeout(() => {
              // Redirect to project detail page or collaboration page
              if (result.data.collaborationId) {
                navigate(`/collaboration/${result.data.collaborationId}`);
              } else if (result.data.projectId) {
                navigate(`/project-detail/${result.data.projectId}`);
              } else {
                navigate("/dashboard");
              }
            }, 2000);
          } else if (result.data.projectId) {
            setMessage(
              `Payment successful! Project has been purchased. Redirecting...`
            );
            setTimeout(() => {
              navigate(`/project-detail/${result.data.projectId}`);
            }, 2000);
          } else if (result.data.paymentType === "subscription") {
            setMessage(
              `Payment successful! Your subscription has been upgraded. Redirecting...`
            );
            setTimeout(() => {
              navigate("/manage-plan");
            }, 2000);
          } else {
            setMessage("Payment completed successfully! Redirecting...");
            setTimeout(() => {
              navigate("/dashboard");
            }, 2000);
          }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Processing Payment
            </h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white text-4xl">
                ✓
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500 text-white text-4xl">
                ✕
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              Payment Failed
            </h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <button
              onClick={() => navigate("/payment")}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Return to Payment
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCompletePage;
