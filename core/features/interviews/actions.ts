"use server";

import { z } from "zod";

import { INTERVIEW_ERROR_MESSAGES } from "@/core/features/interviews/errorMessages";
import { checkInterviewPermission } from "@/core/features/interviews/permissions";
import {
  createInterviewService,
  updateInterviewService,
  getInterviewByIdService,
  getInterviewsService,
  generateInterviewFeedbackService,
} from "@/core/features/interviews/service";
import { ActionResult } from "@/core/lib/types";
import {
  DatabaseError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  UnauthorizedError,
} from "@/core/lib/errors";
import { RATE_LIMIT_MESSAGE } from "@/core/data/constants";

/**
 * Action Layer for Interviews
 * Handles: Input validation, error conversion to user-friendly messages
 * Returns: ActionResult for client mutations; throws for page-level reads
 */

const updateInterviewSchema = z
  .object({
    humeChatId: z.string().min(1).optional(),
    duration: z.string().min(1).optional(),
  })
  .strict()
  .refine(
    (data) => data.humeChatId !== undefined || data.duration !== undefined,
  );

/**
 * Create a new interview
 * Server action called from client - returns ActionResult
 */
export async function createInterviewAction({
  jobInfoId,
}: {
  jobInfoId: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
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
        message: INTERVIEW_ERROR_MESSAGES.createUnauthorized,
      };
    }

    if (error instanceof PermissionError) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (error instanceof RateLimitError) {
      return {
        success: false,
        message: RATE_LIMIT_MESSAGE,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.jobInfoNotFoundOrNoAccess,
      };
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.createDatabaseError,
      };
    }

    return {
      success: false,
      message: INTERVIEW_ERROR_MESSAGES.unexpectedError,
    };
  }
}

/**
 * Update an interview
 * Server action called from client - returns ActionResult
 */
export async function updateInterviewAction(
  id: string,
  unsafeData: unknown,
): Promise<ActionResult<void>> {
  const validation = updateInterviewSchema.safeParse(unsafeData);
  if (!validation.success) {
    return {
      success: false,
      message: INTERVIEW_ERROR_MESSAGES.updateInvalidInput,
    };
  }

  try {
    await updateInterviewService(id, validation.data);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating interview:", error);

    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        message: INTERVIEW_ERROR_MESSAGES.updateUnauthorized,
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
        message: INTERVIEW_ERROR_MESSAGES.updateDatabaseError,
      };
    }

    return {
      success: false,
      message: INTERVIEW_ERROR_MESSAGES.unexpectedError,
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
 * Used for UI permission checks; errors bubble to callers/error boundaries
 */
export async function canCreateInterviewAction(): Promise<boolean> {
  return await checkInterviewPermission();
}

/**
 * Get all interviews for a job info
 * Used in pages - errors bubble up to error boundary
 */
export async function getInterviewsAction(jobInfoId: string) {
  return await getInterviewsService(jobInfoId);
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
        message: INTERVIEW_ERROR_MESSAGES.feedbackUnauthorized,
      };
    }

    if (error instanceof RateLimitError) {
      return {
        success: false,
        message: RATE_LIMIT_MESSAGE,
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
        message: INTERVIEW_ERROR_MESSAGES.feedbackDatabaseError,
      };
    }

    return {
      success: false,
      message: INTERVIEW_ERROR_MESSAGES.feedbackUnexpectedError,
    };
  }
}
