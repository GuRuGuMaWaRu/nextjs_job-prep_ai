import { eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { InterviewTable } from "@/core/drizzle/schema";
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
        },
      },
    },
  });

  return interview;
}

export async function insertInterviewDb(
  interview: typeof InterviewTable.$inferInsert
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

export async function updateInterviewDb(
  id: string,
  interview: Partial<typeof InterviewTable.$inferInsert>
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
