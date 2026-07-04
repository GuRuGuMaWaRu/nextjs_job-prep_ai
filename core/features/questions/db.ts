import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { JobInfoTable, QuestionTable, UserTable } from "@/core/drizzle/schema";
import { revalidateQuestionCache } from "@/core/features/questions/dbCache";

type DbClient = typeof db;
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getQuestionCountWithClient(
  client: DbClient | DbTransaction,
  userId: string,
) {
  const [{ count: questionCount }] = await client
    .select({ count: count() })
    .from(QuestionTable)
    .innerJoin(JobInfoTable, eq(QuestionTable.jobInfoId, JobInfoTable.id))
    .where(and(eq(JobInfoTable.userId, userId)));

  return questionCount;
}

export async function getQuestionCountDb(userId: string) {
  return getQuestionCountWithClient(db, userId);
}

export async function getQuestionsDb(jobInfoId: string) {
  return db.query.QuestionTable.findMany({
    where: eq(QuestionTable.jobInfoId, jobInfoId),
    orderBy: asc(QuestionTable.createdAt),
  });
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

  revalidateQuestionCache({
    id: newQuestion.id,
    jobInfoId: newQuestion.jobInfoId,
  });

  return newQuestion;
}

export async function tryInsertQuestionDb({
  userId,
  question,
  limit,
}: {
  userId: string;
  question: typeof QuestionTable.$inferInsert;
  limit: number;
}): Promise<{ id: string; jobInfoId: string } | null> {
  const newQuestion = await db.transaction(async (tx) => {
    await tx
      .select({ id: UserTable.id })
      .from(UserTable)
      .where(eq(UserTable.id, userId))
      .for("update");

    const questionCount = await getQuestionCountWithClient(tx, userId);

    if (questionCount >= limit) {
      return null;
    }

    const [insertedQuestion] = await tx
      .insert(QuestionTable)
      .values(question)
      .returning({
        id: QuestionTable.id,
        jobInfoId: QuestionTable.jobInfoId,
      });

    return insertedQuestion ?? null;
  });

  if (newQuestion == null) {
    return null;
  }

  revalidateQuestionCache(newQuestion);

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
