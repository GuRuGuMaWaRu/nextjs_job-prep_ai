import {
  hasPermission,
  PLAN_LIMITS,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { getUserAction } from "@/core/features/users/actions";
import type { UserPlan } from "@/core/drizzle/schema/user";

import { tryInsertResumeAnalysisDb } from "./db";

/**
 * Check if user can analyze resumes as per his/her plan
 */
export async function checkResumeAnalysisPermission(): Promise<boolean> {
  try {
    return await hasPermission(PERMISSIONS.RESUME_ANALYSES);
  } catch (error) {
    console.error("Error checking resume analysis permission:", error);
    return false;
  }
}

/**
 * Reserves one resume analysis for the current request.
 * Pro users insert without quota checks; free users consume quota atomically.
 */
export async function reserveResumeAnalysisUsage(
  userId: string,
  jobInfoId: string,
): Promise<boolean> {
  const canAnalyze = await checkResumeAnalysisPermission();

  if (!canAnalyze) {
    return false;
  }

  const user = await getUserAction(userId);

  if (!user) {
    return false;
  }

  const userPlan = (user.plan || "free") as UserPlan;

  const reserved = await tryInsertResumeAnalysisDb({
    userId,
    jobInfoId,
    limit: PLAN_LIMITS[userPlan].resume_analyses,
  });

  return reserved != null;
}
