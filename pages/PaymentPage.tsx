import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Web3WalletModal from "../components/Web3WalletModal";
import { Web3WalletCredentials } from "../types";
import { useTonConnect } from "../hooks/useTonConnect";
import { useAccount } from "wagmi";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { useSuiWallet } from "../contexts/SuiWalletContext";

type PlanType = "free" | "pro" | "business";
type PaymentMethod = "visa" | "web3";

interface PlanDetails {
  name: string;
  price: number;
}

const planDetails: Record<PlanType, PlanDetails> = {
  free: { name: "Free", price: 0 },
  pro: { name: "Pro", price: 29 },
  business: { name: "Business", price: 99 },
};

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const selectedPlanId = (searchParams.get("plan") as PlanType) || "pro";

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("visa");
  const [showWeb3Modal, setShowWeb3Modal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPlan = planDetails[selectedPlanId];

  // Web3 wallet hooks
  const { walletAddress: tonAddress, isConnected: isTonConnected } =
    useTonConnect();
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { walletAddress: suiAddress, isConnected: isSuiConnected } =
    useSuiWallet();
  const { publicKey: solanaPublicKey, isConnected: isSolanaConnected } =
    useSolanaWallet();

  useEffect(() => {
    if (!selectedPlanId || selectedPlanId === "free") {
      navigate("/plan");
    }
  }, [selectedPlanId, navigate]);

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
      // TODO: Integrate with payment API
      // For now, simulate payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // After successful payment, update user plan
      // await apiService.updateUserPlan(selectedPlanId);

      alert(
        `Payment successful! Your plan has been upgraded to ${selectedPlan.name}.`
      );
      // Navigate back to settings based on user role
      if (user?.role === "creator") {
        navigate("/dashboard/creator/settings");
      } else if (user?.role === "publisher") {
        navigate("/dashboard/publisher/settings");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      alert("Payment failed. Please try again.");
      console.error("Payment error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleWeb3Payment = async (credentials: Web3WalletCredentials) => {
    setProcessing(true);
    try {
      // TODO: Integrate with Web3 payment API
      // For now, simulate payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // After successful payment, update user plan
      // await apiService.updateUserPlan(selectedPlanId, credentials);

      alert(
        `Payment successful! Your plan has been upgraded to ${selectedPlan.name}.`
      );
      setShowWeb3Modal(false);
      // Navigate back to settings based on user role
      if (user?.role === "creator") {
        navigate("/dashboard/creator/settings");
      } else if (user?.role === "publisher") {
        navigate("/dashboard/publisher/settings");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      alert("Payment failed. Please try again.");
      console.error("Web3 payment error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const isWeb3WalletConnected =
    isTonConnected || isEthConnected || isSuiConnected || isSolanaConnected;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate("/plan")}
            className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back to Plans</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Payment
          </h1>
          <p className="text-gray-400">
            Upgrade to {selectedPlan.name} Plan - ${selectedPlan.price}/month
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
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-white">${selectedPlan.price}/mo</span>
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
              <div className="grid grid-cols-2 gap-4 mb-6">
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
                    <span>VISA / Card</span>
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
                    <span>Web3 Wallet</span>
                  </div>
                </button>
              </div>

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
                        setCardDetails({ ...cardDetails, name: e.target.value })
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
                    {processing
                      ? "Processing..."
                      : `Pay $${selectedPlan.price}`}
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
                          // Create dummy credentials for now
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
                        {processing
                          ? "Processing..."
                          : `Pay $${selectedPlan.price}`}
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
  );
};

export default PaymentPage;
