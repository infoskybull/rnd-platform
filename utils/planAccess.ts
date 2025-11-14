import { CurrentPlanDetails, User } from "../types";

const PLAN_PRIORITY: Record<string, number> = {
  free: 0,
  pro: 1,
  business: 2,
};

export type PlanTier = "free" | "pro" | "business";

export interface PlanAccessRequirement {
  minPlan?: PlanTier;
  features?: Array<keyof CurrentPlanDetails>;
}

export const getPlanCode = (user?: User | null): PlanTier => {
  if (!user) {
    return "free";
  }

  const rawPlan =
    (typeof user.currentPlan?.planType === "string"
      ? user.currentPlan.planType
      : null) ||
    (typeof user.plan === "string" ? user.plan : null) ||
    "free";

  const normalized = rawPlan.toString().toLowerCase();

  if (normalized in PLAN_PRIORITY) {
    return normalized as PlanTier;
  }

  return "free";
};

export const hasPlanTier = (
  user: User | null | undefined,
  minTier: PlanTier
): boolean => {
  const currentTier = PLAN_PRIORITY[getPlanCode(user)];
  const requiredTier = PLAN_PRIORITY[minTier] ?? 0;
  return currentTier >= requiredTier;
};

export const hasPlanFeature = (
  user: User | null | undefined,
  feature: keyof CurrentPlanDetails
): boolean => {
  const planCode = getPlanCode(user);
  const FEATURE_DEFAULTS: Record<
    PlanTier,
    Partial<Record<keyof CurrentPlanDetails, boolean>>
  > = {
    free: {},
    pro: {
      hasAdvancedFeatures: true,
      hasAnalyticsAccess: true,
      hasPrioritySupport: true,
    },
    business: {
      hasAdvancedFeatures: true,
      hasAnalyticsAccess: true,
      hasPrioritySupport: true,
      has247Support: true,
      hasCustomIntegrations: true,
      hasAdvancedAnalytics: true,
    },
  };

  const plan = user?.currentPlan;
  if (!plan) {
    return FEATURE_DEFAULTS[planCode]?.[feature] ?? false;
  }
  const value = plan[feature];
  if (typeof value === "boolean") {
    return value;
  }
  return FEATURE_DEFAULTS[planCode]?.[feature] ?? false;
};

export const meetsPlanRequirements = (
  user: User | null | undefined,
  requirement?: PlanAccessRequirement
): boolean => {
  if (!requirement) {
    return true;
  }

  const { minPlan, features } = requirement;

  if (minPlan && !hasPlanTier(user, minPlan)) {
    return false;
  }

  if (features && features.length > 0) {
    const hasAllFeatures = features.every((feature) =>
      hasPlanFeature(user, feature)
    );

    if (!hasAllFeatures) {
      return false;
    }
  }

  return true;
};

