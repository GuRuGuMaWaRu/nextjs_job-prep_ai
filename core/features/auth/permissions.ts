import { getCurrentUser } from "./server";
import { getUser } from "@/core/features/users/actions";
import type { UserPlan } from "@/core/drizzle/schema/user";

/**
 * Permission types that can be checked
 */
export type Permission =
  | "unlimited_interviews"
  | "unlimited_questions"
  | "unlimited_resume_analyses"
  | "limited_interviews"
  | "limited_questions";

/**
 * Plan configurations defining what each plan allows
 */
const PLAN_PERMISSIONS: Record<UserPlan, Permission[]> = {
  free: ["limited_interviews", "limited_questions"],
  pro: [
    "unlimited_interviews",
    "unlimited_questions",
    "unlimited_resume_analyses",
  ],
};

/**
 * Usage limits for free plan
 */
export const FREE_PLAN_LIMITS = {
  interviews: 1,
  questions: 5,
  resumeAnalyses: 0,
} as const;

/**
 * Check if the current user has a specific permission
 * @param permission - The permission to check
 * @returns true if user has the permission, false otherwise
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return false;
  }

  const user = await getUser(userId);

  if (!user) {
    return false;
  }

  const userPlan = (user.plan || "free") as UserPlan;
  const planPermissions = PLAN_PERMISSIONS[userPlan];

  return planPermissions.includes(permission);
}

/**
 * Get the current user's plan
 * @returns The user's plan or "free" if not found
 */
export async function getUserPlan(): Promise<UserPlan> {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return "free";
  }

  const user = await getUser(userId);

  return (user?.plan as UserPlan) || "free";
}

/**
 * Check if user has unlimited access to a feature
 * @param feature - The feature to check
 * @returns true if unlimited, false if limited or no access
 */
export async function hasUnlimitedAccess(
  feature: "interviews" | "questions" | "resume_analyses"
): Promise<boolean> {
  const permissionMap = {
    interviews: "unlimited_interviews" as Permission,
    questions: "unlimited_questions" as Permission,
    resume_analyses: "unlimited_resume_analyses" as Permission,
  };

  return hasPermission(permissionMap[feature]);
}
