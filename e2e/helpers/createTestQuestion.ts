import { QuestionTable } from "@/core/drizzle/schema";
import { insertQuestionDb } from "@core/features/questions/db";

type TestQuestionOverrides = Partial<
  Omit<typeof QuestionTable.$inferInsert, "jobInfoId">
>;

export async function createTestQuestion(
  jobInfoId: string,
  overrides: TestQuestionOverrides = {},
) {
  const testQuestion: typeof QuestionTable.$inferInsert = {
    text: "E2E test question",
    difficulty: "easy" as const,
    ...overrides,
    jobInfoId,
  };

  try {
    return await insertQuestionDb(testQuestion);
  } catch (error) {
    throw new Error(`Failed to seed question for job info "${jobInfoId}".`, {
      cause: error,
    });
  }
}
