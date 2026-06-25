import { cacheTag } from "next/cache";

import {
  createJobInfoDb,
  getJobInfoByIdDb,
  getJobInfoDb,
  updateJobInfoDb,
  getJobInfosDb,
  removeJobInfoDb,
} from "@/core/features/jobInfos/db";
import {
  getJobInfoIdTag,
  getJobInfoGlobalTag,
  revalidateJobInfoAndRelatedItemsCache,
  revalidateJobInfoCache,
} from "@/core/features/jobInfos/dbCache";
import { DatabaseError } from "@/core/dal/errors";
import { ActionResult } from "@/core/dal/helpers";
import { JobInfoTable } from "@/core/drizzle/schema";

/**
 * DAL Layer for JobInfo
 * Handles: Data access, caching, error translation
 * Returns: Data or null for not found cases
 * Throws: DatabaseError (only for actual database errors)
 */

/**
 * Create a new job info entry in the database
 */
export async function createJobInfoDal(data: typeof JobInfoTable.$inferInsert) {
  try {
    const newJobInfo = await createJobInfoDb(data);

    revalidateJobInfoCache(newJobInfo);

    return newJobInfo;
  } catch (error) {
    console.error("Database error creating job info:", error);
    throw new DatabaseError(
      "Failed to save job information to database",
      error,
    );
  }
}

/**
 * Get job info by ID for a specific user
 * Returns null if not found or user doesn't have access
 */
export async function getJobInfoDal(id: string, userId: string) {
  "use cache";
  cacheTag(getJobInfoIdTag(id));

  try {
    return await getJobInfoDb(id, userId);
  } catch (error) {
    console.error("Database error getting job info:", error);
    throw new DatabaseError(
      "Failed to fetch job information from database",
      error,
    );
  }
}

/**
 * Get job info by ID without user filtering
 * Returns null if not found
 */
export async function getJobInfoByIdDal(id: string) {
  "use cache";
  cacheTag(getJobInfoIdTag(id));

  try {
    return await getJobInfoByIdDb(id);
  } catch (error) {
    console.error("Database error getting job info by id:", error);
    throw new DatabaseError(
      "Failed to fetch job information from database",
      error,
    );
  }
}

/**
 * Get all job infos for the specified user
 */
export async function getJobInfosDal(userId: string) {
  "use cache";
  cacheTag(getJobInfoGlobalTag());

  try {
    return await getJobInfosDb(userId);
  } catch (error) {
    console.error("Database error getting job infos:", error);
    throw new DatabaseError(
      "Failed to fetch job information from database",
      error,
    );
  }
}

/**
 * Update job info by ID
 */
export async function updateJobInfoDal(
  id: string,
  data: Partial<typeof JobInfoTable.$inferInsert>,
) {
  try {
    const updatedJobInfo = await updateJobInfoDb(id, data);

    revalidateJobInfoCache(updatedJobInfo);

    return updatedJobInfo;
  } catch (error) {
    console.error("Database error updating job info:", error);
    throw new DatabaseError(
      "Failed to update job information in database",
      error,
    );
  }
}

/**
 * Remove a job info by ID
 */
export async function removeJobInfoDal(
  id: string,
): Promise<ActionResult<typeof JobInfoTable.$inferSelect>> {
  try {
    const deletedJobInfo = await removeJobInfoDb(id);

    revalidateJobInfoAndRelatedItemsCache({
      id: deletedJobInfo.id,
      userId: deletedJobInfo.userId,
    });

    return { success: true, data: deletedJobInfo };
  } catch (error) {
    console.error("Database error removing job info:", error);
    return {
      success: false,
      message: "Failed to remove job information from database",
    };
  }
}
