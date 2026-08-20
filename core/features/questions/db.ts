import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { QuestionTable, JobInfoTable } from "@/core/drizzle/schema";

export async function getQuestionCountDb(userId: string) {
  const [{ count: questionCount }] = await db
    .select({ count: count() })
    .from(QuestionTable)
    .innerJoin(JobInfoTable, eq(QuestionTable.jobInfoId, JobInfoTable.id))
    .where(and(eq(JobInfoTable.userId, userId)));

  return questionCount;
}

export async function getQuestionsDb(jobInfoId: string, userId: string) {
  const questions = await db
    .select({
      id: QuestionTable.id,
      jobInfoId: QuestionTable.jobInfoId,
      text: QuestionTable.text,
      difficulty: QuestionTable.difficulty,
      createdAt: QuestionTable.createdAt,
      updatedAt: QuestionTable.updatedAt,
    })
    .from(QuestionTable)
    .innerJoin(JobInfoTable, eq(QuestionTable.jobInfoId, JobInfoTable.id))
    .where(
      and(
        eq(QuestionTable.jobInfoId, jobInfoId),
        eq(JobInfoTable.userId, userId),
      ),
    )
    .orderBy(asc(QuestionTable.createdAt));

  return questions;
}

export async function insertQuestionDb(
  question: typeof QuestionTable.$inferInsert,
) {
  const [newQuestion] = await db
    .insert(QuestionTable)
    .values(question)
    .returning({
      id: QuestionTable.id,
      jobInfoId: QuestionTable.jobInfoId,
    });

  return newQuestion;
}

export async function getQuestionByIdDb(questionId: string, userId: string) {
  const question = await db.query.QuestionTable.findFirst({
    where: eq(QuestionTable.id, questionId),
    with: {
      jobInfo: { columns: { id: true, userId: true } },
    },
  });

  if (question == null) return null;

  if (question.jobInfo.userId !== userId) return null;

  return question;
}
