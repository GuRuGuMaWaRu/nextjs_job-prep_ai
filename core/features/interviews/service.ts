import { refresh } from "next/cache";
import arcjet, { request, tokenBucket } from "@arcjet/next";

import {
  NotFoundError,
  PermissionError,
  RateLimitError,
} from "@/core/lib/errors";
import { requireUser } from "@/core/lib/requireUser";
import {
  getInterviewByIdDal,
  getInterviewsDal,
  insertInterviewDal,
  updateInterviewDal,
} from "@/core/features/interviews/dal";
import { checkInterviewPermission } from "@/core/features/interviews/permissions";
import { INTERVIEW_ERROR_MESSAGES } from "@/core/features/interviews/errorMessages";
import { getJobInfoDal } from "@/core/features/jobInfos/dal";
import { generateAiInterviewFeedback } from "@/core/services/ai/interviews";
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/core/data/constants";
import { env } from "@/core/data/env/server";

/**
 * Service Layer for Interviews
 * Handles: Business logic, auth, permissions, ownership, rate limiting
 * Throws: UnauthorizedError, PermissionError, RateLimitError, NotFoundError, DatabaseError
 */

const aj = arcjet({
  characteristics: ["userId"],
  key: env.ARCJET_KEY,
  rules: [
    tokenBucket({
      capacity: 12,
      refillRate: 4,
      interval: "1d",
      mode: "LIVE",
    }),
  ],
});

/**
 * Get interview by ID with ownership verification
 * Returns null if interview doesn't exist or user doesn't own it
 */
export async function getInterviewByIdService(id: string, userId: string) {
  await requireUser();

  const interview = await getInterviewByIdDal(id);

  if (!interview) {
    return null;
  }

  if (interview.jobInfo.userId !== userId) {
    return null;
  }

  return interview;
}

/**
 * Get all interviews for a job info
 * Requires authentication
 */
export async function getInterviewsService(jobInfoId: string) {
  const user = await requireUser();
  return await getInterviewsDal(jobInfoId, user.id);
}

/**
 * Create a new interview
 * Requires authentication, plan permission, rate limit allowance, and job info ownership
 */
export async function createInterviewService(jobInfoId: string) {
  const user = await requireUser();

  const permitted = await checkInterviewPermission();
  if (!permitted) {
    throw new PermissionError(PLAN_LIMIT_MESSAGE);
  }

  const decision = await aj.protect(await request(), {
    userId: user.id,
    requested: 1,
  });
  if (decision.isDenied()) {
    throw new RateLimitError(RATE_LIMIT_MESSAGE);
  }

  const jobInfo = await getJobInfoDal(jobInfoId, user.id);
  if (!jobInfo) {
    throw new NotFoundError(INTERVIEW_ERROR_MESSAGES.jobInfoNotFoundOrNoAccess);
  }

  return await insertInterviewDal({
    jobInfoId,
    duration: "00:00:00",
  });
}

/**
 * Update an interview
 * Requires authentication and ownership
 */
export async function updateInterviewService(
  id: string,
  data: { humeChatId?: string; duration?: string },
) {
  const user = await requireUser();

  const interview = await getInterviewByIdDal(id);

  if (!interview) {
    throw new PermissionError(INTERVIEW_ERROR_MESSAGES.notFoundOrNoAccess);
  }

  if (interview.jobInfo.userId !== user.id) {
    throw new PermissionError(INTERVIEW_ERROR_MESSAGES.updateForbidden);
  }

  return await updateInterviewDal(id, data);
}

/**
 * Generate AI feedback for an interview
 * Requires authentication, ownership, and rate limit allowance
 */
export async function generateInterviewFeedbackService(interviewId: string) {
  const user = await requireUser();

  const decision = await aj.protect(await request(), {
    userId: user.id,
    requested: 1,
  });
  if (decision.isDenied()) {
    throw new RateLimitError(RATE_LIMIT_MESSAGE);
  }

  const interview = await getInterviewByIdService(interviewId, user.id);

  if (!interview) {
    throw new PermissionError(INTERVIEW_ERROR_MESSAGES.notFoundOrNoAccess);
  }

  if (!interview.humeChatId) {
    throw new PermissionError(INTERVIEW_ERROR_MESSAGES.notCompleted);
  }

  const feedback = await generateAiInterviewFeedback({
    humeChatId: interview.humeChatId,
    jobInfo: interview.jobInfo,
    userName: user.name,
  });

  if (!feedback) {
    throw new Error(INTERVIEW_ERROR_MESSAGES.feedbackGenerationFailed);
  }

  await updateInterviewDal(interviewId, { feedback });
  refresh();

  return feedback;
}
