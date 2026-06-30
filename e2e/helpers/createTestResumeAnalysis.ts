import { ResumeAnalysisTable } from "@/core/drizzle/schema";
import { insertResumeAnalysisDb } from "@/core/features/resumeAnalysis/db";

type TestResumeAnalysisOverrides = Partial<
  Omit<typeof ResumeAnalysisTable.$inferInsert, "jobInfoId">
>;

export async function createTestResumeAnalysis(
  jobInfoId: string,
  overrides: TestResumeAnalysisOverrides = {},
) {
  const testResumeAnalysis: typeof ResumeAnalysisTable.$inferInsert = {
    ...overrides,
    jobInfoId,
  };

  try {
    return await insertResumeAnalysisDb(testResumeAnalysis);
  } catch (error) {
    throw new Error(
      `Failed to seed resume analysis for job info "${jobInfoId}".`,
      { cause: error },
    );
  }
}
