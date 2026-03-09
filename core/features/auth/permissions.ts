import { getCurrentUser } from "@/core/features/auth/actions";
import { getUser } from "@/core/features/users/actions";
import type { UserPlan } from "@/core/drizzle/schema/user";

/**
 * Permission types that can be checked
 */
export const PERMISSIONS = {
  UNLIMITED: {
    INTERVIEWS: "unlimited_interviews",
    QUESTIONS: "unlimited_questions",
    RESUME_ANALYSES: "unlimited_resume_analyses",
  },
  LIMITED: {
    INTERVIEWS: "limited_interviews",
    QUESTIONS: "limited_questions",
  },
} as const;

type ValueOf<T> = T[keyof T];

export type Permission =
  | ValueOf<typeof PERMISSIONS.UNLIMITED>
  | ValueOf<typeof PERMISSIONS.LIMITED>;

/**
 * Plan configurations defining what each plan allows
 */
const PLAN_PERMISSIONS: Record<UserPlan, Permission[]> = {
  free: [
    PERMISSIONS.LIMITED.INTERVIEWS,
    PERMISSIONS.LIMITED.QUESTIONS,
    PERMISSIONS.UNLIMITED.RESUME_ANALYSES,
  ],
  pro: [
    PERMISSIONS.UNLIMITED.INTERVIEWS,
    PERMISSIONS.UNLIMITED.QUESTIONS,
    PERMISSIONS.UNLIMITED.RESUME_ANALYSES,
  ],
};

/**
 * Map of features to unlimited permissions
 */
const UNLIMITED_PERMISSION_MAP = {
  interviews: PERMISSIONS.UNLIMITED.INTERVIEWS,
  questions: PERMISSIONS.UNLIMITED.QUESTIONS,
  resume_analyses: PERMISSIONS.UNLIMITED.RESUME_ANALYSES,
} as const;

/**
 * Usage limits for free plan
 */
export const FREE_PLAN_LIMITS = {
  interviews: 1,
  questions: 10,
  resume_analyses: 3,
} as const;

/**
 * Check if the current user has a specific permission
 * @param permission - The permission to check
 * @returns true if user has the permission, false otherwise
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return false;
  }

  const user = await getUser(userId);

  if (!user) {
    return false;
  }

  const userPlan = (user.plan || "free") as UserPlan;
  const planPermissions = PLAN_PERMISSIONS[userPlan];

  return planPermissions.includes(permission);
}

/**
 * Get the current user's plan
 * @returns The user's plan or "free" if not found
 */
export async function getUserPlan(): Promise<UserPlan> {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return "free";
  }

  const user = await getUser(userId);

  return (user?.plan as UserPlan) || "free";
}

export type SubscriptionInfo = {
  plan: UserPlan;
  hasExistingSubscription: boolean;
};

/**
 * Returns the user's plan together with whether they have a Stripe subscription
 * (active, past_due, etc.). Needed by the upgrade page to show the correct UI
 * for users whose subscription is in a non-terminal but non-active state.
 */
export async function getUserSubscriptionInfo(): Promise<SubscriptionInfo> {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return { plan: "free", hasExistingSubscription: false };
  }

  const user = await getUser(userId);

  return {
    plan: (user?.plan as UserPlan) || "free",
    hasExistingSubscription: !!user?.stripeSubscriptionId,
  };
}

/**
 * Check if user has unlimited access to a feature
 * @param feature - The feature to check
 * @returns true if unlimited, false if limited or no access
 */
export async function hasUnlimitedAccess(
  feature: keyof typeof UNLIMITED_PERMISSION_MAP,
): Promise<boolean> {
  return hasPermission(UNLIMITED_PERMISSION_MAP[feature]);
}
