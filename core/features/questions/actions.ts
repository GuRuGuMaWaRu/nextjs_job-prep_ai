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
export async function getQuestions(jobInfoId: string) {
  return await getQuestionsService(jobInfoId);
}

/**
 * Insert a new question
 * Used from AI generation - errors bubble up to caller
 */
export async function insertQuestion(
  question: string,
  jobInfoId: string,
  difficulty: QuestionDifficulty
) {
  return await insertQuestionService(question, jobInfoId, difficulty);
}

/**
 * Get a single question by ID
 * Used in pages - errors bubble up to error boundary
 */
export async function getQuestionById(questionId: string) {
  return await getQuestionByIdService(questionId);
}
