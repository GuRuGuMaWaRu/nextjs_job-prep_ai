import { InterviewTable } from "@/core/drizzle/schema";
import { insertInterviewDb } from "@core/features/interviews/db";

type TestInterviewOverrides = Partial<typeof InterviewTable.$inferInsert>;

export async function createTestInterview(
  jobInfoId: string,
  overrides: TestInterviewOverrides = {},
) {
  const testInterview: typeof InterviewTable.$inferInsert = {
    jobInfoId,
    duration: "5m",
    humeChatId: "e2e-completed-interview",
    ...overrides,
  };

  return await insertInterviewDb(testInterview);
}
