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
import { dalAssertSuccess, dalDbOperation } from "@/core/dal/helpers";

export async function getQuestions(jobInfoId: string) {
  "use cache";
  cacheTag(getQuestionJobInfoTag(jobInfoId));

  return dalAssertSuccess(
    await dalDbOperation(async () => await getQuestionsDb(jobInfoId))
  );
}

export async function insertQuestion(
  question: string,
  jobInfoId: string,
  difficulty: QuestionDifficulty
) {
  return dalAssertSuccess(
    await dalDbOperation(
      async () =>
        await insertQuestionDb({
          text: question,
          jobInfoId,
          difficulty,
        })
    )
  );
}

export async function getQuestionById(questionId: string, userId: string) {
  "use cache";
  cacheTag(getQuestionIdTag(questionId));

  return await dalAssertSuccess(
    await dalDbOperation(
      async () => await getQuestionByIdDb(questionId, userId)
    )
  );
}
