import { z } from "zod";

import { createJobInfoDb } from "@core/features/jobInfos/db";
import { JobInfoTable } from "@/core/drizzle/schema";
import { jobInfoSchema } from "@/core/features/jobInfos/schemas";

export async function createTestJobInfo(
  userId: string,
  overrides: Partial<z.infer<typeof jobInfoSchema>> = {},
) {
  const testJobInfo = {
    userId,
    name: "Frontend prep",
    title: "Senior Frontend Engineer",
    experienceLevel: "senior",
    description: "React and Next.js interview preparation.",
    ...overrides,
  } as typeof JobInfoTable.$inferInsert;

  return await createJobInfoDb(testJobInfo);
}
