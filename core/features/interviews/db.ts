import { and, count, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { InterviewTable, JobInfoTable, UserTable } from "@/core/drizzle/schema";
import { revalidateInterviewCache } from "@/core/features/interviews/dbCache";

export async function getInterviewByIdDb(id: string) {
  const interview = await db.query.InterviewTable.findFirst({
    where: eq(InterviewTable.id, id),
    with: {
      jobInfo: {
        columns: {
          id: true,
          userId: true,
          title: true,
          description: true,
          experienceLevel: true,
        },
      },
    },
  });

  return interview;
}

export async function insertInterviewDb(
  interview: typeof InterviewTable.$inferInsert,
) {
  const [newInterview] = await db
    .insert(InterviewTable)
    .values(interview)
    .returning({ id: InterviewTable.id, jobInfoId: InterviewTable.jobInfoId });

  revalidateInterviewCache({
    id: newInterview.id,
    jobInfoId: newInterview.jobInfoId,
  });

  return newInterview;
}

type DbClient = typeof db;
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getInterviewCountWithClient(
  client: DbClient | DbTransaction,
  userId: string,
) {
  const [{ count: interviewCount }] = await client
    .select({ count: count() })
    .from(InterviewTable)
    .innerJoin(JobInfoTable, eq(InterviewTable.jobInfoId, JobInfoTable.id))
    .where(eq(JobInfoTable.userId, userId));

  return interviewCount;
}

export async function tryInsertInterviewDb({
  userId,
  interview,
  limit,
}: {
  userId: string;
  interview: typeof InterviewTable.$inferInsert;
  limit: number;
}): Promise<{ id: string; jobInfoId: string } | null> {
  const newInterview = await db.transaction(async (tx) => {
    await tx
      .select({ id: UserTable.id })
      .from(UserTable)
      .where(eq(UserTable.id, userId))
      .for("update");

    const interviewCount = await getInterviewCountWithClient(tx, userId);

    if (interviewCount >= limit) {
      return null;
    }

    const [insertedInterview] = await tx
      .insert(InterviewTable)
      .values(interview)
      .returning({
        id: InterviewTable.id,
        jobInfoId: InterviewTable.jobInfoId,
      });

    return insertedInterview ?? null;
  });

  if (newInterview == null) {
    return null;
  }

  revalidateInterviewCache(newInterview);

  return newInterview;
}

export async function updateInterviewDb(
  id: string,
  interview: Partial<typeof InterviewTable.$inferInsert>,
) {
  const [updatedInterview] = await db
    .update(InterviewTable)
    .set(interview)
    .where(eq(InterviewTable.id, id))
    .returning({ id: InterviewTable.id, jobInfoId: InterviewTable.jobInfoId });

  revalidateInterviewCache({
    id: updatedInterview.id,
    jobInfoId: updatedInterview.jobInfoId,
  });

  return updatedInterview;
}

export async function getInterviewCountDb(userId: string) {
  return getInterviewCountWithClient(db, userId);
}

export async function getInterviewsDb(jobInfoId: string, userId: string) {
  const data = await db.query.InterviewTable.findMany({
    where: and(
      eq(InterviewTable.jobInfoId, jobInfoId),
      isNotNull(InterviewTable.humeChatId),
    ),
    with: { jobInfo: { columns: { userId: true } } },
    orderBy: desc(InterviewTable.updatedAt),
  });

  return data.filter((interview) => interview.jobInfo.userId === userId);
}
