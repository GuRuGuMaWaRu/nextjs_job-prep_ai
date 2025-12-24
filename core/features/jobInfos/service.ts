import { z } from "zod";

import { jobInfoSchema } from "./schemas";
import {
  createJobInfoDal,
  getJobInfoDal,
  getJobInfoByIdDal,
  getJobInfosDal,
  updateJobInfoDal,
} from "./dal";
import {
  requireUser,
  PermissionError,
  NotFoundError,
} from "@/core/dal/helpers";

/**
 * Service Layer for JobInfo
 * Handles: Business logic, permissions, validation enforcement
 * Throws: UnauthorizedError (from requireUser), PermissionError, NotFoundError
 */

/**
 * Create a new job info entry
 * Enforces: User must be authenticated
 * Business rules: None currently, but could add plan limits here
 */
export async function createJobInfoService(
  data: z.infer<typeof jobInfoSchema>
) {
  // Get authenticated user (throws if not logged in)
  const userId = await requireUser();

  // Business rule: Could check plan limits here
  // For now, all authenticated users can create job infos

  // Call DAL to persist data
  const jobInfo = await createJobInfoDal({
    ...data,
    userId,
  });

  return jobInfo;
}

/**
 * Update an existing job info
 * Enforces: User must own the job info
 */
export async function updateJobInfoService(
  id: string,
  data: z.infer<typeof jobInfoSchema>
) {
  const userId = await requireUser();

  const existingJobInfo = await getJobInfoDal(id, userId);

  if (!existingJobInfo) {
    throw new NotFoundError(
      "Job posting not found or you don't have permission to edit it."
    );
  }

  if (existingJobInfo.userId !== userId) {
    throw new PermissionError(
      "You don't have permission to edit this job posting."
    );
  }

  const updated = await updateJobInfoDal(id, data);

  return updated;
}

/**
 * Get a single job info with ownership verification
 * Enforces: User must own the job info
 * Returns null if not found or user doesn't own it
 */
export async function getJobInfoService(id: string) {
  const userId = await requireUser();
  // This checks both auth and ownership, returns null if not found
  return await getJobInfoDal(id, userId);
}

/**
 * Get a single job info by ID without ownership check
 * Use this for public access or when ownership check happens elsewhere
 */
export async function getJobInfoByIdService(id: string) {
  return await getJobInfoByIdDal(id);
}

/**
 * Get all job infos for the current user
 * Enforces: User must be authenticated
 */
export async function getJobInfosService() {
  const userId = await requireUser();
  return await getJobInfosDal(userId);
}

/**
 * Verify user has access to a job info
 * Returns the job info if user has access, throws otherwise
 * Used as a permission check before performing operations
 */
export async function verifyJobInfoAccessService(jobInfoId: string) {
  const userId = await requireUser();

  const jobInfo = await getJobInfoDal(jobInfoId, userId);

  if (!jobInfo) {
    throw new NotFoundError(
      "Job posting not found or you don't have permission to access it."
    );
  }

  return { jobInfo, userId };
}
