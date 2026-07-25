import { z } from "zod";

import { jobInfoSchema } from "./schemas";
import {
  createJobInfoDal,
  getJobInfoDal,
  getJobInfoByIdDal,
  getJobInfosDal,
  updateJobInfoDal,
  removeJobInfoDal,
} from "@/core/features/jobInfos/dal";
import { NotFoundError, PermissionError } from "@/core/dal/errors";
import { requireUser } from "@/core/dal/helpers";
import { JOB_INFO_SERVICE_ERRORS } from "@/core/features/jobInfos/serviceErrors";

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
  data: z.infer<typeof jobInfoSchema>,
) {
  // Get authenticated user (throws if not logged in)
  const user = await requireUser();

  // Business rule: Could check plan limits here
  // For now, all authenticated users can create job infos

  // Call DAL to persist data
  const jobInfo = await createJobInfoDal({
    ...data,
    userId: user.id,
  });

  return jobInfo;
}

/**
 * Update an existing job info
 * Enforces: User must own the job info
 */
export async function updateJobInfoService(
  id: string,
  data: z.infer<typeof jobInfoSchema>,
) {
  const user = await requireUser();

  const existingJobInfo = await getJobInfoDal(id, user.id);

  if (!existingJobInfo) {
    throw new NotFoundError(JOB_INFO_SERVICE_ERRORS.notFoundOrNoEditPermission);
  }

  if (existingJobInfo.userId !== user.id) {
    throw new PermissionError(JOB_INFO_SERVICE_ERRORS.editForbidden);
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
  const user = await requireUser();
  // This checks both auth and ownership, returns null if not found
  return await getJobInfoDal(id, user.id);
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
  const user = await requireUser();
  return await getJobInfosDal(user.id);
}

/**
 * Verify user has access to a job info
 * Returns the job info if user has access, throws otherwise
 * Used as a permission check before performing operations
 */
export async function verifyJobInfoAccessService(jobInfoId: string) {
  const user = await requireUser();

  const jobInfo = await getJobInfoDal(jobInfoId, user.id);

  if (!jobInfo) {
    throw new NotFoundError(JOB_INFO_SERVICE_ERRORS.notFoundOrNoAccess);
  }

  return { jobInfo, userId: user.id };
}

/**
 * Remove a job info by ID
 * Used in pages to remove a job info + all related interviews and questions
 */
export async function removeJobInfoService(id: string) {
  const user = await requireUser();

  const jobInfo = await getJobInfoDal(id, user.id);

  if (!jobInfo) {
    throw new NotFoundError(
      JOB_INFO_SERVICE_ERRORS.notFoundOrNoDeletePermission,
    );
  }

  return await removeJobInfoDal(id);
}
