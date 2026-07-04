import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getUserAction } from "@/core/features/users/actions";
import type { UserPlan } from "@/core/drizzle/schema/user";
import { getInterviewCountDb } from "@/core/features/interviews/db";
import { getQuestionCountDb } from "@/core/features/questions/db";
import { getResumeAnalysisCountDb } from "@/core/features/resumeAnalysis/db";
import {
  PERMISSIONS,
  type Permission,
  PLAN_LIMITS,
} from "@/core/data/constants";

/**
 * Check if the current user has a specific permission
 * @param permission - The permission to check
 * @returns true if user has the permission, false otherwise
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const { userId } = await getCurrentUserAction();

  if (!userId) {
    return false;
  }

  const user = await getUserAction(userId);

  if (!user) {
    return false;
  }

  const userPlan = (user.plan || "free") as UserPlan;
  const permissionLimit = PLAN_LIMITS[userPlan][permission];

  if (permissionLimit === null) {
    return true;
  }

  switch (permission) {
    case PERMISSIONS.INTERVIEWS:
      const interviewCount = await getInterviewCountDb(userId);
      return interviewCount < permissionLimit;

    case PERMISSIONS.QUESTIONS:
      const questionCount = await getQuestionCountDb(userId);
      return questionCount < permissionLimit;

    case PERMISSIONS.RESUME_ANALYSES:
      const resumeAnalysisCount = await getResumeAnalysisCountDb(userId);
      return resumeAnalysisCount < permissionLimit;

    default:
      return false;
  }
}

/**
 * Get the current user's plan
 * @returns The user's plan or "free" if not found
 */
export async function getUserPlan(): Promise<UserPlan> {
  const { userId } = await getCurrentUserAction();

  if (!userId) {
    return "free";
  }

  const user = await getUserAction(userId);

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
  const { userId } = await getCurrentUserAction();

  if (!userId) {
    return { plan: "free", hasExistingSubscription: false };
  }

  const user = await getUserAction(userId);

  return {
    plan: (user?.plan as UserPlan) || "free",
    hasExistingSubscription: !!user?.stripeSubscriptionId,
  };
}
