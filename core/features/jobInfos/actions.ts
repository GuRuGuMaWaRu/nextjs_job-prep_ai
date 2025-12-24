"use server";

import { jobInfoSchema } from "@/core/features/jobInfos/schemas";
import {
  createJobInfoService,
  updateJobInfoService,
  getJobInfoService,
  getJobInfoByIdService,
  getJobInfosService,
} from "@/core/features/jobInfos/service";
import {
  UnauthorizedError,
  NotFoundError,
  PermissionError,
  DatabaseError,
  ActionResult,
} from "@/core/dal/helpers";

/**
 * Action Layer for JobInfo
 * Handles: Input validation, error conversion to user-friendly messages
 * Returns: ActionResult<T> for consistent error handling
 */

/**
 * Create a new job info
 * Server action called from form submissions
 */
export async function createJobInfoAction(
  unsafeData: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate input (Action's responsibility)
  const validation = jobInfoSchema.safeParse(unsafeData);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid job information. Please check all required fields.",
    };
  }

  try {
    // 2. Call service (handles business logic and permissions)
    const jobInfo = await createJobInfoService(validation.data);

    // 3. Return success with data for client-side redirect
    return {
      success: true,
      data: { id: jobInfo.id },
    };
  } catch (error) {
    // 4. Catch ALL errors and convert to user-friendly messages
    console.error("Failed to create job info:", error);

    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        message: "You must be logged in to create a job posting.",
      };
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        message: "Failed to save job posting. Please try again.",
      };
    }

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Update an existing job info
 * Server action called from form submissions
 */
export async function updateJobInfoAction(
  id: string,
  unsafeData: unknown
): Promise<ActionResult<{ id: string }>> {
  const validation = jobInfoSchema.safeParse(unsafeData);
  if (!validation.success) {
    return {
      success: false,
      message: "Invalid job information. Please check all required fields.",
    };
  }

  try {
    const jobInfo = await updateJobInfoService(id, validation.data);

    return {
      success: true,
      data: { id: jobInfo.id },
    };
  } catch (error) {
    console.error("Failed to update job info:", error);

    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        message: "You must be logged in to update this job posting.",
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        message: "Job posting not found or you don't have access to it.",
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
        message: "Failed to update job posting. Please try again.",
      };
    }

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get a job info by ID
 * Used in pages to fetch data - throws on error for error boundary to catch
 */
export async function getJobInfo(id: string) {
  return await getJobInfoService(id);
}

/**
 * Get a job info by ID without ownership check
 * Used when ownership verification happens elsewhere
 */
export async function getJobInfoById(id: string) {
  return await getJobInfoByIdService(id);
}

/**
 * Get all job infos for current user
 * Used in pages to fetch list - throws on error for error boundary to catch
 */
export async function getJobInfos() {
  return await getJobInfosService();
}
