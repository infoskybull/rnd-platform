import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { apiService } from "../services/api";
import {
  Check,
  X,
  TrendingUp,
  AlertCircle,
  Zap,
  BarChart3,
  Headphones,
  Settings,
  Sparkles,
} from "lucide-react";

interface Plan {
  _id: string;
  planType: "free" | "pro" | "business";
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  maxPrototypes: number;
  maxPrototypesPerMonth: number;
  maxAIRequests: number;
  maxAIRequestsPerMonth: number;
  maxTotalPrototypes: number;
  hasAdvancedFeatures: boolean;
  hasAnalyticsAccess: boolean;
  hasPrioritySupport: boolean;
  has247Support: boolean;
  hasCustomIntegrations: boolean;
  hasAdvancedAnalytics: boolean;
  isActive: boolean;
  isPopular: boolean;
}

interface SubscriptionData {
  plan: Plan;
  subscription: {
    _id: string;
    userId: string;
    planId: string;
    planType: "free" | "pro" | "business";
    status: string;
    startDate: string;
    endDate: string | null;
    cancelledAt: string | null;
    expiresAt: string | null;
    paymentId: string | null;
    paymentMethod: string | null;
    autoRenew: boolean;
    prototypesCreated: number;
    aiRequestsUsed: number;
    lastResetDate: string;
    createdAt: string;
    updatedAt: string;
  };
  usage: {
    prototypesCreated: number;
    aiRequestsUsed: number;
    plan: any;
    limits: {
      maxPrototypes: number;
      maxPrototypesPerMonth: number;
      maxAIRequests: number;
      maxAIRequestsPerMonth: number;
      maxTotalPrototypes: number;
    };
  };
}

const ManagePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansResponse, subscriptionResponse] = await Promise.all([
        apiService.getSubscriptionPlans(),
        apiService.getMySubscriptionPlan(),
      ]);

      if (plansResponse.success) {
        setPlans(plansResponse.data);
      }

      if (subscriptionResponse.success) {
        setSubscriptionData(subscriptionResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUpgrade = (planType: "pro" | "business") => {
    // Check if already on this plan
    if (subscriptionData?.plan.planType === planType) {
      alert("You are already on this plan!");
      return;
    }

    // Navigate to payment page with selected plan
    navigate(`/payment?plan=${planType}`);
  };

  const formatLimit = (limit: number): string => {
    if (limit === -1) return "Unlimited";
    return limit.toString();
  };

  const calculateProgress = (used: number, limit: number): number => {
    if (limit === -1) return 0;
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const isLimitReached = (used: number, limit: number): boolean => {
    if (limit === -1) return false;
    return used >= limit;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200">
        <ResponsiveNavbar
          title="Manage Plan"
          titleColor="text-indigo-400"
          user={user}
          onLogout={handleLogout}
          backButton={{
            text: "Back",
            onClick: () => navigate(-1),
          }}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading subscription data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200">
        <ResponsiveNavbar
          title="Manage Plan"
          titleColor="text-indigo-400"
          user={user}
          onLogout={handleLogout}
          backButton={{
            text: "Back",
            onClick: () => navigate(-1),
          }}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = subscriptionData?.plan;
  const usage = subscriptionData?.usage;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <ResponsiveNavbar
        title="Manage Plan"
        titleColor="text-indigo-400"
        user={user}
        onLogout={handleLogout}
        backButton={{
          text: "Back",
          onClick: () => navigate(-1),
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Current Plan Section */}
        {currentPlan && usage && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl border border-indigo-500/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Current Plan: {currentPlan.name}
                  </h2>
                  <p className="text-gray-400">{currentPlan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    {currentPlan.price === 0
                      ? "Free"
                      : `$${currentPlan.price}`}
                  </div>
                  {currentPlan.price > 0 && (
                    <div className="text-sm text-gray-400">/month</div>
                  )}
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Prototypes Usage */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <span className="text-sm font-medium text-gray-300">
                        Prototypes Created
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {usage.prototypesCreated} /{" "}
                      {formatLimit(usage.limits.maxPrototypesPerMonth)}
                    </span>
                  </div>
                  {usage.limits.maxPrototypesPerMonth !== -1 && (
                    <>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isLimitReached(
                              usage.prototypesCreated,
                              usage.limits.maxPrototypesPerMonth
                            )
                              ? "bg-red-500"
                              : calculateProgress(
                                  usage.prototypesCreated,
                                  usage.limits.maxPrototypesPerMonth
                                ) >= 80
                              ? "bg-yellow-500"
                              : "bg-indigo-500"
                          }`}
                          style={{
                            width: `${calculateProgress(
                              usage.prototypesCreated,
                              usage.limits.maxPrototypesPerMonth
                            )}%`,
                          }}
                        />
                      </div>
                      {isLimitReached(
                        usage.prototypesCreated,
                        usage.limits.maxPrototypesPerMonth
                      ) && (
                        <p className="text-xs text-red-400 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Limit reached! Upgrade to create more.</span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* AI Requests Usage */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-300">
                        AI Requests Used
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {usage.aiRequestsUsed} /{" "}
                      {formatLimit(usage.limits.maxAIRequestsPerMonth)}
                    </span>
                  </div>
                  {usage.limits.maxAIRequestsPerMonth !== -1 && (
                    <>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isLimitReached(
                              usage.aiRequestsUsed,
                              usage.limits.maxAIRequestsPerMonth
                            )
                              ? "bg-red-500"
                              : calculateProgress(
                                  usage.aiRequestsUsed,
                                  usage.limits.maxAIRequestsPerMonth
                                ) >= 80
                              ? "bg-yellow-500"
                              : "bg-yellow-500"
                          }`}
                          style={{
                            width: `${calculateProgress(
                              usage.aiRequestsUsed,
                              usage.limits.maxAIRequestsPerMonth
                            )}%`,
                          }}
                        />
                      </div>
                      {isLimitReached(
                        usage.aiRequestsUsed,
                        usage.limits.maxAIRequestsPerMonth
                      ) && (
                        <p className="text-xs text-red-400 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Limit reached! Upgrade for more AI requests.</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan?.planType === plan.planType;
              const isUpgrade =
                currentPlan &&
                ((currentPlan.planType === "free" && plan.planType === "pro") ||
                (currentPlan.planType === "free" && plan.planType === "business") ||
                (currentPlan.planType === "pro" && plan.planType === "business"));

              return (
                <div
                  key={plan._id}
                  className={`relative bg-gray-800/60 rounded-xl border p-6 flex flex-col h-full transition-all ${
                    plan.isPopular
                      ? "border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105"
                      : "border-gray-700"
                  } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
                >
                  {/* Popular Badge */}
                  {plan.isPopular && (
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
                        {plan.price === 0 ? "Free" : `$${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-400 text-lg">/month</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{plan.description}</p>
                  </div>

                  {/* Plan Features */}
                  <ul className="space-y-3 mb-6 flex-1">
                    <li className="flex items-start">
                      {plan.maxPrototypesPerMonth === -1 ? (
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="text-gray-300 text-sm">
                        {formatLimit(plan.maxPrototypesPerMonth)} prototypes/month
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">
                        {formatLimit(plan.maxAIRequestsPerMonth)} AI requests/month
                      </span>
                    </li>
                    {plan.hasAnalyticsAccess && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm flex items-center">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Analytics Access
                        </span>
                      </li>
                    )}
                    {plan.hasAdvancedAnalytics && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Advanced Analytics
                        </span>
                      </li>
                    )}
                    {plan.hasPrioritySupport && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm flex items-center">
                          <Headphones className="w-4 h-4 mr-1" />
                          Priority Support
                        </span>
                      </li>
                    )}
                    {plan.has247Support && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm flex items-center">
                          <Headphones className="w-4 h-4 mr-1" />
                          24/7 Support
                        </span>
                      </li>
                    )}
                    {plan.hasCustomIntegrations && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm flex items-center">
                          <Settings className="w-4 h-4 mr-1" />
                          Custom Integrations
                        </span>
                      </li>
                    )}
                    {!plan.hasAnalyticsAccess && (
                      <li className="flex items-start">
                        <X className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 text-sm">Analytics</span>
                      </li>
                    )}
                  </ul>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      if (plan.planType !== "free") {
                        handleUpgrade(plan.planType as "pro" | "business");
                      }
                    }}
                    disabled={isCurrentPlan || plan.planType === "free"}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                      isCurrentPlan
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : plan.isPopular
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                  >
                    {isCurrentPlan
                      ? "Current Plan"
                      : plan.planType === "free"
                      ? "Free Plan"
                      : isUpgrade
                      ? "Upgrade"
                      : "Select Plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Comparison Table */}
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Plan Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan._id}
                      className={`text-center py-3 px-4 text-sm font-semibold ${
                        plan.isPopular
                          ? "text-indigo-400"
                          : currentPlan?.planType === plan.planType
                          ? "text-green-400"
                          : "text-gray-300"
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-300">Price</td>
                  {plans.map((plan) => (
                    <td key={plan._id} className="py-3 px-4 text-center text-sm text-white">
                      {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-300">Prototypes/month</td>
                  {plans.map((plan) => (
                    <td key={plan._id} className="py-3 px-4 text-center text-sm text-white">
                      {formatLimit(plan.maxPrototypesPerMonth)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-300">AI Requests/month</td>
                  {plans.map((plan) => (
                    <td key={plan._id} className="py-3 px-4 text-center text-sm text-white">
                      {formatLimit(plan.maxAIRequestsPerMonth)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-300">Analytics</td>
                  {plans.map((plan) => (
                    <td key={plan._id} className="py-3 px-4 text-center">
                      {plan.hasAnalyticsAccess ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-300">Advanced Analytics</td>
                  {plans.map((plan) => (
                    <td key={plan._id} className="py-3 px-4 text-center">
                      {plan.hasAdvancedAnalytics ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-300">Priority Support</td>
                  {plans.map((plan) => (
                    <td key={plan._id} className="py-3 px-4 text-center">
                      {plan.hasPrioritySupport ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-gray-300">24/7 Support</td>
                  {plans.map((plan) => (
                    <td key={plan._id} className="py-3 px-4 text-center">
                      {plan.has247Support ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagePlanPage;

