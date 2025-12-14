import { cacheTag } from "next/cache";

import {
  getQuestionByIdDb,
  getQuestionsDb,
  insertQuestionDb,
} from "@/core/features/questions/db";
import {
  getQuestionIdTag,
  getQuestionJobInfoTag,
} from "@/core/features/questions/dbCache";
import { QuestionDifficulty } from "@/core/drizzle/schema";

export async function getQuestions(jobInfoId: string) {
  "use cache";
  cacheTag(getQuestionJobInfoTag(jobInfoId));

  return getQuestionsDb(jobInfoId);
}

export async function insertQuestion(
  question: string,
  jobInfoId: string,
  difficulty: QuestionDifficulty
) {
  return insertQuestionDb({
    text: question,
    jobInfoId,
    difficulty,
  });
}

export async function getQuestionById(questionId: string) {
  "use cache";
  cacheTag(getQuestionIdTag(questionId));

  return await getQuestionByIdDb(questionId);
}
