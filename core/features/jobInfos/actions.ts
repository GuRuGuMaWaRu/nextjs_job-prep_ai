"use server";

import { revalidatePath } from "next/cache";

import { routes } from "@/core/data/routes";
import { jobInfoSchema } from "@/core/features/jobInfos/schemas";
import {
  createJobInfoService,
  updateJobInfoService,
  getJobInfoService,
  getJobInfoByIdService,
  getJobInfosService,
  removeJobInfoService,
} from "@/core/features/jobInfos/service";
import { JOB_INFO_ACTION_MESSAGES } from "@/core/features/jobInfos/actionMessages";
import { ActionResult } from "@/core/dal/helpers";
import { JobInfoTable } from "@/core/drizzle/schema";
import {
  DatabaseError,
  NotFoundError,
  PermissionError,
  UnauthorizedError,
} from "@/core/dal/errors";

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
  unsafeData: unknown,
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate input (Action's responsibility)
  const validation = jobInfoSchema.safeParse(unsafeData);
  if (!validation.success) {
    return {
      success: false,
      message: JOB_INFO_ACTION_MESSAGES.invalidInput,
    };
  }

  try {
    // 2. Call service (handles business logic and permissions)
    const jobInfo = await createJobInfoService(validation.data);

    revalidatePath(routes.app);

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
        message: JOB_INFO_ACTION_MESSAGES.createUnauthorized,
      };
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.createDatabaseError,
      };
    }

    return {
      success: false,
      message: JOB_INFO_ACTION_MESSAGES.unexpectedError,
    };
  }
}

/**
 * Update an existing job info
 * Server action called from form submissions
 */
export async function updateJobInfoAction(
  id: string,
  unsafeData: unknown,
): Promise<ActionResult<{ id: string }>> {
  const validation = jobInfoSchema.safeParse(unsafeData);
  if (!validation.success) {
    return {
      success: false,
      message: JOB_INFO_ACTION_MESSAGES.invalidInput,
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
        message: JOB_INFO_ACTION_MESSAGES.updateUnauthorized,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.updateNotFound,
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
        message: JOB_INFO_ACTION_MESSAGES.updateDatabaseError,
      };
    }

    return {
      success: false,
      message: JOB_INFO_ACTION_MESSAGES.unexpectedError,
    };
  }
}

/**
 * Get a job info by ID
 * Used in pages to fetch data - throws on error for error boundary to catch
 */
export async function getJobInfoAction(id: string) {
  return await getJobInfoService(id);
}

/**
 * Get a job info by ID without ownership check
 * Used when ownership verification happens elsewhere
 */
export async function getJobInfoByIdAction(id: string) {
  return await getJobInfoByIdService(id);
}

/**
 * Get all job infos for current user
 * Used in pages to fetch list - throws on error for error boundary to catch
 */
export async function getJobInfosAction() {
  return await getJobInfosService();
}

/**
 * Remove a job info by ID
 * Used in pages to remove a job info + all related interviews and questions
 */
export async function removeJobInfoAction(
  id: string,
): Promise<ActionResult<typeof JobInfoTable.$inferSelect>> {
  try {
    const result = await removeJobInfoService(id);

    if (result.success) {
      revalidatePath(routes.app);
    }

    return result;
  } catch (error) {
    console.error("Failed to remove job info:", error);

    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.removeUnauthorized,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        message: JOB_INFO_ACTION_MESSAGES.removeNotFound,
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
        message: JOB_INFO_ACTION_MESSAGES.removeDatabaseError,
      };
    }

    return {
      success: false,
      message: JOB_INFO_ACTION_MESSAGES.unexpectedError,
    };
  }
}
