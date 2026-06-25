import { and, desc, eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { JobInfoTable } from "@/core/drizzle/schema";

export async function createJobInfoDb(
  jobInfo: typeof JobInfoTable.$inferInsert,
) {
  const [newJobInfo] = await db.insert(JobInfoTable).values(jobInfo).returning({
    id: JobInfoTable.id,
    userId: JobInfoTable.userId,
  });

  return newJobInfo;
}

export async function updateJobInfoDb(
  id: string,
  jobInfo: Partial<typeof JobInfoTable.$inferInsert>,
) {
  const [updatedJobInfo] = await db
    .update(JobInfoTable)
    .set(jobInfo)
    .where(eq(JobInfoTable.id, id))
    .returning({
      id: JobInfoTable.id,
      userId: JobInfoTable.userId,
    });

  return updatedJobInfo;
}

export async function getJobInfoDb(id: string, userId: string) {
  return await db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
  });
}

export async function getJobInfoByIdDb(id: string) {
  return await db.query.JobInfoTable.findFirst({
    where: eq(JobInfoTable.id, id),
  });
}

export async function getJobInfosDb(userId: string) {
  return await db.query.JobInfoTable.findMany({
    where: eq(JobInfoTable.userId, userId),
    orderBy: desc(JobInfoTable.updatedAt),
  });
}

export async function removeJobInfoDb(id: string) {
  const [deletedJobInfo] = await db
    .delete(JobInfoTable)
    .where(eq(JobInfoTable.id, id))
    .returning();

  return deletedJobInfo;
}
