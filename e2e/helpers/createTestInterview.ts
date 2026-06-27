import { InterviewTable } from "@/core/drizzle/schema";
import { insertInterviewDb } from "@core/features/interviews/db";

type TestInterviewOverrides = Partial<
  Omit<typeof InterviewTable.$inferInsert, "jobInfoId">
>;

export async function createTestInterview(
  jobInfoId: string,
  overrides: TestInterviewOverrides = {},
) {
  const testInterview: typeof InterviewTable.$inferInsert = {
    duration: "5m",
    humeChatId: "e2e-completed-interview",
    ...overrides,
    jobInfoId,
  };

  try {
    return await insertInterviewDb(testInterview);
  } catch (error) {
    throw new Error(`Failed to seed interview for job info "${jobInfoId}".`, {
      cause: error,
    });
  }
}
