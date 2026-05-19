import { getCurrentUserAction } from "@/core/features/auth/actions";
import { PERMISSIONS, hasPermission } from "@/core/features/auth/permissions";

/**
 * Check if user can analyze resumes
 * - Pro users: unlimited
 * - Free users: unlimited
 */
export async function checkResumeAnalysisPermission(): Promise<boolean> {
  const { userId } = await getCurrentUserAction();

  if (!userId) {
    return false;
  }

  // Currently all users can analyze resumes
  return hasPermission(PERMISSIONS.UNLIMITED.RESUME_ANALYSES);
}
