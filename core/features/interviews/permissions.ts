import { getInterviewCountDb } from "@/core/features/interviews/db";
import { getCurrentUser } from "@/core/features/auth/server";
import {
  hasPermission,
  FREE_PLAN_LIMITS,
} from "@/core/features/auth/permissions";

/**
 * Check if user can create more interviews
 * - Pro users: unlimited
 * - Free users: up to 1 interview
 */
export async function checkInterviewPermission(): Promise<boolean> {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return false;
  }

  // Check if user has unlimited interviews (Pro plan)
  const hasUnlimited = await hasPermission("unlimited_interviews");

  if (hasUnlimited) {
    return true;
  }

  // Check if user has limited interviews permission (Free plan)
  const hasLimited = await hasPermission("limited_interviews");

  if (!hasLimited) {
    return false;
  }

  // Check if user hasn't exceeded free plan limit
  const interviewCount = await getInterviewCount();

  return interviewCount < FREE_PLAN_LIMITS.interviews;
}

async function getInterviewCount() {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return 0;
  }
  return getInterviewCountDb(userId);
}
