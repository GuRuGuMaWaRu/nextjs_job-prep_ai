"use server";

import { QuestionDifficulty } from "@/core/drizzle/schema";
import {
  getQuestionByIdService,
  getQuestionsService,
  insertQuestionService,
} from "@/core/features/questions/service";

/**
 * Action Layer for Questions
 * Handles: Delegates to service layer, lets errors bubble to error boundaries
 * These actions are called from pages/components that have error boundaries
 */

/**
 * Get all questions for a job info
 * Used in pages - errors bubble up to error boundary
 */
export async function getQuestionsAction(jobInfoId: string) {
  try {
    return await getQuestionsService(jobInfoId);
  } catch (error) {
    throw new Error(`Failed to get questions for job info "${jobInfoId}".`, {
      cause: error,
    });
  }
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
  try {
    return await insertQuestionService(question, jobInfoId, difficulty);
  } catch (error) {
    throw new Error(
      `Failed to insert question for job info "${jobInfoId}" with difficulty "${difficulty}".`,
      { cause: error },
    );
  }
}

/**
 * Get a single question by ID
 * Used in pages - errors bubble up to error boundary
 */
export async function getQuestionByIdAction(questionId: string) {
  try {
    return await getQuestionByIdService(questionId);
  } catch (error) {
    throw new Error(`Failed to get question "${questionId}".`, {
      cause: error,
    });
  }
}
