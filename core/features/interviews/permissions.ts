import { hasPermission } from "@/core/features/auth/permissions";
import { PERMISSIONS } from "@/core/data/constants";

/**
 * Check if user can create interviews as per his/her plan
 */
export async function checkInterviewPermission(): Promise<boolean> {
  return await hasPermission(PERMISSIONS.INTERVIEWS);
}
