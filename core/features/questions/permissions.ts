import { hasPermission, PERMISSIONS } from "@/core/features/auth/permissions";

/**
 * Check if user can generate questions as per his/her plan
 */
export async function checkQuestionsPermission(): Promise<boolean> {
  try {
    return await hasPermission(PERMISSIONS.QUESTIONS);
  } catch (error) {
    console.error("Error checking question permission:", error);
    return false;
  }
}
