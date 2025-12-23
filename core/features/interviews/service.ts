import { refresh } from "next/cache";

import {
  requireUser,
  requireUserWithData,
  PermissionError,
} from "@/core/dal/helpers";
import {
  getInterviewByIdDal,
  getInterviewsDal,
  insertInterviewDal,
  updateInterviewDal,
} from "@/core/features/interviews/dal";
import { generateAiInterviewFeedback } from "@/core/services/ai/interviews";

/**
 * Service Layer for Interviews
 * Handles: Business logic, permissions, ownership verification
 * Throws: UnauthorizedError, PermissionError, DatabaseError
 */

/**
 * Get interview by ID with ownership verification
 * Returns null if interview doesn't exist or user doesn't own it
 */
export async function getInterviewByIdService(id: string, userId: string) {
  const interview = await getInterviewByIdDal(id);

  if (!interview) {
    return null;
  }

  // Check ownership
  if (interview.jobInfo.userId !== userId) {
    return null;
  }

  return interview;
}

/**
 * Get all interviews for a job info
 * Requires authentication
 */
export async function getInterviewsService(jobInfoId: string, userId: string) {
  return await getInterviewsDal(jobInfoId, userId);
}

/**
 * Create a new interview
 * Note: Auth and ownership checks handled by action layer
 */
export async function createInterviewService(jobInfoId: string) {
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
  data: { humeChatId?: string; duration?: string }
) {
  const userId = await requireUser();

  // Verify ownership
  const interview = await getInterviewByIdDal(id);

  if (!interview) {
    throw new PermissionError(
      "Interview not found or you don't have access to it"
    );
  }

  if (interview.jobInfo.userId !== userId) {
    throw new PermissionError(
      "You don't have permission to update this interview"
    );
  }

  return await updateInterviewDal(id, data);
}

/**
 * Generate AI feedback for an interview
 * Requires authentication and ownership
 */
export async function generateInterviewFeedbackService(interviewId: string) {
  const { userId, user } = await requireUserWithData();

  // Get interview with ownership check
  const interview = await getInterviewByIdService(interviewId, userId);

  if (!interview) {
    throw new PermissionError(
      "Interview not found or you don't have access to it"
    );
  }

  if (!interview.humeChatId) {
    throw new PermissionError("Interview has not been completed yet");
  }

  // Generate feedback
  const feedback = await generateAiInterviewFeedback({
    humeChatId: interview.humeChatId,
    jobInfo: interview.jobInfo,
    userName: user.name,
  });

  if (!feedback) {
    throw new Error("Failed to generate feedback");
  }

  // Update interview with feedback
  await updateInterviewDal(interviewId, { feedback });
  refresh();

  return feedback;
}
