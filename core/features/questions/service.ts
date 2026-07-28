import { requireUser } from "@/core/lib/requireUser";
import { NotFoundError } from "@/core/lib/errors";
import {
  getQuestionByIdDal,
  getQuestionsDal,
  insertQuestionDal,
} from "@/core/features/questions/dal";
import { getJobInfoDal } from "@/core/features/jobInfos/dal";
import { QUESTION_SERVICE_ERRORS } from "@/core/features/questions/serviceErrors";
import { QuestionDifficulty } from "@/core/drizzle/schema";

/**
 * Service Layer for Questions
 * Handles: Business logic, permissions, ownership verification
 * Throws: UnauthorizedError, NotFoundError, DatabaseError
 */

/**
 * Get all questions for a job info
 * Requires authentication; filters to questions the user owns via jobInfo
 */
export async function getQuestionsService(jobInfoId: string) {
  const user = await requireUser();
  return await getQuestionsDal(jobInfoId, user.id);
}

/**
 * Get a single question by ID with ownership verification
 * Requires authentication; returns null if missing or not owned
 */
export async function getQuestionByIdService(questionId: string) {
  const user = await requireUser();
  return await getQuestionByIdDal(questionId, user.id);
}

/**
 * Insert a new question
 * Requires authentication and ownership of the target job info
 */
export async function insertQuestionService(
  question: string,
  jobInfoId: string,
  difficulty: QuestionDifficulty,
) {
  const user = await requireUser();
  const jobInfo = await getJobInfoDal(jobInfoId, user.id);

  if (!jobInfo) {
    throw new NotFoundError(QUESTION_SERVICE_ERRORS.jobInfoNotFoundOrNoAccess);
  }

  return await insertQuestionDal({
    text: question,
    jobInfoId,
    difficulty,
  });
}
