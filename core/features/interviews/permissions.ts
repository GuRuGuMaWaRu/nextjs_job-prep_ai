import {
  getInterviewCountDb,
  insertInterviewDb,
  tryInsertInterviewDb,
} from "@/core/features/interviews/db";
import { getCurrentUserAction } from "@/core/features/auth/actions";
import {
  hasPermission,
  FREE_PLAN_LIMITS,
  PERMISSIONS,
} from "@/core/features/auth/permissions";
import { DatabaseError } from "@/core/dal/errors";

/**
 * Check if user can create more interviews
 * - Pro users: unlimited
 * - Free users: up to 1 interview
 */
export async function checkInterviewPermission(): Promise<boolean> {
  // Check if user has unlimited interviews (Pro plan)
  const hasUnlimited = await hasPermission(PERMISSIONS.UNLIMITED.INTERVIEWS);

  if (hasUnlimited) {
    return true;
  }

  // Check if user has limited interviews permission (Free plan)
  const hasLimited = await hasPermission(PERMISSIONS.LIMITED.INTERVIEWS);

  if (!hasLimited) {
    return false;
  }

  // Check if user hasn't exceeded free plan limit
  const interviewCount = await getInterviewCount();

  return interviewCount < FREE_PLAN_LIMITS.interviews;
}

async function getInterviewCount() {
  const { userId } = await getCurrentUserAction();
  if (userId == null) {
    return 0;
  }
  return getInterviewCountDb(userId);
}

export async function reserveInterviewUsage(
  userId: string,
  jobInfoId: string,
): Promise<{ id: string; jobInfoId: string } | null> {
  const interview = { jobInfoId, duration: "00:00:00" };
  const hasUnlimited = await hasPermission(PERMISSIONS.UNLIMITED.INTERVIEWS);

  if (hasUnlimited) {
    return runInterviewReservation(() => insertInterviewDb(interview));
  }

  const hasLimited = await hasPermission(PERMISSIONS.LIMITED.INTERVIEWS);

  if (!hasLimited) {
    return null;
  }

  return runInterviewReservation(() =>
    tryInsertInterviewDb({
      userId,
      interview,
      limit: FREE_PLAN_LIMITS.interviews,
    }),
  );
}

async function runInterviewReservation<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    throw new DatabaseError("Failed to reserve interview quota", error);
  }
}
