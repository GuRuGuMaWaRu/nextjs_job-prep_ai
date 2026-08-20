"use server";

import { QuestionDifficulty } from "@/core/drizzle/schema";
import {
  checkQuestionsPermissionService,
  getQuestionByIdService,
  getQuestionsService,
  insertQuestionService,
} from "@/core/features/questions/service";
import { QUESTION_SERVICE_ERRORS } from "@/core/features/questions/serviceErrors";
import { assertUUID } from "@/core/lib/assertUUID";
import { NotFoundError } from "@/core/lib/errors";

/**
 * Action Layer for Questions
 * Handles: Input validation, delegates to service layer
 * These actions are called from pages/components that have error boundaries
 */

/**
 * Get all questions for a job info
 * Used in pages - errors bubble up to error boundary
 */
export async function getQuestionsAction(jobInfoId: string) {
  if (!assertUUID(jobInfoId)) {
    return [];
  }

  return await getQuestionsService(jobInfoId);
}

/**
 * Insert a new question
 * Used from AI generation - errors bubble up to caller
 */
export async function insertQuestionAction(
  question: string,
  jobInfoId: string,
  difficulty: QuestionDifficulty,
) {
  if (!assertUUID(jobInfoId)) {
    throw new NotFoundError(QUESTION_SERVICE_ERRORS.jobInfoNotFoundOrNoAccess);
  }

  return await insertQuestionService(question, jobInfoId, difficulty);
}

/**
 * Get a single question by ID
 * Used in pages - errors bubble up to error boundary
 */
export async function getQuestionByIdAction(questionId: string) {
  if (!assertUUID(questionId)) {
    return null;
  }

  return await getQuestionByIdService(questionId);
}

/**
 * Check if user can generate a new question
 * Used for UI permission checks; errors bubble to callers/error boundaries
 */
export async function canGenerateQuestionsAction(): Promise<boolean> {
  return await checkQuestionsPermissionService();
}
