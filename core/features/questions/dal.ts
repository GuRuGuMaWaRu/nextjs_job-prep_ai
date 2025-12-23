import { cacheTag } from "next/cache";

import { DatabaseError } from "@/core/dal/helpers";
import {
  getQuestionByIdDb,
  getQuestionsDb,
  insertQuestionDb,
} from "@/core/features/questions/db";
import {
  getQuestionIdTag,
  getQuestionJobInfoTag,
} from "@/core/features/questions/dbCache";
import { QuestionTable } from "@/core/drizzle/schema";

/**
 * DAL Layer for Questions
 * Handles: Data access, caching, error translation
 * Throws: DatabaseError
 */

/**
 * Get all questions for a job info
 */
export async function getQuestionsDal(jobInfoId: string) {
  "use cache";
  cacheTag(getQuestionJobInfoTag(jobInfoId));

  try {
    return await getQuestionsDb(jobInfoId);
  } catch (error) {
    console.error("Database error getting questions:", error);
    throw new DatabaseError("Failed to fetch questions from database", error);
  }
}

/**
 * Get a single question by ID with ownership verification
 */
export async function getQuestionByIdDal(questionId: string, userId: string) {
  "use cache";
  cacheTag(getQuestionIdTag(questionId));

  try {
    return await getQuestionByIdDb(questionId, userId);
  } catch (error) {
    console.error("Database error getting question:", error);
    throw new DatabaseError("Failed to fetch question from database", error);
  }
}

/**
 * Insert a new question
 */
export async function insertQuestionDal(
  question: typeof QuestionTable.$inferInsert
) {
  try {
    return await insertQuestionDb(question);
  } catch (error) {
    console.error("Database error inserting question:", error);
    throw new DatabaseError("Failed to save question to database", error);
  }
}
