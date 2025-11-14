import React from "react";
import { useNavigate } from "react-router-dom";

const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500 text-white text-4xl">
            ⚠
          </div>
        </div>
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">
          Payment Cancelled
        </h2>
        <p className="text-gray-300 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/payment")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;

