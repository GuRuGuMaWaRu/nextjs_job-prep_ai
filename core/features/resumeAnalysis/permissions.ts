import { getCurrentUser } from "@/core/features/auth/actions";
import { hasPermission } from "@/core/features/auth/permissions";

/**
 * Check if user can analyze resumes
 * - Pro users: unlimited
 * - Free users: no access
 */
export async function checkResumeAnalysisPermission(): Promise<boolean> {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return false;
  }

  // Only Pro users can analyze resumes
  return hasPermission("unlimited_resume_analyses");
}
