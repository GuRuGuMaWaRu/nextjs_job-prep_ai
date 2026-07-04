import { count, eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import {
  JobInfoTable,
  ResumeAnalysisTable,
  UserTable,
} from "@/core/drizzle/schema";

type DbClient = typeof db;
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getResumeAnalysisCountWithClient(
  client: DbClient | DbTransaction,
  userId: string,
) {
  const [{ count: resumeAnalysisCount }] = await client
    .select({ count: count() })
    .from(ResumeAnalysisTable)
    .innerJoin(JobInfoTable, eq(ResumeAnalysisTable.jobInfoId, JobInfoTable.id))
    .where(eq(JobInfoTable.userId, userId));

  return resumeAnalysisCount;
}

export async function getResumeAnalysisCountDb(userId: string) {
  return getResumeAnalysisCountWithClient(db, userId);
}

export async function insertResumeAnalysisDb(
  client: DbClient | DbTransaction,
  resumeAnalysis: typeof ResumeAnalysisTable.$inferInsert,
) {
  const [newResumeAnalysis] = await client
    .insert(ResumeAnalysisTable)
    .values(resumeAnalysis)
    .returning({ id: ResumeAnalysisTable.id });

  return newResumeAnalysis;
}

/**
 * Atomically reserves one resume analysis slot for a limited-plan user.
 * Serializes concurrent requests per user so quota cannot be exceeded.
 */
export async function tryInsertResumeAnalysisDb({
  userId,
  jobInfoId,
  limit,
}: {
  userId: string;
  jobInfoId: string;
  limit: number | null;
}): Promise<{ id: string } | null> {
  return db.transaction(async (tx) => {
    await tx
      .select({ id: UserTable.id })
      .from(UserTable)
      .where(eq(UserTable.id, userId))
      .for("update");

    const resumeAnalysisCount = await getResumeAnalysisCountWithClient(
      tx,
      userId,
    );

    if (limit !== null && resumeAnalysisCount >= limit) {
      return null;
    }

    const newResumeAnalysis = await insertResumeAnalysisDb(tx, { jobInfoId });

    return newResumeAnalysis ?? null;
  });
}
