import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  hasPermission,
  FREE_PLAN_LIMITS,
  PERMISSIONS,
} from "@/core/features/auth/permissions";

import {
  getResumeAnalysisCountDb,
  insertResumeAnalysisDb,
  tryInsertResumeAnalysisDb,
} from "./db";

/**
 * Check if user can analyze resumes
 * - Pro users: unlimited
 * - Free users: up to FREE_PLAN_LIMITS.resume_analyses
 */
export async function checkResumeAnalysisPermission(): Promise<boolean> {
  try {
    const { userId } = await getCurrentUserAction();

    if (!userId) {
      return false;
    }

    const hasUnlimited = await hasPermission(
      PERMISSIONS.UNLIMITED.RESUME_ANALYSES,
    );

    if (hasUnlimited) {
      return true;
    }

    const hasLimited = await hasPermission(PERMISSIONS.LIMITED.RESUME_ANALYSES);

    if (!hasLimited) {
      return false;
    }

    const resumeAnalysisCount = await getResumeAnalysisCount(userId);

    return resumeAnalysisCount < FREE_PLAN_LIMITS.resume_analyses;
  } catch (error) {
    console.error("Error checking resume analysis permission:", error);
    return false;
  }
}

async function getResumeAnalysisCount(userId: string) {
  return getResumeAnalysisCountDb(userId);
}

/**
 * Reserves one resume analysis for the current request.
 * Pro users insert without quota checks; free users consume quota atomically.
 */
export async function reserveResumeAnalysisUsage(
  userId: string,
  jobInfoId: string,
): Promise<boolean> {
  const hasUnlimited = await hasPermission(
    PERMISSIONS.UNLIMITED.RESUME_ANALYSES,
  );

  if (hasUnlimited) {
    await insertResumeAnalysisDb({ jobInfoId });
    return true;
  }

  const hasLimited = await hasPermission(PERMISSIONS.LIMITED.RESUME_ANALYSES);

  if (!hasLimited) {
    return false;
  }

  const reserved = await tryInsertResumeAnalysisDb({
    userId,
    jobInfoId,
    limit: FREE_PLAN_LIMITS.resume_analyses,
  });

  return reserved != null;
}
