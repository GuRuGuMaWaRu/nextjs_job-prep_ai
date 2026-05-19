"use server";

import arcjet, { request, tokenBucket } from "@arcjet/next";

import { checkInterviewPermission } from "@/core/features/interviews/permissions";
import { getJobInfoAction } from "@/core/features/jobInfos/actions";
import { getCurrentUserAction } from "@/core/features/auth/actions";
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/core/lib/errorToast";
import { env } from "@/core/data/env/server";
import { INTERVIEW_ACTION_MESSAGES } from "@/core/features/interviews/actionMessages";
import {
  UnauthorizedError,
  PermissionError,
  DatabaseError,
  ActionResult,
} from "@/core/dal/helpers";
import {
  createInterviewService,
  updateInterviewService,
  getInterviewByIdService,
  getInterviewsService,
  generateInterviewFeedbackService,
} from "@/core/features/interviews/service";

/**
 * Action Layer for Interviews
 * Handles: Rate limiting, permission checks, error conversion
 * Returns: ActionResult or throws for page-level actions
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
 * Create a new interview
 * Server action called from client - returns ActionResult
 */
export async function createInterviewAction({
  jobInfoId,
}: {
  jobInfoId: string;
}): Promise<ActionResult<{ id: string }>> {
  const { userId } = await getCurrentUserAction();
  if (userId == null) {
    return {
      success: false,
      message: INTERVIEW_ACTION_MESSAGES.createUnauthorized,
    };
  }

  try {
    // Check permissions
    const permitted = await checkInterviewPermission();
    if (!permitted) {
      return {
        success: false,
        message: PLAN_LIMIT_MESSAGE,
      };
    }

    // Check rate limit
    const decision = await aj.protect(await request(), {
      userId,
      requested: 1,
    });
    if (decision.isDenied()) {
      return {
        success: false,
        message: RATE_LIMIT_MESSAGE,
      };
    }

    // Verify job info exists and user has access
    const jobInfo = await getJobInfoAction(jobInfoId);
    if (jobInfo == null) {
      return {
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.createJobInfoNotFound,
      };
    }

    // Create interview
    const interview = await createInterviewService(jobInfoId);

    return {
      success: true,
      data: { id: interview.id },
    };
  } catch (error) {
    console.error("Error creating interview:", error);

    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.createUnauthorized,
      };
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.createDatabaseError,
      };
    }

    return {
      success: false,
      message: INTERVIEW_ACTION_MESSAGES.unexpectedError,
    };
  }
}

/**
 * Update an interview
 * Server action called from client - returns ActionResult
 */
export async function updateInterviewAction(
  id: string,
  data: { humeChatId?: string; duration?: string },
): Promise<ActionResult<void>> {
  try {
    await updateInterviewService(id, data);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating interview:", error);

    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.updateUnauthorized,
      };
    }

    if (error instanceof PermissionError) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.updateDatabaseError,
      };
    }

    return {
      success: false,
      message: INTERVIEW_ACTION_MESSAGES.unexpectedError,
    };
  }
}

/**
 * Get interview by ID
 * Used in pages - errors bubble up to error boundary
 */
export async function getInterviewByIdAction(id: string, userId: string) {
  return await getInterviewByIdService(id, userId);
}

/**
 * Check if user can create an interview
 * Used for UI permission checks
 */
export async function canCreateInterviewAction(): Promise<boolean> {
  return await checkInterviewPermission();
}

/**
 * Get all interviews for a job info
 * Used in pages - errors bubble up to error boundary
 */
export async function getInterviewsAction(jobInfoId: string, userId: string) {
  return await getInterviewsService(jobInfoId, userId);
}

/**
 * Generate AI feedback for an interview
 * Server action called from client - returns ActionResult
 */
export async function generateInterviewFeedbackAction(
  interviewId: string,
): Promise<ActionResult<void>> {
  try {
    await generateInterviewFeedbackService(interviewId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error generating interview feedback:", error);

    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.feedbackUnauthorized,
      };
    }

    if (error instanceof PermissionError) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        message: INTERVIEW_ACTION_MESSAGES.feedbackDatabaseError,
      };
    }

    return {
      success: false,
      message: INTERVIEW_ACTION_MESSAGES.feedbackUnexpectedError,
    };
  }
}
