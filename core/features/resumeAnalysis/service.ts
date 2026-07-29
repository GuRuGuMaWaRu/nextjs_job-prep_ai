import { hasPermission } from "@/core/features/auth/permissions";
import { PLAN_LIMITS, PERMISSIONS } from "@/core/data/constants";
import { requireUser } from "@/core/lib/requireUser";

import { tryInsertResumeAnalysisDb } from "./db";

/**
 * Service Layer for Resume Analysis
 * Handles: Business logic, auth, permissions, quota reservation
 * Throws: UnauthorizedError, DatabaseError
 */

/**
 * Check if the signed-in user can analyze resumes under their plan.
 */
export async function checkResumeAnalysisPermissionService(): Promise<boolean> {
  const user = await requireUser();
  return await hasPermission(PERMISSIONS.RESUME_ANALYSES, user);
}

/**
 * Reserves one resume analysis for the current request.
 * Pro users insert without quota checks; free users consume quota atomically.
 */
export async function reserveResumeAnalysisUsageService(
  jobInfoId: string,
): Promise<boolean> {
  const user = await requireUser();

  const canAnalyze = await hasPermission(PERMISSIONS.RESUME_ANALYSES, user);
  if (!canAnalyze) {
    return false;
  }

  const reserved = await tryInsertResumeAnalysisDb({
    userId: user.id,
    jobInfoId,
    limit: PLAN_LIMITS[user.plan].resume_analyses,
  });

  return reserved != null;
}
