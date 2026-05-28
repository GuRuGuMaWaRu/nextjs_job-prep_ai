import {
  hasPermission,
  FREE_PLAN_LIMITS,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { getCurrentUserAction } from "@/core/features/auth/actions";
import { getQuestionCountDb } from "@/core/features/questions/db";

/**
 * Check if user can generate more questions
 * - Pro users: unlimited
 * - Free users: up to FREE_PLAN_LIMITS.questions
 */
export async function checkQuestionsPermission(): Promise<boolean> {
  try {
    const { userId } = await getCurrentUserAction();

    if (!userId) {
      return false;
    }

    // Check if user has unlimited questions (Pro plan)
    const hasUnlimited = await hasPermission(PERMISSIONS.UNLIMITED.QUESTIONS);

    if (hasUnlimited) {
      return true;
    }

    // Check if user has limited questions permission (Free plan)
    const hasLimited = await hasPermission(PERMISSIONS.LIMITED.QUESTIONS);

    if (!hasLimited) {
      return false;
    }

    // Check if user hasn't exceeded free plan limit
    const questionCount = await getQuestionCount(userId);

    return questionCount < FREE_PLAN_LIMITS.questions;
  } catch (error) {
    console.error("Error checking question permission:", error);
    return false;
  }
}

async function getQuestionCount(userId: string) {
  return getQuestionCountDb(userId);
}
