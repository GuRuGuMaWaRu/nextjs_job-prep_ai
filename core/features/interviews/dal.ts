import { cacheTag } from "next/cache";

import { DatabaseError } from "@/core/dal/helpers";
import {
  getInterviewByIdDb,
  getInterviewsDb,
  insertInterviewDb,
  updateInterviewDb,
} from "@/core/features/interviews/db";
import {
  getInterviewIdTag,
  getInterviewJobInfoTag,
} from "@/core/features/interviews/dbCache";
import { getJobInfoIdTag } from "@/core/features/jobInfos/dbCache";
import { InterviewTable } from "@/core/drizzle/schema";

/**
 * DAL Layer for Interviews
 * Handles: Data access, caching, error translation
 * Returns: Data or null for not found cases
 * Throws: DatabaseError (only for actual database errors)
 */

/**
 * Get interview by ID
 * Returns interview with jobInfo, or null if not found
 */
export async function getInterviewByIdDal(id: string) {
  "use cache";
  cacheTag(getInterviewIdTag(id));

  try {
    const interview = await getInterviewByIdDb(id);

    if (interview) {
      cacheTag(getJobInfoIdTag(interview.jobInfo.id));
    }

    return interview;
  } catch (error) {
    console.error("Database error getting interview:", error);
    throw new DatabaseError("Failed to fetch interview from database", error);
  }
}

/**
 * Get all interviews for a job info
 * Returns only interviews that belong to the specified user
 */
export async function getInterviewsDal(jobInfoId: string, userId: string) {
  "use cache";
  cacheTag(getInterviewJobInfoTag(jobInfoId));
  cacheTag(getJobInfoIdTag(jobInfoId));

  try {
    return await getInterviewsDb(jobInfoId, userId);
  } catch (error) {
    console.error("Database error getting interviews:", error);
    throw new DatabaseError("Failed to fetch interviews from database", error);
  }
}

/**
 * Insert a new interview
 */
export async function insertInterviewDal(
  interview: typeof InterviewTable.$inferInsert
) {
  try {
    return await insertInterviewDb(interview);
  } catch (error) {
    console.error("Database error inserting interview:", error);
    throw new DatabaseError("Failed to create interview in database", error);
  }
}

/**
 * Update an existing interview
 */
export async function updateInterviewDal(
  id: string,
  interview: Partial<typeof InterviewTable.$inferInsert>
) {
  try {
    return await updateInterviewDb(id, interview);
  } catch (error) {
    console.error("Database error updating interview:", error);
    throw new DatabaseError("Failed to update interview in database", error);
  }
}
