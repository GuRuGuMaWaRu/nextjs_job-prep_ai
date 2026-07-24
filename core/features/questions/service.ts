import { requireUser } from "@/core/dal/helpers";
import { NotFoundError } from "@/core/dal/errors";
import { getJobInfoDal } from "@/core/features/jobInfos/dal";
import {
  getQuestionByIdDal,
  getQuestionsDal,
  insertQuestionDal,
} from "@/core/features/questions/dal";
import { QuestionDifficulty } from "@/core/drizzle/schema";

/**
 * Service Layer for Questions
 * Handles: Business logic, permissions
 * Throws: UnauthorizedError, NotFoundError, DatabaseError
 */

/**
 * Ensure the signed-in user owns the job info before reading or writing questions.
 */
async function requireOwnedJobInfo(jobInfoId: string) {
  const userId = await requireUser();
  const jobInfo = await getJobInfoDal(jobInfoId, userId);

  if (jobInfo == null) {
    throw new NotFoundError("Job info not found or access denied");
  }

  return { userId, jobInfo };
}

/**
 * Get all questions for a job info owned by the current user.
 */
export async function getQuestionsService(jobInfoId: string) {
  await requireOwnedJobInfo(jobInfoId);
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
 * Insert a new question for a job info owned by the current user.
 */
export async function insertQuestionService(
  question: string,
  jobInfoId: string,
  difficulty: QuestionDifficulty,
) {
  await requireOwnedJobInfo(jobInfoId);

  return await insertQuestionDal({
    text: question,
    jobInfoId,
    difficulty,
  });
}
