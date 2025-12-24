import {
  hasPermission,
  FREE_PLAN_LIMITS,
} from "@/core/features/auth/permissions";
import { getCurrentUser } from "@/core/features/auth/actions";
import { getQuestionCountDb } from "@/core/features/questions/db";

/**
 * Check if user can generate more questions
 * - Pro users: unlimited
 * - Free users: up to 5 questions
 */
export async function checkQuestionsPermission(): Promise<boolean> {
  const { userId } = await getCurrentUser();

  if (!userId) {
    return false;
  }

  // Check if user has unlimited questions (Pro plan)
  const hasUnlimited = await hasPermission("unlimited_questions");

  if (hasUnlimited) {
    return true;
  }

  // Check if user has limited questions permission (Free plan)
  const hasLimited = await hasPermission("limited_questions");

  if (!hasLimited) {
    return false;
  }

  // Check if user hasn't exceeded free plan limit
  const questionCount = await getQuestionCount();

  return questionCount < FREE_PLAN_LIMITS.questions;
}

async function getQuestionCount() {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return 0;
  }
  return getQuestionCountDb(userId);
}
