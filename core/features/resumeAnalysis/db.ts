import { count, eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { JobInfoTable, ResumeAnalysisTable } from "@/core/drizzle/schema";

export async function getResumeAnalysisCountDb(userId: string) {
  const [{ count: resumeAnalysisCount }] = await db
    .select({ count: count() })
    .from(ResumeAnalysisTable)
    .innerJoin(JobInfoTable, eq(ResumeAnalysisTable.jobInfoId, JobInfoTable.id))
    .where(eq(JobInfoTable.userId, userId));

  return resumeAnalysisCount;
}

export async function insertResumeAnalysisDb(
  resumeAnalysis: typeof ResumeAnalysisTable.$inferInsert,
) {
  const [newResumeAnalysis] = await db
    .insert(ResumeAnalysisTable)
    .values(resumeAnalysis)
    .returning({ id: ResumeAnalysisTable.id });

  return newResumeAnalysis;
}
