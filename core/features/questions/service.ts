import { requireUser } from "@/core/dal/helpers";
import {
  getQuestionByIdDal,
  getQuestionsDal,
  insertQuestionDal,
} from "@/core/features/questions/dal";
import { QuestionDifficulty } from "@/core/drizzle/schema";

/**
 * Service Layer for Questions
 * Handles: Business logic, permissions
 * Throws: UnauthorizedError, DatabaseError
 */

/**
 * Get all questions for a job info
 * No auth required here - questions are accessible if you have the jobInfoId
 */
export async function getQuestionsService(jobInfoId: string) {
  return await getQuestionsDal(jobInfoId);
}

/**
 * Get a single question by ID with ownership verification
 * Requires authentication
 */
export async function getQuestionByIdService(questionId: string) {
  const userId = await requireUser();
  return await getQuestionByIdDal(questionId, userId);
}

/**
 * Insert a new question
 * No auth required here - called from AI generation which handles its own auth
 */
export async function insertQuestionService(
  question: string,
  jobInfoId: string,
  difficulty: QuestionDifficulty
) {
  return await insertQuestionDal({
    text: question,
    jobInfoId,
    difficulty,
  });
}
