import { hasPermission } from "@/core/features/auth/permissions";
import { PLAN_LIMITS, PERMISSIONS } from "@/core/data/constants";
import type { UserPlan } from "@/core/drizzle/schema/user";
import { DatabaseError } from "@/core/lib/errors";

import { tryInsertResumeAnalysisDb } from "./db";

/**
 * Check if user can analyze resumes as per his/her plan
 */
export async function checkResumeAnalysisPermission(): Promise<boolean> {
  try {
    return await hasPermission(PERMISSIONS.RESUME_ANALYSES);
  } catch (error) {
    console.error("Error checking resume analysis permission:", error);
    throw new DatabaseError("Error checking resume analysis permission", error);
  }
}

/**
 * Reserves one resume analysis for the current request.
 * Pro users insert without quota checks; free users consume quota atomically.
 */
export async function reserveResumeAnalysisUsage(
  userId: string,
  userPlan: UserPlan,
  jobInfoId: string,
): Promise<boolean> {
  const canAnalyze = await checkResumeAnalysisPermission();

  if (!canAnalyze) {
    return false;
  }

  const reserved = await tryInsertResumeAnalysisDb({
    userId,
    jobInfoId,
    limit: PLAN_LIMITS[userPlan].resume_analyses,
  });

  return reserved != null;
}
