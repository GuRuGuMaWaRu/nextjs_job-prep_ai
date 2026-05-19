import { getCurrentUserAction } from "@/core/features/auth/actions";
import { PERMISSIONS, hasPermission } from "@/core/features/auth/permissions";

/**
 * Check if user can analyze resumes
 * - Pro users: unlimited
 * - Free users: unlimited
 */
export async function checkResumeAnalysisPermission(): Promise<boolean> {
  try {
    const { userId } = await getCurrentUserAction();

    if (!userId) {
      return false;
    }

    // Currently all users can analyze resumes
    return await hasPermission(PERMISSIONS.UNLIMITED.RESUME_ANALYSES);
  } catch (error) {
    console.error("Error checking resume analysis permission:", error);
    return false;
  }
}
