import { hasPermission, PERMISSIONS } from "@/core/features/auth/permissions";

/**
 * Check if user can create interviews as per his/her plan
 */
export async function checkInterviewPermission(): Promise<boolean> {
  try {
    return await hasPermission(PERMISSIONS.INTERVIEWS);
  } catch (error) {
    console.error("Error checking interview permission:", error);
    return false;
  }
}
