import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import {
  QuestionTable,
  JobInfoTable,
  QuestionDifficulty,
} from "@/core/drizzle/schema";
import { revalidateQuestionCache } from "@/core/features/questions/dbCache";

export async function getQuestionCountDb(userId: string) {
  const [{ count: questionCount }] = await db
    .select({ count: count() })
    .from(QuestionTable)
    .innerJoin(JobInfoTable, eq(QuestionTable.jobInfoId, JobInfoTable.id))
    .where(and(eq(JobInfoTable.userId, userId)));

  return questionCount;
}

export async function getQuestionsDb(jobInfoId: string) {
  return db.query.QuestionTable.findMany({
    where: eq(QuestionTable.jobInfoId, jobInfoId),
    orderBy: asc(QuestionTable.createdAt),
  });
}

export async function insertQuestionDb(
  question: typeof QuestionTable.$inferInsert
) {
  const [newQuestion] = await db
    .insert(QuestionTable)
    .values(question)
    .returning({
      id: QuestionTable.id,
      jobInfoId: QuestionTable.jobInfoId,
    });

  revalidateQuestionCache({
    id: newQuestion.id,
    jobInfoId: newQuestion.jobInfoId,
  });

  return newQuestion;
}

export async function getQuestionByIdDb(questionId: string) {
  return db.query.QuestionTable.findFirst({
    where: eq(QuestionTable.id, questionId),
  });
}
