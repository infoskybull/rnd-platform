import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface Plan {
  id: "free" | "pro" | "business";
  name: string;
  price: string;
  features: string[];
  prototypeLimit: string;
  aiRequestLimit: string;
  popular?: boolean;
}

const PlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<
    "free" | "pro" | "business" | null
  >(null);

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      prototypeLimit: "1 free prototype/month",
      aiRequestLimit: "1 AI request",
      features: [
        "1 free prototype creation per month",
        "Limit 2 prototypes total",
        "1 AI request per month",
        "Basic support",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$29",
      prototypeLimit: "20 prototypes",
      aiRequestLimit: "200 AI requests",
      popular: true,
      features: [
        "Everything in Free",
        "Up to 20 prototypes",
        "200 AI requests per month",
        "Priority support",
        "Advanced features",
      ],
    },
    {
      id: "business",
      name: "Business",
      price: "$99",
      prototypeLimit: "Unlimited",
      aiRequestLimit: "500 AI requests",
      features: [
        "Everything in Pro",
        "Unlimited prototypes",
        "500 AI requests per month",
        "24/7 priority support",
        "Advanced analytics",
        "Custom integrations",
      ],
    },
  ];

  const currentPlanId = user?.plan || "free";

  const handleSelectPlan = (planId: "free" | "pro" | "business") => {
    if (planId === currentPlanId) {
      // Already on this plan
      return;
    }
    setSelectedPlan(planId);
    // Navigate to payment page with selected plan
    navigate(`/payment?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate(-1)}
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
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400">
            Select the plan that best fits your needs
          </p>
        </div>

        {/* Current Plan Indicator */}
        {currentPlanId && (
          <div className="mb-8 text-center">
            <span className="inline-block px-4 py-2 bg-indigo-900/30 border border-indigo-500 text-indigo-300 rounded-full text-sm">
              Current Plan:{" "}
              <span className="font-medium capitalize">{currentPlanId}</span>
            </span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const isUpgrade =
              (currentPlanId === "free" && plan.id === "pro") ||
              (currentPlanId === "free" && plan.id === "business") ||
              (currentPlanId === "pro" && plan.id === "business");
            const isDowngrade =
              (currentPlanId === "business" && plan.id === "pro") ||
              (currentPlanId === "business" && plan.id === "free") ||
              (currentPlanId === "pro" && plan.id === "free");

            return (
              <div
                key={plan.id}
                className={`relative bg-gray-800/60 rounded-xl border p-6 flex flex-col h-full ${
                  plan.id === "business"
                    ? "border-[#C0C0C0] shadow-lg shadow-[#C0C0C0]/30"
                    : plan.popular
                    ? "border-indigo-500 shadow-lg shadow-indigo-500/20"
                    : "border-gray-700"
                } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Current
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    {plan.price !== "$0" && (
                      <span className="text-gray-400 text-lg">/month</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>{plan.prototypeLimit}</div>
                    <div>{plan.aiRequestLimit}</div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    isCurrentPlan
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  {isCurrentPlan
                    ? "Current Plan"
                    : isUpgrade
                    ? "Upgrade"
                    : isDowngrade
                    ? "Downgrade"
                    : plan.id === "free"
                    ? "Get Started"
                    : "Select Plan"}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default PlanPage;
