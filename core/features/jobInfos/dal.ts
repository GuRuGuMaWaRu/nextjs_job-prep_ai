import { cacheTag } from "next/cache";

import {
  createJobInfoDb,
  getJobInfoByIdDb,
  getJobInfoDb,
  updateJobInfoDb,
  getJobInfosDb,
} from "./db";
import { getJobInfoIdTag, getJobInfoGlobalTag } from "./dbCache";
import { DatabaseError } from "@/core/dal/helpers";
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
    return await createJobInfoDb(data);
  } catch (error) {
    console.error("Database error creating job info:", error);
    throw new DatabaseError(
      "Failed to save job information to database",
      error
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
      error
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
      error
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
      error
    );
  }
}

/**
 * Update job info by ID
 */
export async function updateJobInfoDal(
  id: string,
  data: Partial<typeof JobInfoTable.$inferInsert>
) {
  try {
    return await updateJobInfoDb(id, data);
  } catch (error) {
    console.error("Database error updating job info:", error);
    throw new DatabaseError(
      "Failed to update job information in database",
      error
    );
  }
}
