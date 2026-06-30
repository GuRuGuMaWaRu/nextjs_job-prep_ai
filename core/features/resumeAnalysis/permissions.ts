import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  hasPermission,
  FREE_PLAN_LIMITS,
  PERMISSIONS,
} from "@/core/features/auth/permissions";

import { getResumeAnalysisCountDb } from "./db";

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
