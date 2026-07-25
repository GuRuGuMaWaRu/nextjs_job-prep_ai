import { getCurrentUser } from "@/core/features/auth/helpers";
import type { UserPlan } from "@/core/drizzle/schema/user";
import { getInterviewCountDb } from "@/core/features/interviews/db";
import { getQuestionCountDb } from "@/core/features/questions/db";
import { getResumeAnalysisCountDb } from "@/core/features/resumeAnalysis/db";
import {
  PERMISSIONS,
  type Permission,
  PLAN_LIMITS,
} from "@/core/data/constants";
import { DatabaseError } from "@/core/dal/errors";

/**
 * Check if the current user has a specific permission
 * @param permission - The permission to check
 * @returns true if user has the permission, false otherwise
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const { user } = await getCurrentUser();

  if (user == null) {
    return false;
  }

  const userPlan = (user.plan as UserPlan) || "free";
  const permissionLimit = PLAN_LIMITS[userPlan][permission];

  if (permissionLimit === null) {
    return true;
  }

  try {
    switch (permission) {
      case PERMISSIONS.INTERVIEWS:
        const interviewCount = await getInterviewCountDb(user.id);
        return interviewCount < permissionLimit;

      case PERMISSIONS.QUESTIONS:
        const questionCount = await getQuestionCountDb(user.id);
        return questionCount < permissionLimit;

      case PERMISSIONS.RESUME_ANALYSES:
        const resumeAnalysisCount = await getResumeAnalysisCountDb(user.id);
        return resumeAnalysisCount < permissionLimit;

      default:
        return false;
    }
  } catch (error) {
    console.error("Error getting count", error);
    throw new DatabaseError("Failed to count", error);
  }
}

/**
 * Get the current user's plan
 * @returns The user's plan or "free" if not found
 */
export async function getUserPlan(): Promise<UserPlan> {
  const { user } = await getCurrentUser();

  if (user == null) {
    return "free";
  }

  return (user.plan as UserPlan) || "free";
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
  const { user } = await getCurrentUser();

  if (user == null) {
    return { plan: "free", hasExistingSubscription: false };
  }

  return {
    plan: (user.plan as UserPlan) || "free",
    hasExistingSubscription: user.stripeSubscriptionId != null,
  };
}
